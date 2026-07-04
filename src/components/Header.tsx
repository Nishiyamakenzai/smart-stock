"use client";
import Link from "next/link";
import Bar from "./ui/Bar";
import { C, STC, STCBG } from "@/lib/constants";
import { fmt1 } from "@/lib/utils";
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
    { l:"PQ 売上",  v:comp.totalPQ, t:targets.pq, u:"万", fmt: (v:number) => fmt1(v) },
    { l:"MQ 粗利",  v:comp.totalMQ, t:targets.mq, u:"万", fmt: (v:number) => fmt1(v) },
    { l:"G 利益",   v:comp.totalG,  t:targets.g,  u:"万", fmt: (v:number) => fmt1(v) },
    { l:"Q 件数",   v:comp.totalQ,  t:targets.q,  u:"件", fmt: (v:number) => String(Math.round(v)) },
  ];

  return (
    <div style={{ background: C.gradHeader, color:"#fff" }}>
      {/* Top bar */}
      <div className="header-top" style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"16px 20px 12px",
      }}>
        <div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, lineHeight:1 }}>
            <span style={{ fontSize:26, fontWeight:900, color:"#fff", letterSpacing:"-0.5px" }}>COATEX</span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,.45)", fontWeight:700, letterSpacing:2 }}>by 西山建材工業</span>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.75)", marginTop:4, letterSpacing:0.5 }}>
            経営を、塗り替えろ。
          </div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", marginTop:2, letterSpacing:1, fontWeight:600 }}>
            SMART COATING &amp; BUSINESS SOLUTIONS
          </div>
        </div>
        <div className="header-top-btns" style={{ display:"flex", gap:6 }}>
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
          <a href="https://paint-inventory-git-paint-inventory-nishiyamakenzais-projects.vercel.app/" target="_blank" rel="noopener noreferrer" style={{
            padding:"6px 12px",
            background:"rgba(255,255,255,.15)",
            border:"1px solid rgba(255,255,255,.25)",
            borderRadius:8,
            fontSize:11, fontWeight:600, color:"rgba(255,255,255,.85)",
            textDecoration:"none",
            transition:"background .15s",
            whiteSpace:"nowrap",
          }}>🎨 在庫</a>
          <Link href="/evaluation" style={{
            padding:"6px 12px",
            background:"rgba(255,255,255,.15)",
            border:"1px solid rgba(255,255,255,.25)",
            borderRadius:8,
            fontSize:11, fontWeight:600, color:"rgba(255,255,255,.85)",
            textDecoration:"none",
            transition:"background .15s",
            whiteSpace:"nowrap",
          }}>⛩️ 評価制度</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, padding:"0 20px 16px" }}>
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
                  <span>{isAchieved ? "✦ 達成！" : `${Math.round(pct)}%`}</span>
                  <span>/{fmt1(k.t)}{k.u}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline */}
      <div className="pipeline-bar" style={{
        display:"flex", gap:0,
        borderTop:"1px solid rgba(255,255,255,.1)",
      }}>
        {Object.entries(comp.pipe).map(([st, cnt]) => (
          <div key={st} className="pipeline-item" style={{
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
              {fmt1(comp.pipeA[st]||0)}万
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
