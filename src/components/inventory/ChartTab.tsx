"use client";
import { useMemo } from "react";
import type { StockItem, StockTransaction } from "@/lib/inventory-types";

interface ChartTabProps {
  items: StockItem[];
  transactions: StockTransaction[];
}

// ── 水平バーチャート（在庫量） ──────────────────────────────
function StockBarChart({ items }: { items: StockItem[] }) {
  const sorted = [...items].sort((a, b) => b.stock - a.stock).slice(0, 20);
  const maxStock = sorted[0]?.stock || 1;

  if (sorted.length === 0) {
    return <p style={{ color:"#94a3b8", textAlign:"center", padding:20 }}>データなし</p>;
  }

  const ROW_H = 36;
  const LABEL_W = 90;
  const BAR_MAX = 200;
  const SVG_W = LABEL_W + BAR_MAX + 50;
  const SVG_H = sorted.length * ROW_H + 10;

  return (
    <div style={{ overflowX:"auto" }}>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width:"100%", minWidth:280, height:"auto", display:"block" }}>
        {sorted.map((item, i) => {
          const y = i * ROW_H + 5;
          const barW = (item.stock / maxStock) * BAR_MAX;
          const isLow = item.minStock > 0 && item.stock <= item.minStock;
          const isWarn = item.minStock > 0 && !isLow && item.stock <= item.minStock * 1.5;
          const barColor = isLow ? "#ef4444" : isWarn ? "#f59e0b" : item.colorHex;

          return (
            <g key={item.id}>
              {/* 色スウォッチ */}
              <rect x={0} y={y + 8} width={14} height={14} rx={3}
                fill={item.colorHex} stroke="rgba(0,0,0,.1)" strokeWidth={0.5} />
              {/* ラベル */}
              <text x={18} y={y + 18} fontSize={9} fill="#0f172a" fontWeight="700" fontFamily="sans-serif"
                style={{ dominantBaseline:"middle" }}>
                {item.colorName.length > 8 ? item.colorName.slice(0,8)+"…" : item.colorName}
              </text>
              <text x={18} y={y + 27} fontSize={8} fill="#94a3b8" fontFamily="sans-serif">
                {item.colorCode}
              </text>
              {/* バー背景 */}
              <rect x={LABEL_W} y={y + 9} width={BAR_MAX} height={12} rx={3} fill="#f1f5f9" />
              {/* バー */}
              {barW > 0 && (
                <rect x={LABEL_W} y={y + 9} width={barW} height={12} rx={3} fill={barColor} fillOpacity={0.85} />
              )}
              {/* 数量 */}
              <text x={LABEL_W + barW + 5} y={y + 18} fontSize={9} fill="#475569" fontWeight="700" fontFamily="sans-serif"
                style={{ dominantBaseline:"middle" }}>
                {item.stock}{item.unit}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── 月次入出庫バーチャート ────────────────────────────────────
function MonthlyChart({ transactions }: { transactions: StockTransaction[] }) {
  const months = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().substring(0, 7);
      const label = `${d.getMonth() + 1}月`;
      const ts = transactions.filter(t => t.date.startsWith(key));
      result.push({
        key, label,
        inAmt:  ts.filter(t => t.type === "in").reduce((s, t) => s + t.amount, 0),
        outAmt: ts.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0),
      });
    }
    return result;
  }, [transactions]);

  const maxVal = Math.max(...months.flatMap(m => [m.inAmt, m.outAmt]), 1);

  const W = 340, H = 160;
  const mt = 10, mb = 30, ml = 30, mr = 10;
  const cw = W - ml - mr;
  const ch = H - mt - mb;
  const colW = cw / months.length;
  const barW = colW * 0.32;

  const yOf = (v: number) => mt + (1 - v / maxVal) * ch;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => maxVal * p);
  const fmtY = (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(Math.round(v));

  if (transactions.length === 0) {
    return <p style={{ color:"#94a3b8", textAlign:"center", padding:20 }}>データなし</p>;
  }

  return (
    <div style={{ overflowX:"auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", minWidth:260, height:"auto", display:"block" }}>
        {/* グリッド */}
        {ticks.map((v, i) => (
          <line key={i} x1={ml} x2={W - mr} y1={yOf(v)} y2={yOf(v)} stroke="#f1f5f9" strokeWidth={1} />
        ))}
        {/* Y軸ラベル */}
        {ticks.map((v, i) => (
          <text key={i} x={ml - 4} y={yOf(v) + 3.5} textAnchor="end" fontSize={8} fill="#94a3b8" fontFamily="sans-serif">
            {fmtY(v)}
          </text>
        ))}

        {/* 軸 */}
        <line x1={ml} x2={ml} y1={mt} y2={mt+ch} stroke="#e2e8f0" strokeWidth={1} />
        <line x1={ml} x2={W-mr} y1={mt+ch} y2={mt+ch} stroke="#e2e8f0" strokeWidth={1} />

        {/* バー */}
        {months.map((m, i) => {
          const cx = ml + i * colW + colW / 2;
          return (
            <g key={m.key}>
              {/* 入庫 */}
              {m.inAmt > 0 && (
                <rect
                  x={cx - barW - 2} y={yOf(m.inAmt)}
                  width={barW} height={Math.max(1, mt + ch - yOf(m.inAmt))}
                  rx={2} fill="#3b82f6" fillOpacity={0.8}
                />
              )}
              {/* 出庫 */}
              {m.outAmt > 0 && (
                <rect
                  x={cx + 2} y={yOf(m.outAmt)}
                  width={barW} height={Math.max(1, mt + ch - yOf(m.outAmt))}
                  rx={2} fill="#f59e0b" fillOpacity={0.8}
                />
              )}
              {/* X ラベル */}
              <text x={cx} y={mt + ch + 14} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="sans-serif">
                {m.label}
              </text>
            </g>
          );
        })}

        {/* 凡例 */}
        <circle cx={ml + 6}   cy={H - 4} r={4} fill="#3b82f6" />
        <text   x={ml + 14}  y={H - 1} fontSize={8} fill="#64748b" fontFamily="sans-serif">入庫</text>
        <circle cx={ml + 46}  cy={H - 4} r={4} fill="#f59e0b" />
        <text   x={ml + 54}  y={H - 1} fontSize={8} fill="#64748b" fontFamily="sans-serif">出庫</text>
      </svg>
    </div>
  );
}

