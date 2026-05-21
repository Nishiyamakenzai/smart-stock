import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  DEMO_PROJECTS, DEMO_MF, DEFAULT_AB, DEFAULT_TARGETS, DEFAULT_BS,
  DEFAULT_SHARE_RATE, PREV, PREV2, migrateMF, migrateAB,
  YAMANASHI_MUNICIPALITIES, totalV, totalF,
} from "@/lib/data";
import { computeData } from "@/lib/utils";
import type {
  Project, MonthlyFixed, AnnualBudget, Targets, BSData,
  ShareRateState, PrevPeriod, ComputedData, FixedCosts,
} from "@/lib/types";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

const DATA_KEYS = ["mq-projects","mq-mf","mq-ab","mq-targets","mq-bs","mq-share","mq-prev","mq-prev2"] as const;
const MS12 = ["12月","1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月"];

// ARGB colors
const C = {
  blue:       "FF3B82F6", blueLight: "FFEFF6FF", blueDark: "FF1E40AF",
  green:      "FF10B981", greenLight:"FFF0FDF4", greenDark:"FF065F46",
  red:        "FFEF4444", redLight:  "FFFEF2F2", redDark:  "FF991B1B",
  orange:     "FFF97316",
  purple:     "FF8B5CF6",
  yellow:     "FFF59E0B",
  header:     "FF1E3A5F",  // deep navy for main headers
  subHeader:  "FF2563EB",
  gray:       "FF64748B",
  grayLight:  "FFF8FAFC",
  grayBorder: "FFE2E8F0",
  white:      "FFFFFFFF",
  black:      "FF0F172A",
};

function n1(v: number) { return Math.round(v * 10) / 10; }
function pctStr(v: number) { return `${(Math.round(v * 10) / 10).toFixed(1)}%`; }
function growthLabel(cur: number, pv: number): string {
  if (pv === 0) return "—";
  if (pv < 0 && cur >= 0) return "黒字転換 ▲";
  if (pv >= 0 && cur < 0) return "赤字転落 ▼";
  const g = (cur - pv) / Math.abs(pv) * 100;
  return `${g >= 0 ? "+" : ""}${(Math.round(g * 10) / 10).toFixed(1)}%`;
}
function growthIsGood(cur: number, pv: number): boolean | null {
  if (pv === 0) return null;
  if (pv < 0 && cur >= 0) return true;
  if (pv >= 0 && cur < 0) return false;
  return cur >= pv;
}

function mfVal(mf: MonthlyFixed, i: number): FixedCosts {
  return mf[i] ?? {
    f1:{exec:0,salary:0,bonus:0,social:0,welfare:0},
    f2:{rent:0,repair:0,fuel:0},
    f3:{adWeb:0,adFlyer:0,adPortal:0,adSign:0,adYoutube:0,system:0,telecom:0,travel:0,training:0,supplies:0,other:0},
    f4:{interest:0},
    f5:{insurance:0,advisor:0,membership:0,misc:0},
  };
}
function sumF3(f: FixedCosts) {
  return f.f3.adWeb+f.f3.adFlyer+f.f3.adPortal+f.f3.adSign+f.f3.adYoutube+f.f3.system+f.f3.telecom+f.f3.travel+f.f3.training+f.f3.supplies+f.f3.other;
}

// ─── セルスタイルヘルパー ─────────────────────────────
type FillArg = { type: "pattern"; pattern: "solid"; fgColor: { argb: string } };
function fill(argb: string): FillArg { return { type:"pattern", pattern:"solid", fgColor:{argb} }; }
function font(bold=false, size=10, argb=C.black, name="Meiryo"): Partial<ExcelJS.Font> { return {bold,size,color:{argb},name}; }
function border(argb=C.grayBorder): Partial<ExcelJS.Borders> {
  const s: ExcelJS.Border = {style:"thin",color:{argb}};
  return {top:s,bottom:s,left:s,right:s};
}
function thickBorder(argb=C.blue): Partial<ExcelJS.Borders> {
  const s: ExcelJS.Border = {style:"medium",color:{argb}};
  return {top:s,bottom:s,left:s,right:s};
}

