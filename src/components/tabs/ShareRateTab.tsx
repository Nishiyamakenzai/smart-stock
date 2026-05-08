"use client";
import { useState } from "react";
import { YAMANASHI_MUNICIPALITIES } from "@/lib/data";
import { C } from "@/lib/constants";
import type { Project, ShareRateState } from "@/lib/types";

interface Props {
  projects: Project[];
  shareRate: ShareRateState;
  onChange: (s: ShareRateState) => void;
}

function calcDemand(homes: number) { return Math.max(1, Math.round(homes * 0.008)); }

// 横棒グラフ（完工＋契約シェア率）
function ShareChart({ items }: { items: { name: string; compPct: number; contrPct: number }[] }) {
  if (items.length === 0) return null;
  const maxPct = Math.max(20, ...items.map(i => Math.max(i.compPct, i.contrPct)));
  const rowH = 44, labelW = 82, barW = 200, pad = 8;
  const height = items.length * rowH + pad * 2;
  return (
    <svg width="100%" viewBox={`0 0 ${labelW + barW + 40} ${height}`} style={{ display:"block", overflow:"visible" }}>
      {items.map((it, i) => {
        const y = pad + i * rowH;
        const cw = Math.max(0, (it.compPct / maxPct) * barW);
        const ow = Math.max(0, (it.contrPct / maxPct) * barW);
        return (
          <g key={it.name}>
            <text x={labelW - 4} y={y + 11} textAnchor="end" fontSize="10" fill={C.t2}>{it.name}</text>
            {/* 完工バー */}
            <rect x={labelW} y={y} width={cw} height={14} fill="#3b82f6" rx="3" opacity="0.85"/>
            <text x={labelW + cw + 3} y={y + 11} fontSize="9" fill="#3b82f6" fontWeight="700">
              {it.compPct > 0 ? `${it.compPct.toFixed(1)}%` : ""}
            </text>
            {/* 契約バー */}
            <rect x={labelW} y={y + 18} width={ow} height={14} fill="#f97316" rx="3" opacity="0.85"/>
            <text x={labelW + ow + 3} y={y + 29} fontSize="9" fill="#f97316" fontWeight="700">
              {it.contrPct > 0 ? `${it.contrPct.toFixed(1)}%` : ""}
            </text>
          </g>
        );
      })}
      {/* 凡例 */}
      <rect x={labelW} y={height - 4} width={10} height={8} fill="#3b82f6" rx="2"/>
      <text x={labelW + 13} y={height + 3} fontSize="9" fill={C.t2}>完工シェア率</text>
      <rect x={labelW + 80} y={height - 4} width={10} height={8} fill="#f97316" rx="2"/>
      <text x={labelW + 93} y={height + 3} fontSize="9" fill={C.t2}>契約シェア率</text>
    </svg>
  );
}

