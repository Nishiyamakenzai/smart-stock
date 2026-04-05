"use client";
import Bar from "./ui/Bar";
import { C, STC, STCBG } from "@/lib/constants";
import type { ComputedData, Targets } from "@/lib/types";

interface HeaderProps {
  comp: ComputedData;
  targets: Targets;
  onOpenTargets: () => void;
  onOpenBS: () => void;
  onLogout: () => void;
}

const KPI_STYLES = [
  { grad:"linear-gradient(135deg,#3b82f6,#1d4ed8)", shadow:"rgba(59,130,246,.35)" },
  { grad:"linear-gradient(135deg,#8b5cf6,#6d28d9)", shadow:"rgba(139,92,246,.35)" },
  { grad:"linear-gradient(135deg,#10b981,#059669)", shadow:"rgba(16,185,129,.35)" },
  { grad:"linear-gradient(135deg,#f59e0b,#d97706)", shadow:"rgba(245,158,11,.35)" },
];

export default function Header({ comp, targets, onOpenTargets, onOpenBS, onLogout }: HeaderProps) {
  const kpis = [
    { l:"PQ 売上",  v:comp.totalPQ, t:targets.pq, u:"万", fmt: (v:number) => v.toLocaleString() },
    { l:"MQ 粗利",  v:comp.totalMQ, t:targets.mq, u:"万", fmt: (v:number) => v.toLocaleString() },
    { l:"G 利益",   v:comp.totalG,  t:targets.g,  u:"万", fmt: (v:number) => v.toLocaleString() },
    { l:"Q 件数",   v:comp.totalQ,  t:targets.q,  u:"件", fmt: (v:number) => String(v) },
  ];

  return (
    <div style={{ background: C.gradHeader, color:"#fff" }}>
      {/* Top bar */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"16px 20px 12px",
      }}>
        <div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,.5)", fontWeight:700, letterSpacing:3, marginBottom:4 }}>
            MQ ACCOUNTING DASHBOARD
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff", lineHeight:1 }}>西山建材工業</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.45)", marginTop:3 }}>
            第46期 ｜ プロタイムズ富士吉田店 ｜ 外壁・屋根塗装
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[
            { label:"目標設定", onClick:onOpenTargets, color:"rgba(255,255,255,.15)", border:"rgba(255,255,255,.25)" },
            { label:"B/S",     onClick:onOpenBS,      color:"rgba(255,255,255,.15)", border:"rgba(255,255,255,.25)" },
            { label:"ログアウト", onClick:onLogout,   color:"transparent",           border:"rgba(255,255,255,.15)" },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{
              padding:"6px 12px",
              background:btn.color,
              border:"1px solid "+btn.border,
              borderRadius:8,
              fontSize:11, fontWeight:600, color:"rgba(255,255,255,.85)",
              cursor:"pointer",
              transition:"background .15s",
            }}>{btn.label}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, padding:"0 20px 16px" }}>
        {kpis.map((k, i) => {
          const pct = k.t > 0 ? Math.min(k.v / k.t * 100, 100) : 0;
          const isAchieved = k.v >= k.t;
          const st = KPI_STYLES[i];
          return (
            <div key={k.l} className="kpi-card" style={{ background:st.grad, boxShadow:`0 4px 14px ${st.shadow}` }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.7)", fontWeight:700, marginBottom:4 }}>{k.l}</div>
              <div style={{ fontSize:26, fontWeight:900, lineHeight:1, letterSpacing:"-0.5px" }}>
                {k.fmt(k.v)}
                <span style={{ fontSize:11, fontWeight:600, opacity:.7, marginLeft:2 }}>{k.u}</span>
              </div>
              <div style={{ marginTop:8 }}>
                <div style={{ height:4, background:"rgba(255,255,255,.2)", borderRadius:4, overflow:"hidden" }}>
                  <div style={{
                    width:pct+"%", height:"100%",
                    background:isAchieved ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.7)",
                    borderRadius:4, transition:"width .8s cubic-bezier(.16,1,.3,1)",
                    boxShadow:isAchieved ? "0 0 8px rgba(255,255,255,.6)" : "none",
                  }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, marginTop:3, color:"rgba(255,255,255,.55)" }}>
                  <span>{isAchieved ? "✦ 達成！" : `${pct.toFixed(0)}%`}</span>
                  <span>/{k.t.toLocaleString()}{k.u}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline */}
      <div style={{
        display:"flex", gap:0,
        borderTop:"1px solid rgba(255,255,255,.1)",
      }}>
        {Object.entries(comp.pipe).map(([st, cnt]) => (
          <div key={st} style={{
            flex:1, padding:"10px 0", textAlign:"center",
            borderRight:"1px solid rgba(255,255,255,.08)",
            transition:"background .15s",
          }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:5,
              padding:"2px 8px", borderRadius:99,
              background:STCBG[st]+"22",
              marginBottom:3,
            }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:STC[st] }}/>
              <span style={{ fontSize:10, color:"rgba(255,255,255,.65)", fontWeight:600 }}>{st}</span>
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:"#fff", lineHeight:1 }}>{cnt}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", marginTop:2 }}>
              {(comp.pipeA[st]||0).toLocaleString()}万
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