function styleMainHeader(cell: ExcelJS.Cell, text: string) {
  cell.value = text;
  cell.font = font(true, 14, C.white);
  cell.fill = fill(C.header);
  cell.alignment = {vertical:"middle", horizontal:"left"};
}
function styleSubHeader(cell: ExcelJS.Cell, text: string) {
  cell.value = text;
  cell.font = font(true, 11, C.white);
  cell.fill = fill(C.subHeader);
  cell.alignment = {vertical:"middle", horizontal:"center"};
  cell.border = border(C.blueDark);
}
function styleColHeader(cell: ExcelJS.Cell, text: string, bgArgb=C.header) {
  cell.value = text;
  cell.font = font(true, 9, C.white);
  cell.fill = fill(bgArgb);
  cell.alignment = {vertical:"middle", horizontal:"center", wrapText:true};
  cell.border = border(C.blueDark);
}
function styleData(cell: ExcelJS.Cell, value: ExcelJS.CellValue, align: "left"|"right"|"center"="right", numFmt?: string) {
  cell.value = value;
  cell.font = font(false, 10, C.black);
  cell.fill = fill(C.grayLight);
  cell.alignment = {vertical:"middle", horizontal:align};
  cell.border = border();
  if (numFmt) cell.numFmt = numFmt;
}
function styleDataAlt(cell: ExcelJS.Cell, value: ExcelJS.CellValue, align: "left"|"right"|"center"="right") {
  cell.value = value;
  cell.font = font(false, 10, C.black);
  cell.fill = fill(C.white);
  cell.alignment = {vertical:"middle", horizontal:align};
  cell.border = border();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function GET() {
  // 認証チェック
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  // DB からデータ取得
  const { data: rows } = await getSupabase()
    .from("app_data").select("key,value").in("key", DATA_KEYS);
  const get = (key: string, def: unknown) => rows?.find(r=>r.key===key)?.value ?? def;

  const projects   = get("mq-projects", DEMO_PROJECTS) as Project[];
  const mf         = migrateMF(get("mq-mf", DEMO_MF));
  const ab         = migrateAB(get("mq-ab", DEFAULT_AB));
  const targets    = get("mq-targets", DEFAULT_TARGETS) as Targets;
  const bs         = get("mq-bs", DEFAULT_BS) as BSData;
  const shareRate  = get("mq-share", DEFAULT_SHARE_RATE) as ShareRateState;
  const prev       = get("mq-prev", PREV) as PrevPeriod;
  const prev2      = get("mq-prev2", PREV2) as PrevPeriod;
  const comp: ComputedData = computeData(projects, mf);

  const now = new Date();
  const dateStr = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,"0")}/${String(now.getDate()).padStart(2,"0")}`;
  const y2 = now.getFullYear(), mo2 = now.getMonth();
  const startY = mo2 === 11 ? y2 : y2-1;
  const fyStart = `${startY}-12`, fyEnd = `${startY+1}-11`;
  const inFY = (d?: string) => !!d && d >= fyStart && d <= fyEnd;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const wb = new ExcelJS.Workbook();
  wb.creator = "COATEX";
  wb.created = now;

  // ─────────────────────────────────────────────────────
  // SHEET 1: 経営サマリー
  // ─────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet("📊 経営サマリー", { views:[{state:"frozen",xSplit:0,ySplit:3}] });
  ws1.properties.defaultRowHeight = 22;

  // タイトル行
  ws1.mergeCells("A1:F1");
  const title = ws1.getCell("A1");
  title.value = "COATEX  経営管理レポート　　西山建材工業";
  title.font = font(true, 16, C.white, "Meiryo");
  title.fill = fill(C.header);
  title.alignment = {vertical:"middle", horizontal:"left"};
  ws1.getRow(1).height = 34;

  ws1.mergeCells("A2:D2");
  ws1.getCell("A2").value = `今期：${fyStart.replace("-","年")}月 〜 ${fyEnd.replace("-","年")}月`;
  ws1.getCell("A2").font = font(false, 10, C.white);
  ws1.getCell("A2").fill = fill(C.subHeader);
  ws1.getCell("A2").alignment = {vertical:"middle", horizontal:"left"};
  ws1.mergeCells("E2:F2");
  ws1.getCell("E2").value = `出力日：${dateStr}`;
  ws1.getCell("E2").font = font(false, 10, C.white);
  ws1.getCell("E2").fill = fill(C.subHeader);
  ws1.getCell("E2").alignment = {vertical:"middle", horizontal:"right"};
  ws1.getRow(2).height = 20;
  ws1.getRow(3).height = 6; // spacer

  // 目標達成状況
  ws1.mergeCells("A4:F4");
  styleMainHeader(ws1.getCell("A4"), "  ■ 目標達成状況");
  ws1.getRow(4).height = 28;

  ["項目","目標","実績","達成率","残","状況"].forEach((h,i) => {
    styleColHeader(ws1.getCell(5, i+1), h);
  });
  ws1.getRow(5).height = 22;

  const tgtRows: [string, number, number, string][] = [
    ["PQ 売上（万円）", targets.pq, n1(comp.totalPQ), "万円"],
    ["MQ 粗利（万円）", targets.mq, n1(comp.totalMQ), "万円"],
    ["G 利益（万円）",  targets.g,  n1(comp.totalG),  "万円"],
    ["Q 件数",          targets.q,  comp.totalQ,       "件"],
  ];
  tgtRows.forEach(([label, tgt, cur, unit], ri) => {
    const row = ws1.getRow(6 + ri);
    row.height = 24;
    const achieved = cur >= tgt;
    const pctVal = tgt !== 0 ? cur/tgt*100 : 0;
    const styleFn = ri % 2 === 0 ? styleData : styleDataAlt;
    styleFn(row.getCell(1), label, "left");
    row.getCell(1).font = font(true, 10, C.black);
    styleFn(row.getCell(2), tgt, "right", "#,##0.0");
    styleFn(row.getCell(3), cur, "right", "#,##0.0");
    const pctCell = row.getCell(4);
    pctCell.value = pctVal / 100;
    pctCell.numFmt = "0.0%";
    pctCell.font = font(true, 10, achieved ? C.greenDark : C.red);
    pctCell.fill = fill(achieved ? C.greenLight : C.redLight);
    pctCell.alignment = {vertical:"middle", horizontal:"center"};
    pctCell.border = border();
    const gap = tgt - cur;
    styleFn(row.getCell(5), Math.abs(gap), "right", "#,##0.0");
    row.getCell(5).font = font(false, 10, achieved ? C.greenDark : C.red);
    const statusCell = row.getCell(6);
    statusCell.value = achieved ? `✦ 達成 (+${n1(Math.abs(gap))}${unit})` : `残 ${n1(gap)}${unit}`;
    statusCell.font = font(true, 10, achieved ? C.greenDark : C.red);
    statusCell.fill = fill(achieved ? C.greenLight : C.redLight);
    statusCell.alignment = {vertical:"middle", horizontal:"center"};
    statusCell.border = border();
  });

  // 期別比較
  ws1.getRow(11).height = 10;
  ws1.mergeCells("A12:F12");
  styleMainHeader(ws1.getCell("A12"), "  ■ 期別比較");
  ws1.getRow(12).height = 28;

  ["項目","前々期","前期","今期","前期比","評価"].forEach((h,i) => {
    styleColHeader(ws1.getCell(13, i+1), h);
  });
  ws1.getRow(13).height = 22;

  const cmpRows: [string, number, number, number][] = [
    ["PQ 売上（万円）", prev2.pq, prev.pq, n1(comp.totalPQ)],
    ["VQ 変動費（万円）",prev2.vq, prev.vq, n1(comp.totalVQ)],
    ["MQ 粗利（万円）", prev2.mq, prev.mq, n1(comp.totalMQ)],
    ["F 固定費（万円）", prev2.f,  prev.f,  n1(comp.totalF)],
    ["G 利益（万円）",  prev2.g,  prev.g,  n1(comp.totalG)],
    ["Q 件数",          prev2.q,  prev.q,  comp.totalQ],
    ["平均単価P（万）",  prev2.avgP,prev.avgP,n1(comp.avgP)],
  ];
  cmpRows.forEach(([label, p2, pv, cur], ri) => {
    const row = ws1.getRow(14 + ri);
    row.height = 22;
    const good = growthIsGood(cur, pv);
    const styleFn = ri % 2 === 0 ? styleData : styleDataAlt;
    styleFn(row.getCell(1), label, "left");
    row.getCell(1).font = font(true, 10, C.black);
    styleFn(row.getCell(2), p2, "right", "#,##0.0");
    row.getCell(2).font = font(false, 10, C.gray);
    const pvCell = row.getCell(3);
    pvCell.value = pv;
    pvCell.numFmt = "#,##0.0";
    pvCell.font = font(false, 10, pv < 0 ? C.red : C.black);
    pvCell.fill = fill(ri % 2 === 0 ? C.grayLight : C.white);
    pvCell.alignment = {vertical:"middle", horizontal:"right"};
    pvCell.border = border();
    const curCell = row.getCell(4);
    curCell.value = cur;
    curCell.numFmt = "#,##0.0";
    curCell.font = font(true, 11, C.blue);
    curCell.fill = fill(C.blueLight);
    curCell.alignment = {vertical:"middle", horizontal:"right"};
    curCell.border = border(C.blue);
    const grCell = row.getCell(5);
    grCell.value = growthLabel(cur, pv);
    grCell.font = font(true, 10, good === true ? C.greenDark : good === false ? C.redDark : C.gray);
    grCell.fill = fill(good === true ? C.greenLight : good === false ? C.redLight : C.grayLight);
    grCell.alignment = {vertical:"middle", horizontal:"center"};
    grCell.border = border();
    styleFn(row.getCell(6), good === true ? "◎" : good === false ? "✕" : "—", "center");
    row.getCell(6).font = font(true, 12, good === true ? C.green : good === false ? C.red : C.gray);
  });

  // 主要指標
  ws1.getRow(22).height = 10;
  ws1.mergeCells("A23:F23");
  styleMainHeader(ws1.getCell("A23"), "  ■ 主要指標");
  ws1.getRow(23).height = 28;

  const kpis: [string, string][] = [
    ["MQ率（粗利率）",    pctStr(comp.totalMRate)],
    ["f/m比率",          pctStr(comp.totalFMRatio*100)],
    ["平均単価P",         `${n1(comp.avgP)} 万円`],
    ["累計稼働月数",      `${comp.activeMonths} ヶ月`],
    ["累計PQ",            `${n1(comp.totalPQ)} 万円`],
    ["累計G（利益）",     `${n1(comp.totalG)} 万円`],
  ];
  kpis.forEach(([label, val], ri) => {
    const col1 = ri % 3 * 2 + 1;
    const row = ws1.getRow(24 + Math.floor(ri/3));
    ws1.getRow(24 + Math.floor(ri/3)).height = 26;
    const lc = row.getCell(col1);
    lc.value = label;
    lc.font = font(true, 9, C.white);
    lc.fill = fill(C.subHeader);
    lc.alignment = {vertical:"middle", horizontal:"center"};
    lc.border = border(C.blueDark);
    const vc = row.getCell(col1 + 1);
    vc.value = val;
    vc.font = font(true, 12, C.blue);
    vc.fill = fill(C.blueLight);
    vc.alignment = {vertical:"middle", horizontal:"center"};
    vc.border = border(C.blue);
  });

  ws1.columns = [
    {width:22},{width:14},{width:14},{width:14},{width:14},{width:18},
  ];

  // ─────────────────────────────────────────────────────
  // SHEET 2: 月次データ（グラフ付き）
  // ─────────────────────────────────────────────────────
  const ws2 = wb.addWorksheet("📈 月次データ", { views:[{state:"frozen",xSplit:1,ySplit:3}] });
  ws2.properties.defaultRowHeight = 22;

  ws2.mergeCells("A1:M1");
  styleMainHeader(ws2.getCell("A1"), "  月次データ推移　　　　　　グラフはセル内のデータバーで確認できます");
  ws2.getRow(1).height = 28;
  ws2.mergeCells("A2:M2");
  ws2.getCell("A2").value = `期間：${fyStart.replace("-","年")}月〜${fyEnd.replace("-","年")}月　　出力日：${dateStr}`;
  ws2.getCell("A2").font = font(false, 9, C.white);
  ws2.getCell("A2").fill = fill(C.subHeader);
  ws2.getRow(2).height = 18;

  const mHeaders = ["月","PQ（万）","VQ（万）","MQ（万）","F（万）","G（万）","Q（件）","MQ率","f/m比率","平均P","累計PQ","累計MQ","累計F"];
  const mHeaderColors = [C.header,C.blue,C.purple,C.green,C.orange,C.green,C.yellow,C.green,C.orange,C.blue,C.blue,C.green,C.orange];
  mHeaders.forEach((h,i) => {
    const cell = ws2.getCell(3, i+1);
    styleColHeader(cell, h, mHeaderColors[i]);
  });
  ws2.getRow(3).height = 24;

  comp.md.forEach((d, i) => {
    const row = ws2.getRow(4 + i);
    row.height = 22;
    const styleFn = i % 2 === 0 ? styleData : styleDataAlt;
    const gPos = d.g >= 0;
    row.getCell(1).value = MS12[i];
    row.getCell(1).font = font(true, 10, C.white);
    row.getCell(1).fill = fill(C.header);
    row.getCell(1).alignment = {vertical:"middle", horizontal:"center"};
    row.getCell(1).border = border();

    [[2,n1(d.pq)],[3,n1(d.vq)],[4,n1(d.mq)],[5,n1(d.f)]].forEach(([col,val]) => {
      styleFn(row.getCell(col as number), val as number, "right", "#,##0.0");
    });
    // G列 - 利益をプラス/マイナスで色分け
    const gCell = row.getCell(6);
    gCell.value = n1(d.g);
    gCell.numFmt = "#,##0.0";
    gCell.font = font(true, 10, gPos ? C.greenDark : C.redDark);
    gCell.fill = fill(gPos ? C.greenLight : C.redLight);
    gCell.alignment = {vertical:"middle", horizontal:"right"};
    gCell.border = border();

    styleFn(row.getCell(7), d.q, "right");
    [8,9].forEach((col, ci) => {
      const val = ci===0 ? d.mRate/100 : d.fmRatio;
      const c = row.getCell(col);
      c.value = val;
      c.numFmt = "0.0%";
      c.font = font(false, 10, C.black);
      c.fill = fill(i%2===0?C.grayLight:C.white);
      c.alignment = {vertical:"middle", horizontal:"right"};
      c.border = border();
    });
    styleFn(row.getCell(10), n1(d.avgP), "right", "#,##0.0");
    styleFn(row.getCell(11), n1(comp.cum[i].cumPQ), "right", "#,##0.0");
    styleFn(row.getCell(12), n1(comp.cum[i].cumMQ), "right", "#,##0.0");
    styleFn(row.getCell(13), n1(comp.cum[i].cumF), "right", "#,##0.0");
  });

  // 合計行
  const totalRow = ws2.getRow(16);
  totalRow.height = 26;
  totalRow.getCell(1).value = "合計";
  totalRow.getCell(1).font = font(true, 10, C.white);
  totalRow.getCell(1).fill = fill(C.header);
  totalRow.getCell(1).alignment = {vertical:"middle", horizontal:"center"};
  totalRow.getCell(1).border = thickBorder();
  const totals = [n1(comp.totalPQ),n1(comp.totalVQ),n1(comp.totalMQ),n1(comp.totalF),n1(comp.totalG),comp.totalQ];
  totals.forEach((val,i) => {
    const c = totalRow.getCell(2+i);
    c.value = val;
    if (i < 5) c.numFmt = "#,##0.0";
    c.font = font(true, 11, i===4 ? (comp.totalG>=0?C.greenDark:C.redDark) : C.blueDark);
    c.fill = fill(i===4 ? (comp.totalG>=0?C.greenLight:C.redLight) : C.blueLight);
    c.alignment = {vertical:"middle", horizontal:"right"};
    c.border = thickBorder(C.blue);
  });

  // データバー（条件付き書式）でグラフ代わり
  ws2.addConditionalFormatting({
    ref: "B4:B15",
    rules: [{type:"dataBar" as const, priority:1, minLength:0, maxLength:100,
      cfvo:[{type:"min"},{type:"max"}],
      color:{argb:C.blue}} as unknown as ExcelJS.ConditionalFormattingRule],
  });
  ws2.addConditionalFormatting({
    ref: "D4:D15",
    rules: [{type:"dataBar" as const, priority:1, minLength:0, maxLength:100,
      cfvo:[{type:"min"},{type:"max"}],
      color:{argb:C.green}} as unknown as ExcelJS.ConditionalFormattingRule],
  });
  ws2.addConditionalFormatting({
    ref: "E4:E15",
    rules: [{type:"dataBar" as const, priority:1, minLength:0, maxLength:100,
      cfvo:[{type:"min"},{type:"max"}],
      color:{argb:C.orange}} as unknown as ExcelJS.ConditionalFormattingRule],
  });

  ws2.columns = [
    {width:7},{width:11},{width:11},{width:11},{width:11},{width:11},
    {width:7},{width:8},{width:9},{width:10},{width:11},{width:11},{width:11},
  ];

  // ─────────────────────────────────────────────────────
  // SHEET 3: 案件一覧
  // ─────────────────────────────────────────────────────
  const ws3 = wb.addWorksheet("📋 案件一覧", { views:[{state:"frozen",xSplit:0,ySplit:3}] });
  ws3.properties.defaultRowHeight = 22;

  ws3.mergeCells("A1:J1");
  styleMainHeader(ws3.getCell("A1"), `  案件一覧　　全 ${projects.length} 件`);
  ws3.getRow(1).height = 28;
  ws3.mergeCells("A2:J2");
  ws3.getCell("A2").value = `出力日：${dateStr}`;
  ws3.getCell("A2").font = font(false, 9, C.white);
  ws3.getCell("A2").fill = fill(C.subHeader);
  ws3.getRow(2).height = 16;

  const pHeaders = ["ID","案件名","施工月","PQ（万）","VQ（万）","MQ（万）","MQ率","ステータス","エリア","契約年月"];
  const pHColors = [C.header,C.header,C.header,C.blue,C.purple,C.green,C.green,C.orange,C.blue,C.orange];
  pHeaders.forEach((h,i) => styleColHeader(ws3.getCell(3,i+1), h, pHColors[i]));
  ws3.getRow(3).height = 22;

  const statusColors: Record<string,string> = {
    "完了":"FF065F46", "施工中":"FF1E40AF", "契約済み":"FF92400E",
    "見積中":"FF4B5563", "失注":"FF991B1B",
  };
  const statusBgs: Record<string,string> = {
    "完了":C.greenLight, "施工中":C.blueLight, "契約済み":"FFFEF9C3",
    "見積中":C.grayLight, "失注":C.redLight,
  };

  projects.forEach((p, ri) => {
    const vq = totalV(p.v);
    const mq = p.p - vq;
    const row = ws3.getRow(4 + ri);
    row.height = 22;
    const styleFn = ri % 2 === 0 ? styleData : styleDataAlt;
    styleFn(row.getCell(1), p.id, "center");
    styleFn(row.getCell(2), p.name, "left");
    row.getCell(2).font = font(true, 10, C.black);
    styleFn(row.getCell(3), MS12[p.month]??`${p.month}月`, "center");
    styleFn(row.getCell(4), n1(p.p), "right", "#,##0.0");
    styleFn(row.getCell(5), n1(vq), "right", "#,##0.0");
    const mqCell = row.getCell(6);
    mqCell.value = n1(mq);
    mqCell.numFmt = "#,##0.0";
    mqCell.font = font(true, 10, mq >= 0 ? C.greenDark : C.redDark);
    mqCell.fill = fill(mq >= 0 ? C.greenLight : C.redLight);
    mqCell.alignment = {vertical:"middle", horizontal:"right"};
    mqCell.border = border();
    const mrCell = row.getCell(7);
    mrCell.value = p.p > 0 ? mq/p.p : 0;
    mrCell.numFmt = "0.0%";
    mrCell.font = font(false, 10, C.black);
    mrCell.fill = fill(ri%2===0?C.grayLight:C.white);
    mrCell.alignment = {vertical:"middle", horizontal:"right"};
    mrCell.border = border();
    const stCell = row.getCell(8);
    stCell.value = p.status;
    stCell.font = font(true, 9, statusColors[p.status]??C.gray);
    stCell.fill = fill(statusBgs[p.status]??C.grayLight);
    stCell.alignment = {vertical:"middle", horizontal:"center"};
    stCell.border = border();
    const areaName = YAMANASHI_MUNICIPALITIES.find(m=>m.id===p.area)?.name ?? p.area ?? "-";
    styleFn(row.getCell(9), areaName, "left");
    styleFn(row.getCell(10), p.contractDate ?? "-", "center");
  });

  // 合計
  ws3.getRow(4+projects.length).height = 10;
  const p3Total = ws3.getRow(5+projects.length);
  p3Total.height = 26;
  const tpq = projects.reduce((s,p)=>s+p.p,0);
  const tvq = projects.reduce((s,p)=>s+totalV(p.v),0);
  const tmq = tpq - tvq;
  ["","合計","",n1(tpq),n1(tvq),n1(tmq),tpq>0?tmq/tpq:0,"","",""].forEach((v,i) => {
    const c = p3Total.getCell(i+1);
    c.value = v;
    if (i===3||i===4||i===5) c.numFmt = "#,##0.0";
    if (i===6) c.numFmt = "0.0%";
    c.font = font(true, 10, C.white);
    c.fill = fill(C.header);
    c.alignment = {vertical:"middle", horizontal:i===1?"left":(i>=3&&i<=6?"right":"center")};
    c.border = thickBorder();
  });

  ws3.columns = [
    {width:5},{width:30},{width:6},{width:11},{width:11},{width:11},{width:7},{width:10},{width:16},{width:10},
  ];

  // ─────────────────────────────────────────────────────
  // SHEET 4: 固定費明細
  // ─────────────────────────────────────────────────────
  const ws4 = wb.addWorksheet("💰 固定費明細", { views:[{state:"frozen",xSplit:1,ySplit:3}] });
  ws4.properties.defaultRowHeight = 20;

  ws4.mergeCells(`A1:P1`);
  styleMainHeader(ws4.getCell("A1"), "  固定費明細（万円）");
  ws4.getRow(1).height = 28;
  ws4.mergeCells(`A2:P2`);
  ws4.getCell("A2").value = `出力日：${dateStr}`;
  ws4.getCell("A2").font = font(false, 9, C.white);
  ws4.getCell("A2").fill = fill(C.subHeader);
  ws4.getRow(2).height = 16;

  styleColHeader(ws4.getCell(3,1), "費目");
  MS12.forEach((m,i) => styleColHeader(ws4.getCell(3,i+2), m));
  styleColHeader(ws4.getCell(3,14), "年間合計");
  styleColHeader(ws4.getCell(3,15), "年間予算");
  ws4.getRow(3).height = 22;

  const fMonthVals = MS12.map((_,i) => mfVal(mf,i));
  const annualSum = (getter: (f: FixedCosts) => number) => fMonthVals.reduce((s,f)=>s+getter(f),0);

  function addFRow(
    ws: ExcelJS.Worksheet, rowIdx: number, label: string,
    getter: (f: FixedCosts) => number, isCategory=false
  ) {
    const row = ws.getRow(rowIdx);
    row.height = isCategory ? 24 : 20;
    const lc = row.getCell(1);
    lc.value = label;
    lc.font = font(isCategory, 10, isCategory?C.white:C.black);
    lc.fill = fill(isCategory ? C.subHeader : C.grayLight);
    lc.alignment = {vertical:"middle", horizontal:"left"};
    lc.border = border(isCategory?C.blueDark:C.grayBorder);

    fMonthVals.forEach((f,i) => {
      const c = row.getCell(2+i);
      const val = n1(getter(f));
      c.value = val;
      c.numFmt = "#,##0.0";
      c.font = font(false, 9, isCategory?(val>0?C.white:C.white):C.black);
      c.fill = fill(isCategory?(val>0?C.blueLight:C.grayLight):C.white);
      c.alignment = {vertical:"middle", horizontal:"right"};
      c.border = border();
    });
    const annualCell = row.getCell(14);
    annualCell.value = n1(annualSum(getter));
    annualCell.numFmt = "#,##0.0";
    annualCell.font = font(true, 10, isCategory?C.blueDark:C.black);
    annualCell.fill = fill(isCategory?C.blueLight:C.grayLight);
    annualCell.alignment = {vertical:"middle", horizontal:"right"};
    annualCell.border = border(C.blue);
    const budgetCell = row.getCell(15);
    budgetCell.value = n1(getter(ab));
    budgetCell.numFmt = "#,##0.0";
    budgetCell.font = font(true, 10, C.orange);
    budgetCell.fill = fill("FFFFF7ED");
    budgetCell.alignment = {vertical:"middle", horizontal:"right"};
    budgetCell.border = border(C.orange);
    return rowIdx + 1;
  }

  let rIdx = 4;
  rIdx = addFRow(ws4,rIdx,"F1 人件費",f=>f.f1.exec+f.f1.salary+f.f1.bonus+f.f1.social+f.f1.welfare,true);
  rIdx = addFRow(ws4,rIdx,"　役員報酬",f=>f.f1.exec);
  rIdx = addFRow(ws4,rIdx,"　給与",f=>f.f1.salary);
  rIdx = addFRow(ws4,rIdx,"　賞与",f=>f.f1.bonus);
  rIdx = addFRow(ws4,rIdx,"　社会保険料",f=>f.f1.social);
  rIdx = addFRow(ws4,rIdx,"　福利厚生費",f=>f.f1.welfare);
  rIdx = addFRow(ws4,rIdx,"F2 経費",f=>f.f2.rent+f.f2.repair+f.f2.fuel,true);
  rIdx = addFRow(ws4,rIdx,"　家賃",f=>f.f2.rent);
  rIdx = addFRow(ws4,rIdx,"　修繕費",f=>f.f2.repair);
  rIdx = addFRow(ws4,rIdx,"　燃料代",f=>f.f2.fuel);
  rIdx = addFRow(ws4,rIdx,"F3 戦略費",f=>sumF3(f),true);
  rIdx = addFRow(ws4,rIdx,"　広告(Web)",f=>f.f3.adWeb);
  rIdx = addFRow(ws4,rIdx,"　広告(チラシ)",f=>f.f3.adFlyer);
  rIdx = addFRow(ws4,rIdx,"　広告(ポータル)",f=>f.f3.adPortal);
  rIdx = addFRow(ws4,rIdx,"　広告(看板等)",f=>f.f3.adSign);
  rIdx = addFRow(ws4,rIdx,"　広告(YouTube)",f=>f.f3.adYoutube);
  rIdx = addFRow(ws4,rIdx,"　システム利用料",f=>f.f3.system);
  rIdx = addFRow(ws4,rIdx,"　通信費",f=>f.f3.telecom);
  rIdx = addFRow(ws4,rIdx,"　旅費交通費",f=>f.f3.travel);
  rIdx = addFRow(ws4,rIdx,"　研修費",f=>f.f3.training);
  rIdx = addFRow(ws4,rIdx,"　消耗品",f=>f.f3.supplies);
  rIdx = addFRow(ws4,rIdx,"　その他",f=>f.f3.other);
  rIdx = addFRow(ws4,rIdx,"F4 金利",f=>f.f4.interest,true);
  rIdx = addFRow(ws4,rIdx,"F5 保険・顧問等",f=>f.f5.insurance+f.f5.advisor+f.f5.membership+f.f5.misc,true);
  rIdx = addFRow(ws4,rIdx,"　保険料",f=>f.f5.insurance);
  rIdx = addFRow(ws4,rIdx,"　顧問料",f=>f.f5.advisor);
  rIdx = addFRow(ws4,rIdx,"　会費",f=>f.f5.membership);
  rIdx = addFRow(ws4,rIdx,"　雑費",f=>f.f5.misc);
  rIdx++; // spacer
  addFRow(ws4,rIdx,"合計 F",f=>totalF(f),true);

  ws4.columns = [
    {width:18}, ...MS12.map(()=>({width:7})), {width:11},{width:11},
  ];

  // ─────────────────────────────────────────────────────
  // SHEET 5: B/S 貸借対照表
  // ─────────────────────────────────────────────────────
  const ws5 = wb.addWorksheet("🏦 BS貸借対照表");
  ws5.properties.defaultRowHeight = 24;

  ws5.mergeCells("A1:D1");
  styleMainHeader(ws5.getCell("A1"), `  貸借対照表（B/S）`);
  ws5.getRow(1).height = 28;
  ws5.mergeCells("A2:D2");
  ws5.getCell("A2").value = `出力日：${dateStr}`;
  ws5.getCell("A2").font = font(false, 9, C.white);
  ws5.getCell("A2").fill = fill(C.subHeader);
  ws5.getRow(2).height = 16;

  ws5.getRow(3).height = 10;

  // ヘッダー
  styleColHeader(ws5.getCell("A4"), "【資産の部】", C.green);
  styleColHeader(ws5.getCell("B4"), "金額（万円）", C.green);
  styleColHeader(ws5.getCell("C4"), "【負債の部】", C.red);
  styleColHeader(ws5.getCell("D4"), "金額（万円）", C.red);
  ws5.getRow(4).height = 22;

  const bsAssets: [string, number][] = [
    ["現預金", bs.cash],
    ["売掛金・受取手形", bs.receivable],
    ["在庫・材料", bs.inventory],
    ["固定資産", bs.fixedAsset],
    ["その他資産", bs.otherAsset],
  ];
  const bsLiab: [string, number][] = [
    ["買掛金・未払金", bs.payable],
    ["短期借入金", bs.shortLoan],
    ["長期借入金", bs.longLoan],
    ["その他負債", bs.otherDebt],
    ["", 0],
  ];
  bsAssets.forEach(([label,val],ri) => {
    const row = ws5.getRow(5+ri);
    row.height = 22;
    const s = ri%2===0 ? styleData : styleDataAlt;
    s(row.getCell(1), label, "left");
    s(row.getCell(2), val, "right", "#,##0.0");
    row.getCell(2).font = font(true, 10, C.greenDark);
    const [ll, lv] = bsLiab[ri];
    if (ll) {
      s(row.getCell(3), ll, "left");
      s(row.getCell(4), lv, "right", "#,##0.0");
      row.getCell(4).font = font(true, 10, C.redDark);
    }
  });

  const totalAsset = bs.cash+bs.receivable+bs.inventory+bs.fixedAsset+bs.otherAsset;
  const totalDebt  = bs.payable+bs.shortLoan+bs.longLoan+bs.otherDebt;
  const netAsset   = totalAsset - totalDebt;

  ws5.getRow(10).height = 10;
  const totRow = ws5.getRow(11);
  totRow.height = 26;
  ["資産合計",totalAsset,"負債合計",totalDebt].forEach((v,i) => {
    const c = totRow.getCell(i+1);
    c.value = v;
    if (typeof v==="number") c.numFmt = "#,##0.0";
    c.font = font(true, 11, i<2?C.greenDark:C.redDark);
    c.fill = fill(i<2?C.greenLight:C.redLight);
    c.alignment = {vertical:"middle", horizontal:typeof v==="string"?"left":"right"};
    c.border = thickBorder(i<2?C.green:C.red);
  });

  const neRow = ws5.getRow(12);
  neRow.height = 26;
  neRow.getCell(3).value = "純資産";
  neRow.getCell(3).font = font(true, 11, C.blueDark);
  neRow.getCell(3).fill = fill(C.blueLight);
  neRow.getCell(3).alignment = {vertical:"middle", horizontal:"left"};
  neRow.getCell(3).border = thickBorder(C.blue);
  neRow.getCell(4).value = netAsset;
  neRow.getCell(4).numFmt = "#,##0.0";
  neRow.getCell(4).font = font(true, 11, netAsset>=0?C.greenDark:C.redDark);
  neRow.getCell(4).fill = fill(netAsset>=0?C.greenLight:C.redLight);
  neRow.getCell(4).alignment = {vertical:"middle", horizontal:"right"};
  neRow.getCell(4).border = thickBorder(C.blue);

  ws5.getRow(13).height = 10;
  const erRow = ws5.getRow(14);
  erRow.height = 26;
  erRow.getCell(1).value = "自己資本比率";
  erRow.getCell(1).font = font(true, 10, C.white);
  erRow.getCell(1).fill = fill(C.subHeader);
  erRow.getCell(1).alignment = {vertical:"middle", horizontal:"left"};
  erRow.getCell(1).border = border();
  erRow.getCell(2).value = totalAsset>0 ? netAsset/totalAsset : 0;
  erRow.getCell(2).numFmt = "0.0%";
  erRow.getCell(2).font = font(true, 12, C.blueDark);
  erRow.getCell(2).fill = fill(C.blueLight);
  erRow.getCell(2).alignment = {vertical:"middle", horizontal:"center"};
  erRow.getCell(2).border = border(C.blue);

  ws5.columns = [{width:22},{width:14},{width:22},{width:14}];

  // ─────────────────────────────────────────────────────
  // SHEET 6: エリア別シェア率
  // ─────────────────────────────────────────────────────
  const ws6 = wb.addWorksheet("🗾 エリア別シェア率", { views:[{state:"frozen",xSplit:1,ySplit:3}] });
  ws6.properties.defaultRowHeight = 22;

  ws6.mergeCells("A1:J1");
  styleMainHeader(ws6.getCell("A1"), `  エリア別シェア率　　山梨県全市町村`);
  ws6.getRow(1).height = 28;
  ws6.mergeCells("A2:J2");
  ws6.getCell("A2").value = `今期契約：${fyStart.replace("-","年")}月〜${fyEnd.replace("-","年")}月　　出力日：${dateStr}`;
  ws6.getCell("A2").font = font(false, 9, C.white);
  ws6.getCell("A2").fill = fill(C.subHeader);
  ws6.getRow(2).height = 16;

  const sHeaders = ["市区町村","戸建て棟数","年間需要","お気に入り",
    "完工済み（件）","完工済みシェア",
    "完工見込み（件）","完工見込みシェア",
    "契約（件）","契約シェア"];
  const sHColors = [C.header,C.header,C.header,C.yellow,
    C.green,C.green,C.blue,C.blue,C.orange,C.orange];
  sHeaders.forEach((h,i) => styleColHeader(ws6.getCell(3,i+1), h, sHColors[i]));
  ws6.getRow(3).height = 24;

  [...YAMANASHI_MUNICIPALITIES]
    .sort((a,b)=>{
      const af=shareRate.favorites.includes(a.id),bf=shareRate.favorites.includes(b.id);
      return af!==bf?(af?-1:1):b.homes-a.homes;
    })
    .forEach((m,ri) => {
      const demand = Math.max(1, Math.round(m.homes*0.008));
      const area = projects.filter(p=>p.area===m.id);
      const done     = area.filter(p=>p.status==="完了").length;
      const forecast = area.length;
      const contract = area.filter(p=>inFY(p.contractDate)).length;
      const isFav = shareRate.favorites.includes(m.id);
      const row = ws6.getRow(4+ri);
      row.height = 22;
      const styleFn = ri%2===0 ? styleData : styleDataAlt;

      const nameCell = row.getCell(1);
      nameCell.value = m.name;
      nameCell.font = font(true, 10, isFav?C.blueDark:C.black);
      nameCell.fill = fill(isFav?C.blueLight:(ri%2===0?C.grayLight:C.white));
      nameCell.alignment = {vertical:"middle", horizontal:"left"};
      nameCell.border = border(isFav?C.blue:C.grayBorder);

      styleFn(row.getCell(2), m.homes, "right", "#,##0");
      styleFn(row.getCell(3), demand, "right", "#,##0");
      const favCell = row.getCell(4);
      favCell.value = isFav?"★":"☆";
      favCell.font = font(true, 12, isFav?"FFFBBF24":C.gray);
      favCell.fill = fill(isFav?"FFFEF9C3":(ri%2===0?C.grayLight:C.white));
      favCell.alignment = {vertical:"middle", horizontal:"center"};
      favCell.border = border();

      // 完工済み
      const donePctVal = done/demand;
      styleFn(row.getCell(5), done, "right");
      const donePC = row.getCell(6);
      donePC.value = donePctVal;
      donePC.numFmt = "0.0%";
      donePC.font = font(true, 10, done>0?C.greenDark:C.gray);
      donePC.fill = fill(done>0?C.greenLight:(ri%2===0?C.grayLight:C.white));
      donePC.alignment = {vertical:"middle", horizontal:"right"};
      donePC.border = border();

      // 完工見込み
      styleFn(row.getCell(7), forecast, "right");
      const forePC = row.getCell(8);
      forePC.value = forecast/demand;
      forePC.numFmt = "0.0%";
      forePC.font = font(true, 10, forecast>0?C.blueDark:C.gray);
      forePC.fill = fill(forecast>0?C.blueLight:(ri%2===0?C.grayLight:C.white));
      forePC.alignment = {vertical:"middle", horizontal:"right"};
      forePC.border = border();

      // 契約
      styleFn(row.getCell(9), contract, "right");
      const contrPC = row.getCell(10);
      contrPC.value = contract/demand;
      contrPC.numFmt = "0.0%";
      contrPC.font = font(true, 10, contract>0?"FFEA580C":C.gray);
      contrPC.fill = fill(contract>0?"FFFFF7ED":(ri%2===0?C.grayLight:C.white));
      contrPC.alignment = {vertical:"middle", horizontal:"right"};
      contrPC.border = border();
    });

  // シェア率列にデータバー
  ws6.addConditionalFormatting({
    ref: `F4:F${3+YAMANASHI_MUNICIPALITIES.length}`,
    rules: [{type:"dataBar" as const, priority:1, minLength:0, maxLength:100,
      cfvo:[{type:"min"},{type:"max"}],
      color:{argb:C.green}} as unknown as ExcelJS.ConditionalFormattingRule],
  });
  ws6.addConditionalFormatting({
    ref: `H4:H${3+YAMANASHI_MUNICIPALITIES.length}`,
    rules: [{type:"dataBar" as const, priority:1, minLength:0, maxLength:100,
      cfvo:[{type:"min"},{type:"max"}],
      color:{argb:C.blue}} as unknown as ExcelJS.ConditionalFormattingRule],
  });
  ws6.addConditionalFormatting({
    ref: `J4:J${3+YAMANASHI_MUNICIPALITIES.length}`,
    rules: [{type:"dataBar" as const, priority:1, minLength:0, maxLength:100,
      cfvo:[{type:"min"},{type:"max"}],
      color:{argb:C.orange}} as unknown as ExcelJS.ConditionalFormattingRule],
  });

  ws6.columns = [
    {width:16},{width:10},{width:10},{width:8},
    {width:12},{width:13},{width:14},{width:15},{wch:10},{wch:11},
  ] as ExcelJS.Column[];

  // ─────────────────────────────────────────────────────
  // Excel バッファ生成・レスポンス
  // ─────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const fileName = `COATEX_経営データ_${dateStr.replace(/\//g,"-")}.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