export default function ShareRateTab({ projects, shareRate, onChange }: Props) {
  const { favorites, contractCounts } = shareRate;
  const [search, setSearch] = useState("");

  const toggleFav = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    onChange({ ...shareRate, favorites: next });
  };

  const setContract = (id: string, val: number) => {
    onChange({ ...shareRate, contractCounts: { ...contractCounts, [id]: Math.max(0, val) } });
  };

  const sorted = [...YAMANASHI_MUNICIPALITIES].sort((a, b) => {
    const af = favorites.includes(a.id), bf = favorites.includes(b.id);
    if (af !== bf) return af ? -1 : 1;
    return b.homes - a.homes;
  });

  const filtered = search
    ? sorted.filter(m => m.name.includes(search))
    : sorted;

  // グラフ用データ（お気に入り + 実績ありの市町村）
  const chartItems = sorted
    .filter(m => {
      const isFav = favorites.includes(m.id);
      const comp = projects.filter(p => p.area === m.id && p.status === "完了").length;
      const contr = contractCounts[m.id] || 0;
      return isFav || comp > 0 || contr > 0;
    })
    .map(m => {
      const demand = calcDemand(m.homes);
      const comp = projects.filter(p => p.area === m.id && p.status === "完了").length;
      const contr = contractCounts[m.id] || 0;
      return {
        name: m.name,
        compPct: comp / demand * 100,
        contrPct: contr / demand * 100,
      };
    });

  return (
    <>
      {/* 説明カード */}
      <div className="card stagger-item">
        <div className="section-title">🗾 山梨県 エリア別シェア率</div>
        <p style={{ fontSize:12, color:C.t2, margin:0, lineHeight:1.7 }}>
          戸建て棟数 × 0.8% ＝ 年間塗装需要棟数（100%基準）<br/>
          <span style={{ color:"#3b82f6", fontWeight:600 }}>■ 完工シェア率</span>：今期完了案件から自動集計
          <span style={{ color:"#f97316", fontWeight:600 }}>■ 契約シェア率</span>：期をまたぐ分を手動入力
        </p>
      </div>

      {/* グラフ */}
      {chartItems.length > 0 && (
        <div className="card stagger-item">
          <div className="section-title">シェア率グラフ</div>
          <ShareChart items={chartItems} />
        </div>
      )}

      {/* 検索 */}
      <div style={{ marginBottom:8 }}>
        <input
          type="text"
          placeholder="市町村を検索…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base"
          style={{ fontSize:13 }}
        />
      </div>

      {/* 市町村リスト */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(m => {
          const demand = calcDemand(m.homes);
          const isFav = favorites.includes(m.id);
          const comp = projects.filter(p => p.area === m.id && p.status === "完了").length;
          const contr = contractCounts[m.id] || 0;
          const compPct = comp / demand * 100;
          const contrPct = contr / demand * 100;

          return (
            <div key={m.id} style={{
              background: isFav ? "#eff6ff" : C.card,
              border: `1.5px solid ${isFav ? "#bfdbfe" : C.bdr}`,
              borderRadius: 14,
              padding: "12px 14px",
            }}>
              {/* 1行目: ☆ + 名前 + 基本数値 */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <button
                  onClick={() => toggleFav(m.id)}
                  style={{
                    background:"none", border:"none", cursor:"pointer",
                    fontSize:18, lineHeight:1, padding:"0 2px",
                    color: isFav ? "#f59e0b" : C.t4,
                  }}
                  title={isFav ? "お気に入りを外す" : "お気に入りに追加"}
                >{isFav ? "★" : "☆"}</button>
                <span style={{ fontWeight:700, fontSize:14, color:C.t1, flex:1 }}>{m.name}</span>
                <span style={{ fontSize:11, color:C.t3 }}>
                  {m.homes.toLocaleString()}棟
                </span>
                <span style={{
                  fontSize:11, fontWeight:600, color:"#1d4ed8",
                  background:"#dbeafe", borderRadius:6, padding:"2px 7px",
                }}>
                  需要 {demand}棟/年
                </span>
              </div>

              {/* 2行目: 完工シェア */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div style={{ background:"#f0f9ff", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, color:"#3b82f6", fontWeight:700, marginBottom:4 }}>完工シェア率（自動）</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                    <span style={{ fontSize:22, fontWeight:900, color:"#1d4ed8" }}>{compPct.toFixed(1)}</span>
                    <span style={{ fontSize:11, color:"#3b82f6" }}>%</span>
                    <span style={{ fontSize:11, color:C.t3, marginLeft:4 }}>{comp}棟 / {demand}棟</span>
                  </div>
                  <div style={{ marginTop:6, height:5, background:"#dbeafe", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ width:`${Math.min(compPct, 100)}%`, height:"100%", background:"#3b82f6", borderRadius:99 }}/>
                  </div>
                </div>

                <div style={{ background:"#fff7ed", borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, color:"#f97316", fontWeight:700, marginBottom:4 }}>契約シェア率（手動）</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
                    <span style={{ fontSize:22, fontWeight:900, color:"#ea580c" }}>{contrPct.toFixed(1)}</span>
                    <span style={{ fontSize:11, color:"#f97316" }}>%</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input
                      type="number"
                      min={0}
                      value={contr === 0 ? "" : contr}
                      placeholder="0"
                      onChange={e => setContract(m.id, Number(e.target.value) || 0)}
                      style={{
                        width:52, padding:"4px 6px",
                        border:`1.5px solid #fed7aa`, borderRadius:6,
                        fontSize:13, fontWeight:700, color:C.t1,
                        background:"#fff", outline:"none", textAlign:"center",
                      }}
                    />
                    <span style={{ fontSize:11, color:C.t2 }}>棟 / {demand}棟</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
