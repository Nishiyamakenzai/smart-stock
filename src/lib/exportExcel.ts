import * as XLSX from "xlsx";
import type {
  Project, ComputedData, Targets, BSData, ShareRateState,
  PrevPeriod, MonthlyFixed, AnnualBudget, FixedCosts,
} from "./types";
import { YAMANASHI_MUNICIPALITIES, totalV, totalF } from "./data";

const MS12 = ["12月","1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月"];
const n1 = (v: number) => Math.round(v * 10) / 10;
const pct = (v: number) => `${(Math.round(v * 10) / 10).toFixed(1)}%`;

function growthLabel(cur: number, pv: number): string {
  if (pv === 0) return "—";
  if (pv < 0 && cur >= 0) return "黒字転換";
  if (pv >= 0 && cur < 0) return "赤字転落";
  const g = (cur - pv) / Math.abs(pv) * 100;
  return `${g >= 0 ? "+" : ""}${(Math.round(g * 10) / 10).toFixed(1)}%`;
}

function sumF1(f: FixedCosts) { return (f.f1.exec+f.f1.salary+f.f1.bonus+f.f1.social+f.f1.welfare); }
function sumF2(f: FixedCosts) { return (f.f2.rent+f.f2.repair+f.f2.fuel); }
function sumF3(f: FixedCosts) { return (f.f3.adWeb+f.f3.adFlyer+f.f3.adPortal+f.f3.adSign+f.f3.adYoutube+f.f3.system+f.f3.telecom+f.f3.travel+f.f3.training+f.f3.supplies+f.f3.other); }
function mfVal(mf: MonthlyFixed, i: number): FixedCosts {
  return mf[i] ?? { f1:{exec:0,salary:0,bonus:0,social:0,welfare:0}, f2:{rent:0,repair:0,fuel:0}, f3:{adWeb:0,adFlyer:0,adPortal:0,adSign:0,adYoutube:0,system:0,telecom:0,travel:0,training:0,supplies:0,other:0}, f4:{interest:0}, f5:{insurance:0,advisor:0,membership:0,misc:0} };
}

