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

// 現在の期（12月〜11月）の "YYYY-MM" 範囲を返す
function currentFYRange(): [string, string] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0=Jan, 11=Dec
  const startY = m === 11 ? y : y - 1;
  return [`${startY}-12`, `${startY + 1}-11`];
}

function isInCurrentFY(contractDate?: string): boolean {
  if (!contractDate) return false;
  const [start, end] = currentFYRange();
  return contractDate >= start && contractDate <= end;
}

// 3本横棒グラフ（完工済み=緑 / 完工見込み=青 / 契約=オレンジ）
function ShareChart({ items }: {
  items: { name: string; donePct: number; forecastPct: number; contrPct: number }[]
}) {
  if (items.length === 0) return null;
  const maxPct = Math.max(15, ...items.flatMap(i => [i.donePct, i.forecastPct, i.contrPct]));
  const rowH = 60, labelW = 86, barW = 195, pad = 8;
  const svgH = items.length * rowH + pad * 2 + 22;

  return (
    <svg width="100%" viewBox={`0 0 ${labelW + barW + 52} ${svgH}`} style={{ display:"block", overflow:"visible" }}>
      {items.map((it, i) => {
        const y = pad + i * rowH;
        const dw = Math.max(0, (it.donePct / maxPct) * barW);
        const fw = Math.max(0, (it.forecastPct / maxPct) * barW);
        const cw = Math.max(0, (it.contrPct / maxPct) * barW);
        return (
          <g key={it.name}>
            <text x={labelW - 5} y={y + 11} textAnchor="end" fontSize="10" fill={C.t2}>{it.name}</text>
            {/* 完工済み */}
            <rect x={labelW} y={y}      width={dw} height={13} fill="#10b981" rx="3" opacity={0.9}/>
            {it.donePct > 0 && <text x={labelW + dw + 3} y={y + 11}     fontSize="9" fill="#059669" fontWeight="700">{it.donePct.toFixed(1)}%</text>}
            {/* 完工見込み */}
            <rect x={labelW} y={y + 17} width={fw} height={13} fill="#3b82f6" rx="3" opacity={0.9}/>
            {it.forecastPct > 0 && <text x={labelW + fw + 3} y={y + 28} fontSize="9" fill="#1d4ed8" fontWeight="700">{it.forecastPct.toFixed(1)}%</text>}
            {/* 契約 */}
            <rect x={labelW} y={y + 34} width={cw} height={13} fill="#f97316" rx="3" opacity={0.9}/>
            {it.contrPct > 0 && <text x={labelW + cw + 3} y={y + 45}   fontSize="9" fill="#ea580c" fontWeight="700">{it.contrPct.toFixed(1)}%</text>}
          </g>
        );
      })}
      {/* 凡例 */}
      <g transform={`translate(${labelW}, ${svgH - 14})`}>
        <rect x={0}   y={0} width={9} height={9} fill="#10b981" rx="2"/>
        <text x={12}  y={8} fontSize="8.5" fill={C.t2}>完工済み</text>
        <rect x={62}  y={0} width={9} height={9} fill="#3b82f6" rx="2"/>
        <text x={74}  y={8} fontSize="8.5" fill={C.t2}>完工見込み</text>
        <rect x={140} y={0} width={9} height={9} fill="#f97316" rx="2"/>
        <text x={152} y={8} fontSize="8.5" fill={C.t2}>契約</text>
      </g>
    </svg>
  );
}

