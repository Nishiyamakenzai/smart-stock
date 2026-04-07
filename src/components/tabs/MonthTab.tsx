"use client";
import Badge from "../ui/Badge";
import Bar from "../ui/Bar";
import SimpleChart from "../ui/SimpleChart";
import { C, MS, VK, VL, CHART_COLORS } from "@/lib/constants";
import { aiMonth, fmt1, fmtPct } from "@/lib/utils";
import type { ComputedData } from "@/lib/types";

interface MonthTabProps {
  comp: ComputedData;
  selectedMonth: number | null;
  onSelectMonth: (m: number | null) => void;
}

export default function MonthTab({ comp, selectedMonth, onSelectMonth }: MonthTabProps) {
  const smd = selectedMonth !== null ? comp.md[selectedMonth] : null;
  const smH = aiMonth(smd);

  const tableRows = [
    {l:"Q",     k:"q",       tot:comp.totalQ,       b:false},
    {l:"PQ",    k:"pq",      tot:comp.totalPQ,      b:false},
    {l:"VQ",    k:"vq",      tot:comp.totalVQ,      b:false},
    {l:"MQ",    k:"mq",      tot:comp.totalMQ,      b:true, c:C.blue},
    {l:"粗利率", k:"mRate",  tot:comp.totalMRate,   b:false, fmt:true},
    {l:"F",     k:"f",       tot:comp.totalF,       b:false, c:C.yellow},
    {l:"G",     k:"g",       tot:comp.totalG,       b:true,  cfn:true},
    {l:"f/m",   k:"fmRatio", tot:comp.totalFMRatio, b:false, fmt:true},
  ] as const;

  return (
    <>
      <div style={{ fontSize:18, fontWeight:800, color:C.t1, marginBottom:14 }}>月次MQ会計</div>

      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
        {MS.map((m, i) => {
          const d = comp.md[i];
          const isSelected = selectedMonth === i;
          return (
            <button key={i} onClick={() => onSelectMonth(isSelected ? null : i)}
              style={{
                padding:"6px 12px", borderRadius:99, border:"1.5px solid",
                borderColor: isSelected ? (d.g>0?C.green:C.red) : C.bdr,
                background: isSelected ? (d.g>0?C.greenLight:C.redLight) : "#fff",
                color: isSelected ? (d.g>0?C.greenDark:C.red) : C.t2,
                fontSize:11, fontWeight:600, cursor:"pointer", transition:"all .15s",
              }}>
              {m}
              {d.q > 0 && <span style={{ marginLeft:4, fontSize:10, opacity:.7 }}>{d.q}件</span>}
            </button>
          );
        })}
      </div>

      {smd && selectedMonth !== null && (
        <div className="card stagger-item">
          <div style={{ fontSize:15, fontWeight:800, color:C.t1, marginBottom:14 }}>
            {MS[selectedMonth]} 詳細
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
            {[
              { l:"PQ 売上", v:smd.pq, grad:C.gradBlue },
              { l:"MQ 粗利", v:smd.mq, grad:C.gradPurple },
              { l:"G 利益",  v:smd.g,  grad:smd.g>=0?C.gradGreen:C.gradRed },
            ].map(k => (
              <div key={k.l} style={{
                padding:"16px 12px", borderRadius:14,
                background:k.grad, color:"#fff", textAlign:"center",
                boxShadow:"0 4px 12px rgba(0,0,0,.1)",
              }}>
                <div style={{ fontSize:10, opacity:.8, marginBottom:4, fontWeight:600 }}>{k.l}</div>
                <div style={{ fontSize:22, fontWeight:900 }}>
                  {fmt1(k.v)}<span style={{ fontSize:10, opacity:.75, marginLeft:2 }}>万</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:10 }}>V 原価内訳</div>
            {VK.map(k => {
              const val = smd.vBreak[k as keyof typeof smd.vBreak] || 0;
              if (val <= 0) return null;
              const pct = smd.vq > 0 ? val / smd.vq * 100 : 0;
              return (
                <div key={k} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                    <span style={{ color:C.t2 }}>{VL[k]}</span>
                    <span style={{ color:C.t1, fontWeight:700 }}>{fmt1(val)}万 <span style={{ color:C.t3, fontWeight:400 }}>({Math.round(pct)}%)</span></span>
                  </div>
                  <Bar value={val} max={smd.vq} color={C.blue} h={6}/>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:8 }}>AI 月次分析</div>
          {smH.map((h,i) => <Badge key={i} type={h.t} text={h.s}/>)}
        </div>
      )}

      <div className="card stagger-item">
        <div className="section-title">月次PQ/MQ推移</div>
        <SimpleChart
          series={[
            { name:"PQ", data:comp.md.map(d => d.pq||null), color:CHART_COLORS.pq, bold:true },
            { name:"MQ", data:comp.md.map(d => d.mq||null), color:CHART_COLORS.mq },
            { name:"G",  data:comp.md.map(d => d.g||null),  color:CHART_COLORS.g  },
          ]}
          labels={comp.md.map(d => d.label)} height={180}
        />
      </div>

      <div className="card stagger-item" style={{ overflowX:"auto" }}>
        <div className="section-title">12ヶ月サマリー</div>
        <table className="data-table" style={{ minWidth:700 }}>
          <thead>
            <tr>
              <th style={{textAlign:"left"}}>項目</th>
              {MS.map((m,i) => <th key={i}>{m}</th>)}
              <th style={{color:C.blue}}>累計</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map(r => (
              <tr key={r.l}>
                <td style={{fontWeight:700,color:C.t1}}>{r.l}</td>
                {comp.md.map((d, i) => {
                  const v = d[r.k as keyof typeof d] as number;
                  let clr = (r as {c?:string}).c || C.t1;
                  if ((r as {cfn?:boolean}).cfn) clr = v >= 0 ? C.green : C.red;
                  return (
                    <td key={i} style={{ color:clr, fontWeight:r.b?700:400 }}>
                      {(r as {fmt?:boolean}).fmt ? fmtPct(v) : (v===0?<span style={{color:C.t4}}>—</span>:fmt1(v))}
                    </td>
                  );
                })}
                <td style={{ fontWeight:700, color:C.blue, background:C.blueLight }}>
                  {(r as {fmt?:boolean}).fmt ? fmtPct(r.tot) : fmt1(r.tot)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