// ── カテゴリ円グラフ ─────────────────────────────────────────
function CategoryPie({ items }: { items: StockItem[] }) {
  const groups = useMemo(() => {
    const map: Record<string, { count: number; stock: number; color: string }> = {};
    const colorMap: Record<string, string> = {
      "外壁・屋根用": "#3b82f6",
      "屋根専用":     "#10b981",
      "カスタム":     "#8b5cf6",
    };
    for (const item of items) {
      const cat = item.isCustom ? "カスタム" : item.category;
      if (!map[cat]) map[cat] = { count: 0, stock: 0, color: colorMap[cat] ?? "#9098A0" };
      map[cat].count++;
      map[cat].stock += item.stock;
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [items]);

  const total = groups.reduce((s, g) => s + g.count, 0);
  if (total === 0) return null;

  let cumAngle = -Math.PI / 2;
  const CX = 60, CY = 60, R = 50;

  const segments = groups.map(g => {
    const angle = (g.count / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle += angle;
    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { ...g, d: `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} Z` };
  });

  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
      <svg viewBox="0 0 120 120" style={{ width:100, height:100, flexShrink:0 }}>
        {segments.map((seg, i) => (
          <path key={i} d={seg.d} fill={seg.color} stroke="#fff" strokeWidth={2} />
        ))}
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:seg.color, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#0f172a" }}>{seg.name}</div>
              <div style={{ fontSize:10, color:"#64748b" }}>{seg.count}色 / 計{seg.stock}缶相当</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChartTab({ items, transactions }: ChartTabProps) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* 在庫量ランキング */}
      <div className="card">
        <div className="section-title">在庫量ランキング（上位20色）</div>
        <StockBarChart items={items} />
      </div>

      {/* 月次入出庫 */}
      <div className="card">
        <div className="section-title">月次入出庫（直近6ヶ月）</div>
        <MonthlyChart transactions={transactions} />
      </div>

      {/* カテゴリ分布 */}
      {items.length > 0 && (
        <div className="card">
          <div className="section-title">カテゴリ別分布</div>
          <CategoryPie items={items} />
        </div>
      )}

      {/* 総在庫サマリー */}
      <div className="card">
        <div className="section-title">在庫サマリー</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
          {[
            { label:"管理色数",    value:items.length,                                                  unit:"色",  color:"#3b82f6" },
            { label:"総在庫量",    value:items.reduce((s,i)=>s+i.stock,0),                              unit:"缶",  color:"#10b981" },
            { label:"低在庫",     value:items.filter(i=>i.minStock>0&&i.stock<=i.minStock).length,      unit:"色",  color:"#ef4444" },
            { label:"平均在庫",   value:items.length>0?Math.round(items.reduce((s,i)=>s+i.stock,0)/items.length):0, unit:"缶", color:"#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ background:"#f8fafc", borderRadius:12, padding:"14px 16px" }}>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:900, color:s.color }}>
                {s.value}
                <span style={{ fontSize:11, marginLeft:2, color:"#94a3b8", fontWeight:600 }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