export default function ShareRateTab({ projects, shareRate, onChange }: Props) {
  const { favorites } = shareRate;
  const [search, setSearch] = useState("");
  const [fyRange] = useState(() => currentFYRange());

  const toggleFav = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    onChange({ ...shareRate, favorites: next });
  };

  const sorted = [...YAMANASHI_MUNICIPALITIES].sort((a, b) => {
    const af = favorites.includes(a.id), bf = favorites.includes(b.id);
    if (af !== bf) return af ? -1 : 1;
    return b.homes - a.homes;
  });

  const filtered = search ? sorted.filter(m => m.name.includes(search)) : sorted;

  const getStats = (id: string) => {
    const area = projects.filter(p => p.area === id);
    return {
      done:     area.filter(p => p.status === "完了").length,
      forecast: area.length,
      contract: area.filter(p => isInCurrentFY(p.contractDate)).length,
    };
  };

  // グラフ：★お気に入り ＋ 実績のある市町村
  const chartItems = sorted
    .filter(m => {
      const isFav = favorites.includes(m.id);
      const s = getStats(m.id);
      return isFav || s.done > 0 || s.forecast > 0 || s.contract > 0;
    })
    .map(m => {
      const demand = calcDemand(m.homes);
      const s = getStats(m.id);
      return {
        name: m.name,
        donePct:     s.done     / demand * 100,
        forecastPct: s.forecast / demand * 100,
        contrPct:    s.contract / demand * 100,
      };
    });

  // 現在の期の表示文字列
  const fyLabel = `${fyRange[0].replace("-", "年")}月 〜 ${fyRange[1].replace("-", "年")}月`;

  return (
    <>
      {/* ヘッダー説明 */}
      <div className="card stagger-item">
        <div className="section-title">🗾 山梨県 エリア別シェア率</div>
        <p style={{ fontSize:12, color:C.t2, margin:"0 0 8px", lineHeight:1.7 }}>
          戸建て棟数 × 0.8% ＝ 年間塗装需要棟数（＝100%）　現在の期：{fyLabel}
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {[
            { c:"#10b981", label:"完工済み", desc:"ステータス「完了」の案件" },
            { c:"#3b82f6", label:"完工見込み", desc:"全登録案件（ステータス問わず）" },
            { c:"#f97316", label:"契約", desc:"今期に契約年月がある案件" },
          ].map(it => (
            <span key={it.label} style={{
              display:"flex", alignItems:"center", gap:5,
              fontSize:11, color:C.t2, background:C.card2,
              borderRadius:8, padding:"4px 8px",
            }}>
              <span style={{ width:9, height:9, borderRadius:2, background:it.c, display:"inline-block", flexShrink:0 }}/>
              <strong style={{ color:C.t1 }}>{it.label}</strong>：{it.desc}
            </span>
          ))}
        </div>
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
          type="text" placeholder="市町村を検索…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base" style={{ fontSize:13 }}
        />
      </div>

      {/* 市町村リスト */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(m => {
          const demand = calcDemand(m.homes);
          const isFav = favorites.includes(m.id);
          const { done, forecast, contract } = getStats(m.id);
          const donePct     = done     / demand * 100;
          const forecastPct = forecast / demand * 100;
          const contrPct    = contract / demand * 100;

          return (
            <div key={m.id} style={{
              background: isFav ? "#eff6ff" : C.card,
              border: `1.5px solid ${isFav ? "#bfdbfe" : C.bdr}`,
              borderRadius: 14,
              padding: "12px 14px",
            }}>
              {/* ヘッダー */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <button onClick={() => toggleFav(m.id)}
                  style={{ background:"none", border:"none", cursor:"pointer",
                    fontSize:18, lineHeight:1, padding:"0 2px",
                    color: isFav ? "#f59e0b" : C.t4 }}>
                  {isFav ? "★" : "☆"}
                </button>
                <span style={{ fontWeight:700, fontSize:14, color:C.t1, flex:1 }}>{m.name}</span>
                <span style={{ fontSize:11, color:C.t3 }}>{m.homes.toLocaleString()}棟</span>
                <span style={{
                  fontSize:11, fontWeight:600, color:"#1d4ed8",
                  background:"#dbeafe", borderRadius:6, padding:"2px 7px",
                }}>需要 {demand}棟/年</span>
              </div>

              {/* 3つのシェア率 */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                {[
                  { label:"完工済み",   pct:donePct,     count:done,     bg:"#ecfdf5", barBg:"#a7f3d0", barC:"#10b981", tc:"#059669" },
                  { label:"完工見込み", pct:forecastPct, count:forecast, bg:"#eff6ff", barBg:"#bfdbfe", barC:"#3b82f6", tc:"#1d4ed8" },
                  { label:"契約",       pct:contrPct,    count:contract, bg:"#fff7ed", barBg:"#fed7aa", barC:"#f97316", tc:"#ea580c" },
                ].map(it => (
                  <div key={it.label} style={{ background:it.bg, borderRadius:10, padding:"8px 10px" }}>
                    <div style={{ fontSize:9, color:it.tc, fontWeight:700, marginBottom:2 }}>{it.label}</div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
                      <span style={{ fontSize:18, fontWeight:900, color:it.tc }}>{it.pct.toFixed(1)}</span>
                      <span style={{ fontSize:10, color:it.barC }}>%</span>
                    </div>
                    <div style={{ fontSize:13, fontWeight:800, color:it.tc, marginTop:1 }}>{it.count}件</div>
                    <div style={{ fontSize:9, color:C.t3 }}>需要 {demand}棟</div>
                    <div style={{ marginTop:4, height:4, background:it.barBg, borderRadius:99 }}>
                      <div style={{ width:`${Math.min(it.pct, 100)}%`, height:"100%", background:it.barC, borderRadius:99 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
