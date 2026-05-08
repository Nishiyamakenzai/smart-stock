"use client";
import Badge from "../ui/Badge";
import Bar from "../ui/Bar";
import Gauge from "../ui/Gauge";
import SimpleChart from "../ui/SimpleChart";
import { C, CHART_COLORS } from "@/lib/constants";
import { PREV, PREV2, YAMANASHI_MUNICIPALITIES } from "@/lib/data";
import { fmt1, fmtPct } from "@/lib/utils";
import type { ComputedData, Targets, AIHint, Project, ShareRateState } from "@/lib/types";

interface DashTabProps {
  comp: ComputedData;
  targets: Targets;
  aiHints: AIHint[];
  onOpenFixed: () => void;
  projects: Project[];
  shareRate: ShareRateState;
  onGoShare: () => void;
}

export default function DashTab({ comp, targets, aiHints, onOpenFixed, projects, shareRate, onGoShare }: DashTabProps) {
  const gaps = [
    { l:"PQ 売上", cur:comp.totalPQ, tgt:targets.pq, c:C.blue,   unit:"万" },
    { l:"MQ 粗利", cur:comp.totalMQ, tgt:targets.mq, c:C.purple, unit:"万" },
    { l:"G 利益",  cur:comp.totalG,  tgt:targets.g,  c:C.green,  unit:"万" },
    { l:"Q 件数",  cur:comp.totalQ,  tgt:targets.q,  c:C.yellow, unit:"件" },
  ];
  const cRows = [
    { l:"PQ",    cur:comp.totalPQ, pv:PREV.pq,   p2:PREV2.pq },
    { l:"MQ",    cur:comp.totalMQ, pv:PREV.mq,   p2:PREV2.mq },
    { l:"G",     cur:comp.totalG,  pv:PREV.g,    p2:PREV2.g  },
    { l:"Q",     cur:comp.totalQ,  pv:PREV.q,    p2:PREV2.q  },
    { l:"平均P", cur:comp.avgP,    pv:PREV.avgP, p2:PREV2.avgP, dec:0 },
  ];
  return (
    <>
      <div className="card stagger-item">
        <div className="section-title">AI 経営分析 ソラ</div>
        {aiHints.map((h,i) => <Badge key={i} type={h.t} text={h.s}/>)}
      </div>
      <div className="card stagger-item">
        <div className="section-title">目標達成状況</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {gaps.map(g => {
            const gap = g.tgt - g.cur;
            const achieved = gap <= 0;
            return (
              <div key={g.l} style={{
                padding:"14px 16px",
                background: achieved ? C.greenLight : C.card2,
                borderRadius:12,
                border:"1px solid "+(achieved ? "#a7f3d0" : C.bdr),
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:11, color:C.t2, fontWeight:600 }}>{g.l}</span>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:"2px 8px",
                    background: achieved ? C.green+"20" : C.red+"15",
                    color: achieved ? C.greenDark : C.red, borderRadius:99,
                  }}>{achieved ? "✦ 達成" : `残${fmt1(Math.abs(gap))}${g.unit}`}</span>
                </div>
                <div style={{ fontSize:24, fontWeight:900, color:g.c, lineHeight:1, marginBottom:8 }}>
                  {fmt1(g.cur)}<span style={{ fontSize:11, color:C.t3, marginLeft:2 }}>{g.unit}</span>
                </div>
                <Bar value={g.cur} max={g.tgt} color={g.c} h={6}/>
                <div style={{ fontSize:10, color:C.t3, marginTop:4, textAlign:"right" }}>目標: {fmt1(g.tgt)}{g.unit}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card stagger-item">
        <div className="section-title">f/m 比率 — 経営健全度</div>
        <Gauge ratio={comp.totalFMRatio}/>
      </div>
      <div className="card stagger-item">
        <div className="section-title">月次推移 PQ / MQ / F</div>
        <SimpleChart
          series={[
            { name:"PQ", data:comp.md.map(d => d.pq||null), color:CHART_COLORS.pq, bold:true },
            { name:"MQ", data:comp.md.map(d => d.mq||null), color:CHART_COLORS.mq },
            { name:"F",  data:comp.md.map(d => d.f||null),  color:CHART_COLORS.f  },
          ]}
          labels={comp.md.map(d => d.label)} height={220}
        />
      </div>
      <div className="card stagger-item">
        <div className="section-title">累計 MQ vs 累計 F（損益分岐点）</div>
        <p style={{ fontSize:12, color:C.t2, marginBottom:10 }}>累計MQが累計Fを上回った時点で黒字転換</p>
        <SimpleChart
          series={[
            { name:"累計MQ", data:comp.cum.map(d => d.cumMQ), color:CHART_COLORS.cumMQ, bold:true },
            { name:"累計F",  data:comp.cum.map(d => d.cumF),  color:CHART_COLORS.cumF  },
          ]}
          labels={comp.md.map(d => d.label)} height={200}
        />
      </div>
      <div className="card stagger-item">
        <div className="section-title">期別比較</div>
        <div style={{ overflowX:"auto" }}>
          <table className="data-table">
            <thead><tr><th>項目</th><th>前々期</th><th>前期</th><th style={{color:C.blue}}>今期</th><th>前期比</th></tr></thead>
            <tbody>
              {cRows.map(r => {
                const gr = r.pv != null ? (r.cur - r.pv) / r.pv * 100 : null;
                return (
                  <tr key={r.l}>
                    <td>{r.l}</td>
                    <td style={{color:C.t3}}>{r.p2 != null ? fmt1(r.p2) : "—"}</td>
                    <td style={{color:C.t2}}>{r.pv != null ? fmt1(r.pv) : "—"}</td>
                    <td style={{color:C.blue,fontWeight:800}}>{fmt1(r.cur)}</td>
                    <td>{gr!=null&&<span style={{display:"inline-block",padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:700,background:gr>=0?C.greenLight:C.redLight,color:gr>=0?C.greenDark:C.red}}>{gr>=0?"+":""}{fmtPct(gr)}%</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card stagger-item">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div className="section-title" style={{ margin:0 }}>🗾 エリア別シェア率</div>
          <button onClick={onGoShare} style={{
            fontSize:11, fontWeight:600, color:C.blue,
            background:C.blueLight, border:`1px solid #bfdbfe`,
            borderRadius:8, padding:"4px 10px", cursor:"pointer",
          }}>詳細 →</button>
        </div>
        {(() => {
          const favItems = YAMANASHI_MUNICIPALITIES
            .filter(m => shareRate.favorites.includes(m.id))
            .map(m => {
              const demand = Math.max(1, Math.round(m.homes * 0.008));
              const comp = projects.filter(p => p.area === m.id && p.status === "完了").length;
              const contr = shareRate.contractCounts[m.id] || 0;
              return { m, demand, comp, contr, compPct: comp / demand * 100, contrPct: contr / demand * 100 };
            });
          if (favItems.length === 0) return (
            <p style={{ fontSize:12, color:C.t3, textAlign:"center", padding:"16px 0" }}>
              シェア率タブでお気に入りを設定してください
            </p>
          );
          return (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {favItems.map(({ m, demand, comp, contr, compPct, contrPct }) => (
                <div key={m.id} style={{ background:C.card2, borderRadius:12, padding:"10px 12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:C.t1 }}>★ {m.name}</span>
                    <span style={{ fontSize:10, color:C.t3 }}>需要 {demand}棟/年</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    <div>
                      <div style={{ fontSize:9, color:"#3b82f6", fontWeight:700, marginBottom:3 }}>完工シェア率</div>
                      <div style={{ display:"flex", alignItems:"baseline", gap:3, marginBottom:4 }}>
                        <span style={{ fontSize:20, fontWeight:900, color:"#1d4ed8" }}>{compPct.toFixed(1)}</span>
                        <span style={{ fontSize:10, color:"#3b82f6" }}>%</span>
                        <span style={{ fontSize:10, color:C.t3 }}>{comp}/{demand}棟</span>
                      </div>
                      <div style={{ height:4, background:"#dbeafe", borderRadius:99 }}>
                        <div style={{ width:`${Math.min(compPct, 100)}%`, height:"100%", background:"#3b82f6", borderRadius:99 }}/>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:9, color:"#f97316", fontWeight:700, marginBottom:3 }}>契約シェア率</div>
                      <div style={{ display:"flex", alignItems:"baseline", gap:3, marginBottom:4 }}>
                        <span style={{ fontSize:20, fontWeight:900, color:"#ea580c" }}>{contrPct.toFixed(1)}</span>
                        <span style={{ fontSize:10, color:"#f97316" }}>%</span>
                        <span style={{ fontSize:10, color:C.t3 }}>{contr}/{demand}棟</span>
                      </div>
                      <div style={{ height:4, background:"#fed7aa", borderRadius:99 }}>
                        <div style={{ width:`${Math.min(contrPct, 100)}%`, height:"100%", background:"#f97316", borderRadius:99 }}/>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
      <div className="card stagger-item">
        <div className="section-title">キャッシュフロー概算</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {[
            { l:"入金", v:comp.totalPQ, grad:C.gradGreen },
            { l:"出金", v:comp.totalVQ+comp.totalF, grad:C.gradRed },
            { l:"Net CF", v:comp.totalPQ-comp.totalVQ-comp.totalF, grad:C.gradBlue },
          ].map(it => (
            <div key={it.l} style={{ padding:"16px 14px", borderRadius:14, background:it.grad, color:"#fff", textAlign:"center", boxShadow:"0 4px 12px rgba(0,0,0,.1)" }}>
              <div style={{ fontSize:10, opacity:.8, marginBottom:4, fontWeight:600 }}>{it.l}</div>
              <div style={{ fontSize:20, fontWeight:900 }}>{fmt1(it.v)}<span style={{ fontSize:10, opacity:.75, marginLeft:2 }}>万</span></div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={onOpenFixed} style={{
        width:"100%", padding:"13px",
        background:"#fff", border:"2px dashed #e2e8f0",
        borderRadius:14, fontSize:13, fontWeight:700,
        color:C.t2, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        marginBottom:12,
      }}>⚙ 固定費 F1〜F5 設定</button>
    </>
  );
}