export function exportToExcel(params: {
  projects: Project[];
  comp: ComputedData;
  targets: Targets;
  bs: BSData;
  shareRate: ShareRateState;
  prev: PrevPeriod;
  prev2: PrevPeriod;
  mf: MonthlyFixed;
  ab: AnnualBudget;
}) {
  const { projects, comp, targets, bs, shareRate, prev, prev2, mf, ab } = params;
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,"0")}/${String(now.getDate()).padStart(2,"0")}`;

  // ─── Sheet 1: 経営サマリー ─────────────────────────
  const s1: unknown[][] = [
    ["COATEX 経営サマリー", "", "", "", `出力日：${dateStr}`],
    ["西山建材工業", "", "", "", ""],
    [],
    ["■ 目標達成状況"],
    ["項目", "目標", "実績", "達成率", "残"],
    ["PQ 売上（万円）",  targets.pq, n1(comp.totalPQ), pct(comp.totalPQ/targets.pq*100), n1(targets.pq-comp.totalPQ)],
    ["MQ 粗利（万円）",  targets.mq, n1(comp.totalMQ), pct(comp.totalMQ/targets.mq*100), n1(targets.mq-comp.totalMQ)],
    ["G 利益（万円）",   targets.g,  n1(comp.totalG),  targets.g!==0 ? pct(comp.totalG/targets.g*100) : "—", n1(targets.g-comp.totalG)],
    ["Q 件数（件）",    targets.q,  comp.totalQ,       pct(comp.totalQ/targets.q*100), targets.q-comp.totalQ],
    [],
    ["■ 期別比較"],
    ["項目", "前々期", "前期", "今期", "前期比"],
    ["PQ 売上（万円）",   prev2.pq,   prev.pq,   n1(comp.totalPQ), growthLabel(comp.totalPQ, prev.pq)],
    ["VQ 変動費（万円）", prev2.vq,   prev.vq,   n1(comp.totalVQ), growthLabel(comp.totalVQ, prev.vq)],
    ["MQ 粗利（万円）",  prev2.mq,  prev.mq,   n1(comp.totalMQ), growthLabel(comp.totalMQ, prev.mq)],
    ["F 固定費（万円）",  prev2.f,   prev.f,    n1(comp.totalF),  growthLabel(comp.totalF,  prev.f)],
    ["G 利益（万円）",   prev2.g,   prev.g,    n1(comp.totalG),  growthLabel(comp.totalG,  prev.g)],
    ["Q 件数（件）",    prev2.q,   prev.q,    comp.totalQ,      growthLabel(comp.totalQ,  prev.q)],
    ["平均単価P（万円）", prev2.avgP, prev.avgP, n1(comp.avgP),   growthLabel(comp.avgP,    prev.avgP)],
    [],
    ["■ 主要指標"],
    ["MQ率（粗利率）",    "", "", pct(comp.totalMRate),      ""],
    ["f/m比率",          "", "", pct(comp.totalFMRatio*100), ""],
    ["平均単価P（万円）", "", "", n1(comp.avgP),             ""],
    ["稼働月数",          "", "", `${comp.activeMonths}ヶ月`, ""],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(s1);
  ws1["!cols"] = [{wch:22},{wch:12},{wch:12},{wch:12},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws1, "経営サマリー");

  // ─── Sheet 2: 案件一覧 ─────────────────────────────
  const projHeader = ["ID","案件名","施工月","PQ（万）","VQ（万）","MQ（万）","MQ率","ステータス","エリア","契約年月"];
  const projRows: unknown[][] = projects.map(p => {
    const vq = totalV(p.v);
    const mq = p.p - vq;
    const areaName = YAMANASHI_MUNICIPALITIES.find(m => m.id===p.area)?.name ?? p.area ?? "";
    return [p.id, p.name, MS12[p.month]??`${p.month}月`, n1(p.p), n1(vq), n1(mq),
      p.p>0 ? pct(mq/p.p*100) : "0.0%", p.status, areaName, p.contractDate??"-"];
  });
  const tPQ = projects.reduce((s,p)=>s+p.p,0);
  const tVQ = projects.reduce((s,p)=>s+totalV(p.v),0);
  const tMQ = tPQ - tVQ;
  projRows.push([]);
  projRows.push(["", "合計", "", n1(tPQ), n1(tVQ), n1(tMQ), tPQ>0?pct(tMQ/tPQ*100):"—", "", "", ""]);
  const ws2 = XLSX.utils.aoa_to_sheet([projHeader, ...projRows]);
  ws2["!cols"] = [{wch:5},{wch:30},{wch:6},{wch:10},{wch:10},{wch:10},{wch:7},{wch:10},{wch:16},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws2, "案件一覧");

  // ─── Sheet 3: 月次データ ───────────────────────────
  const monthHeader = ["月","PQ（万）","VQ（万）","MQ（万）","F（万）","G（万）","Q（件）","MQ率","f/m比率","平均P（万）","累計PQ","累計MQ","累計F"];
  const monthRows: unknown[][] = comp.md.map((d,i) => [
    MS12[i], n1(d.pq), n1(d.vq), n1(d.mq), n1(d.f), n1(d.g), d.q,
    pct(d.mRate), pct(d.fmRatio*100), n1(d.avgP),
    n1(comp.cum[i].cumPQ), n1(comp.cum[i].cumMQ), n1(comp.cum[i].cumF),
  ]);
  monthRows.push([]);
  monthRows.push(["合計/平均", n1(comp.totalPQ), n1(comp.totalVQ), n1(comp.totalMQ), n1(comp.totalF), n1(comp.totalG), comp.totalQ, pct(comp.totalMRate), pct(comp.totalFMRatio*100), n1(comp.avgP),"","",""]);
  const ws3 = XLSX.utils.aoa_to_sheet([monthHeader, ...monthRows]);
  ws3["!cols"] = [{wch:5},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:7},{wch:7},{wch:9},{wch:10},{wch:10},{wch:10},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws3, "月次データ");

  // ─── Sheet 4: 固定費明細 ───────────────────────────
  const fMonthCols = MS12.map((_,i) => mfVal(mf,i));
  const annualSum = (getter: (f: FixedCosts) => number) => fMonthCols.reduce((s,f)=>s+getter(f),0);
  const fRow = (label: string, getter: (f: FixedCosts) => number): unknown[] =>
    [label, ...fMonthCols.map(f=>n1(getter(f))), n1(annualSum(getter)), n1(getter(ab))];

  const fRows: unknown[][] = [
    ["固定費明細（万円）", ...MS12, "年間合計", "年間予算"],
    fRow("F1 人件費",      f => sumF1(f)),
    fRow("　役員報酬",     f => f.f1.exec),
    fRow("　給与",         f => f.f1.salary),
    fRow("　賞与",         f => f.f1.bonus),
    fRow("　社会保険料",   f => f.f1.social),
    fRow("　福利厚生費",   f => f.f1.welfare),
    fRow("F2 経費",        f => sumF2(f)),
    fRow("　家賃",         f => f.f2.rent),
    fRow("　修繕費",       f => f.f2.repair),
    fRow("　燃料代",       f => f.f2.fuel),
    fRow("F3 戦略費",      f => sumF3(f)),
    fRow("　広告(Web)",    f => f.f3.adWeb),
    fRow("　広告(チラシ)", f => f.f3.adFlyer),
    fRow("　広告(ポータル)",f=> f.f3.adPortal),
    fRow("　広告(看板等)", f => f.f3.adSign),
    fRow("　広告(YouTube)",f => f.f3.adYoutube),
    fRow("　システム利用料",f=> f.f3.system),
    fRow("　通信費",       f => f.f3.telecom),
    fRow("　旅費交通費",   f => f.f3.travel),
    fRow("　研修費",       f => f.f3.training),
    fRow("　消耗品",       f => f.f3.supplies),
    fRow("　その他",       f => f.f3.other),
    fRow("F4 金利",        f => f.f4.interest),
    fRow("F5 保険・顧問等",f => f.f5.insurance+f.f5.advisor+f.f5.membership+f.f5.misc),
    fRow("　保険料",       f => f.f5.insurance),
    fRow("　顧問料",       f => f.f5.advisor),
    fRow("　会費",         f => f.f5.membership),
    fRow("　雑費",         f => f.f5.misc),
    [],
    fRow("合計 F",         f => totalF(f)),
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(fRows);
  ws4["!cols"] = [{wch:18}, ...MS12.map(()=>({wch:7})), {wch:10},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws4, "固定費明細");

  // ─── Sheet 5: B/S 貸借対照表 ──────────────────────
  const totalAsset = bs.cash+bs.receivable+bs.inventory+bs.fixedAsset+bs.otherAsset;
  const totalDebt  = bs.payable+bs.shortLoan+bs.longLoan+bs.otherDebt;
  const netAsset   = totalAsset - totalDebt;
  const ws5 = XLSX.utils.aoa_to_sheet([
    [`貸借対照表（B/S）　出力日：${dateStr}`, "", "", ""],
    [],
    ["【資産の部】（万円）", "", "【負債の部】（万円）", ""],
    ["現預金",           bs.cash,       "買掛金・未払金", bs.payable],
    ["売掛金・受取手形", bs.receivable,  "短期借入金",    bs.shortLoan],
    ["在庫・材料",       bs.inventory,   "長期借入金",    bs.longLoan],
    ["固定資産",         bs.fixedAsset,  "その他負債",    bs.otherDebt],
    ["その他資産",       bs.otherAsset,  "",              ""],
    [],
    ["資産合計", totalAsset, "負債合計", totalDebt],
    ["",         "",         "純資産",   netAsset],
    [],
    ["自己資本比率", totalAsset>0 ? pct(netAsset/totalAsset*100) : "—", "", ""],
  ]);
  ws5["!cols"] = [{wch:20},{wch:12},{wch:20},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws5, "BS貸借対照表");

  // ─── Sheet 6: エリア別シェア率 ─────────────────────
  const y2 = now.getFullYear(), mo2 = now.getMonth();
  const startY = mo2 === 11 ? y2 : y2-1;
  const fyStart = `${startY}-12`, fyEnd = `${startY+1}-11`;
  const inFY = (d?: string) => !!d && d >= fyStart && d <= fyEnd;

  const shareHeader = ["市区町村","戸建て棟数","年間需要（棟）","お気に入り",
    "完工済み（件）","完工済みシェア率","完工見込み（件）","完工見込みシェア率","契約（件）","契約シェア率"];
  const shareRows: unknown[][] = [...YAMANASHI_MUNICIPALITIES]
    .sort((a,b)=>{
      const af = shareRate.favorites.includes(a.id);
      const bf = shareRate.favorites.includes(b.id);
      return af!==bf ? (af?-1:1) : b.homes-a.homes;
    })
    .map(m => {
      const demand = Math.max(1, Math.round(m.homes*0.008));
      const area = projects.filter(p=>p.area===m.id);
      const done     = area.filter(p=>p.status==="完了").length;
      const forecast = area.length;
      const contract = area.filter(p=>inFY(p.contractDate)).length;
      return [
        m.name, m.homes, demand, shareRate.favorites.includes(m.id)?"★":"",
        done,     pct(done/demand*100),
        forecast, pct(forecast/demand*100),
        contract, pct(contract/demand*100),
      ];
    });
  const ws6 = XLSX.utils.aoa_to_sheet([shareHeader, ...shareRows]);
  ws6["!cols"] = [{wch:16},{wch:10},{wch:12},{wch:8},{wch:12},{wch:14},{wch:14},{wch:16},{wch:10},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws6, "エリア別シェア率");

  // ─── ダウンロード ──────────────────────────────────
  const fileName = `COATEX_経営データ_${dateStr.replace(/\//g,"-")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
