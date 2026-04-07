"use client";
import Bar from "../ui/Bar";
import SimpleChart from "../ui/SimpleChart";
import { C, VK, VL, VK_COLORS, CHART_COLORS } from "@/lib/constants";
import type { ComputedData, Targets, Project } from "@/lib/types";
import { totalV } from "@/lib/data";
import { fmt1, fmtPct } from "@/lib/utils";

interface AnalysisTabProps {
  comp: ComputedData;
  targets: Targets;
  projects: Project[];
}

export default function AnalysisTab({ comp, targets, projects }: AnalysisTabProps) {
  const cf2 = comp.totalF > 0 ? comp.totalF : 2640;
  const scens = [
    { l:"① P アップ", desc: comp.totalQ>0 ? `単価 ${fmt1(comp.avgP)} → ${fmt1((cf2+targets.g)/comp.totalQ+comp.avgV)}万 に上げる` : "—", c:C.blue, icon:"📈" },
    { l:"② Q アップ", desc: comp.avgM>0 ? `件数 ${comp.totalQ} → ${fmtPct((cf2+targets.g)/comp.avgM)}件 に増やす` : "—", c:C.purple, icon:"🔢" },
    { l:"③ V ダウン", desc: comp.totalQ>0 ? `原価 ${fmt1(comp.avgV)} → ${fmt1(comp.avgP-(cf2+targets.g)/comp.totalQ)}万 に下げる` : "—", c:C.green, icon:"🔻" },
    { l:"④ F ダウン", desc: `固定費 ${fmt1(cf2)} → ${fmt1(comp.totalMQ-targets.g)}万 に削減`, c:C.yellow, icon:"✂️" },
  ];

  const ranked = projects
    .map(p => { const tv = totalV(p.v); return {...p, m:p.p-tv, mr:p.p>0?(p.p-tv)/p.p*100:0}; })
    .sort((a,b) => b.mr-a.mr).slice(0,10);

  const seasons = [
    { l:"冬 12〜2月", idx:[0,1,2],   c:C.cyan,   icon:"❄️" },
    { l:"春 3〜5月",  idx:[3,4,5],   c:C.green,  icon:"🌸" },
    { l:"夏 6〜8月",  idx:[6,7,8],   c:C.orange, icon:"☀️" },
    { l:"秋 9〜11月", idx:[9,10,11], c:C.yellow, icon:"🍂" },
  ];

  return (
    <>
      <div className="card stagger-item">
        <div className="section-title">G={targets.g}万 達成シミュレーション</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {scens.map(s => (
            <div key={s.l} style={{
              padding:"14px 16px",
              background:C.card2,
              borderRadius:12,
              borderLeft:"4px solid "+s.c,
              border:"1px solid "+C.bdr,
              borderLeftColor:s.c,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ fontSize:16 }}>{s.icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:s.c }}>{s.l}</span>
              </div>
              <div style={{ fontSize:12, color:C.t2, lineHeight:1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card stagger-item">
        <div className="section-title">V 原価構成比</div>
        {VK.map(k => {
          const tot = projects.reduce((s,p) => s+(p.v[k as keyof typeof p.v]||0), 0);
          if (tot <= 0) return null;
          const pct = comp.totalVQ>0 ? tot/comp.totalVQ*100 : 0;
          return (
            <div key={k} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                <span style={{ color:C.t2, fontWeight:500 }}>{VL[k]}</span>
                <span style={{ color:C.t1, fontWeight:700 }}>{fmt1(tot)}万 <span style={{color:C.t3,fontWeight:400}}>({fmtPct(pct)}%)</span></span>
              </div>
              <Bar value={tot} max={comp.totalVQ} color={VK_COLORS[k]||C.blue} h={8}/>
            </div>
          );
        })}
      </div>

      <div className="card stagger-item">
        <div className="section-title">季節別受注パターン</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
          {seasons.map(sn => {
            const sq = sn.idx.reduce((s,i) => s+comp.md[i].q, 0);
            const spq = sn.idx.reduce((s,i) => s+comp.md[i].pq, 0);
            const smq = sn.idx.reduce((s,i) => s+comp.md[i].mq, 0);
            return (
              <div key={sn.l} style={{
                padding:"16px",
                background:sn.c+"12",
                borderRadius:14,
                border:"1px solid "+sn.c+"30",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                  <span style={{ fontSize:20 }}>{sn.icon}</span>
                  <span style={{ fontSize:12, color:sn.c, fontWeight:700 }}>{sn.l}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, textAlign:"center" }}>
                  <div>
                    <div style={{ fontSize:10, color:C.t2 }}>件数</div>
                    <div style={{ fontSize:18, fontWeight:800, color:C.t1 }}>{sq}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.t2 }}>PQ</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.t1 }}>{fmt1(spq)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:C.t2 }}>MQ</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.green }}>{fmt1(smq)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <SimpleChart
          series={[
            { name:"PQ", data:comp.md.map(d => d.pq||null), color:CHART_COLORS.pq },
            { name:"MQ", data:comp.md.map(d => d.mq||null), color:CHART_COLORS.mq },
          ]}
          labels={comp.md.map(d => d.label)} height={160}
        />
      </div>

      <div className="card stagger-item">
        <div className="section-title">粗利率ランキング TOP10</div>
        {ranked.map((p, i) => (
          <div key={p.id} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"10px 0",
            borderBottom:"1px solid "+C.bdr,
          }}>
            <div style={{
              width:28, height:28, borderRadius:8, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              background: i===0?"linear-gradient(135deg,#f59e0b,#d97706)":i===1?"linear-gradient(135deg,#94a3b8,#64748b)":i===2?"linear-gradient(135deg,#f97316,#ea580c)":C.card3,
              color: i<3?"#fff":C.t2,
              fontSize:12, fontWeight:800,
            }}>{i+1}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
              <div style={{ fontSize:10, color:C.t3 }}>P={fmt1(p.p)}万 / 粗利={fmt1(p.m)}万</div>
            </div>
            <div style={{
              padding:"4px 12px", borderRadius:99, fontSize:13, fontWeight:800, flexShrink:0,
              background: p.mr>=48?C.greenLight:p.mr>=40?C.yellowLight:C.redLight,
              color: p.mr>=48?C.greenDark:p.mr>=40?"#92400e":C.red,
            }}>{fmtPct(p.mr)}%</div>
          </div>
        ))}
      </div>
    </>
  );
}
