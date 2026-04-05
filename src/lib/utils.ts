import type { Project, MonthlyFixed, ComputedData, AIHint, Targets } from "./types";
import { MS, VK, STC } from "./constants";
import { totalV, totalF, PREV } from "./data";

export function computeData(projects: Project[], mf: MonthlyFixed): ComputedData {
  const md = MS.map((_, i) => {
    const ps = projects.filter(p => p.month === i);
    const pq = ps.reduce((s, p) => s + p.p, 0);
    const vq = ps.reduce((s, p) => s + totalV(p.v), 0);
    const mq = pq - vq, q = ps.length;
    const fObj = mf[i] || {f1:0,f2:0,f3:0,f4:0,f5:0};
    const f = totalF(fObj), g = mq - f;
    const avgP = q > 0 ? pq / q : 0;
    const avgM = q > 0 ? mq / q : 0;
    const mRate = pq > 0 ? mq / pq * 100 : 0;
    const fmRatio = mq > 0 ? f / mq * 100 : 0;
    const vBreak = {scaffold:0,paint:0,sub:0,material:0,fee:0,fixRoy:0,varRoy:0,other:0};
    VK.forEach(k => {
      vBreak[k as keyof typeof vBreak] = ps.reduce((s, p) => s + (p.v[k as keyof typeof p.v] || 0), 0);
    });
    return {pq,vq,mq,q,f,g,avgP,avgM,mRate,fmRatio,vBreak,label:MS[i].replace("月","")};
  });

  let cPQ=0, cMQ=0, cF=0, cQ=0;
  const cum = md.map(d => {
    cPQ += d.pq; cMQ += d.mq; cF += d.f; cQ += d.q;
    return {cumPQ:cPQ, cumMQ:cMQ, cumF:cF};
  });

  const tPQ=cPQ, tVQ=md.reduce((s,d) => s+d.vq, 0);
  const tMQ=cMQ, tF=cF, tG=tMQ-tF, tQ=cQ;
  const avgP = tQ > 0 ? tPQ / tQ : 0;
  const avgV = tQ > 0 ? tVQ / tQ : 0;
  const avgM = tQ > 0 ? tMQ / tQ : 0;
  const tMRate = tPQ > 0 ? tMQ / tPQ * 100 : 0;
  const tFM = tMQ > 0 ? tF / tMQ * 100 : 0;
  const activeMonths = md.filter(d => d.q > 0).length;

  const pipe: Record<string,number> = {};
  const pipeA: Record<string,number> = {};
  Object.keys(STC).forEach(s => { pipe[s]=0; pipeA[s]=0; });
  projects.forEach(p => {
    pipe[p.status] = (pipe[p.status] || 0) + 1;
    pipeA[p.status] = (pipeA[p.status] || 0) + p.p;
  });

  return {
    md, cum,
    totalPQ:tPQ, totalVQ:tVQ, totalMQ:tMQ, totalF:tF, totalG:tG, totalQ:tQ,
    avgP, avgV, avgM, totalMRate:tMRate, totalFMRatio:tFM,
    activeMonths, pipe, pipeA
  };
}

export function aiProject(p: Project): AIHint[] {
  const tv = totalV(p.v), m = p.p - tv;
  const mr = p.p > 0 ? m / p.p * 100 : 0;
  const o: AIHint[] = [];
  if (mr >= 52) o.push({t:"good", s:"粗利率"+mr.toFixed(1)+"%は優秀"});
  else if (mr >= 48) o.push({t:"good", s:"粗利率"+mr.toFixed(1)+"%で目標圏内"});
  else if (mr >= 40) o.push({t:"warn", s:"粗利率"+mr.toFixed(1)+"% 目標48%に"+(48-mr).toFixed(1)+"pt不足"});
  else o.push({t:"bad", s:"粗利率"+mr.toFixed(1)+"% 要改善"});
  if (tv > 0 && p.v.scaffold / tv > 0.2) o.push({t:"warn", s:"足場代比率高め 相見積もり推奨"});
  if (p.p >= 250) o.push({t:"good", s:"高単価案件 MQ最大化に貢献"});
  return o;
}

export function aiMonth(d: {q:number; mRate:number; g:number; fmRatio:number} | null): AIHint[] {
  if (!d || d.q === 0) return [{t:"info", s:"データなし"}];
  const o: AIHint[] = [];
  if (d.mRate >= 50) o.push({t:"good", s:"粗利率"+d.mRate.toFixed(1)+"% 高収益月"});
  else if (d.mRate < 45) o.push({t:"warn", s:"粗利率"+d.mRate.toFixed(1)+"% 低下"});
  o.push(d.g < 0
    ? {t:"bad", s:"月次赤字"+Math.abs(d.g)+"万"}
    : {t:"good", s:"月次黒字"+d.g+"万"});
  if (d.fmRatio > 100) o.push({t:"bad", s:"f/m比率"+d.fmRatio.toFixed(0)+"% 赤字水域"});
  return o;
}

export function aiOverall(c: ComputedData, tgt: Targets): AIHint[] {
  const o: AIHint[] = [];
  const rem = tgt.pq - c.totalPQ;
  const ml = 12 - c.activeMonths;
  if (rem > 0 && ml > 0)
    o.push({t:"info", s:"目標まであと"+rem.toLocaleString()+"万 残"+ml+"ヶ月で月"+(rem/ml).toFixed(0)+"万必要"});
  else if (rem <= 0)
    o.push({t:"good", s:"PQ売上目標を達成！"});
  if (tgt.g - c.totalG > 0)
    o.push({t:"warn", s:"利益G目標まであと"+(tgt.g-c.totalG).toLocaleString()+"万"});
  else
    o.push({t:"good", s:"利益G目標を達成！"});
  if (PREV.pq > 0) {
    const gr = (c.totalPQ - PREV.pq) / PREV.pq * 100;
    o.push(gr > 0
      ? {t:"good", s:"前期比+"+gr.toFixed(1)+"%"}
      : {t:"warn", s:"前期比"+gr.toFixed(1)+"%"});
  }
  if (c.totalFMRatio <= 59) o.push({t:"good", s:"f/m比率"+c.totalFMRatio.toFixed(1)+"% Sランク"});
  else if (c.totalFMRatio <= 79) o.push({t:"good", s:"f/m比率"+c.totalFMRatio.toFixed(1)+"% Aランク"});
  else if (c.totalFMRatio > 90) o.push({t:"bad", s:"f/m比率"+c.totalFMRatio.toFixed(1)+"% 危険水域"});
  return o;
}

// localStorage helpers (client-side only)
export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
