"use client";
import { useState, useMemo } from "react";
import type { StockItem, StockTransaction } from "@/lib/inventory-types";

interface HistoryTabProps {
  transactions: StockTransaction[];
  items: StockItem[];
}

type TypeFilter = "all" | "in" | "out";

export default function HistoryTab({ transactions, items }: HistoryTabProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [showCount, setShowCount] = useState(50);

  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    const result: { code: string; name: string }[] = [];
    for (const t of transactions) {
      if (!seen.has(t.colorCode)) {
        seen.add(t.colorCode);
        result.push({ code: t.colorCode, name: t.colorName });
      }
    }
    return result.sort((a, b) => a.code.localeCompare(b.code));
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        const mt = typeFilter === "all" || t.type === typeFilter;
        const mc = colorFilter === "all" || t.colorCode === colorFilter;
        return mt && mc;
      })
      .slice(0, showCount);
  }, [transactions, typeFilter, colorFilter, showCount]);

  const itemMap = useMemo(
    () => Object.fromEntries(items.map(i => [i.id, i])),
    [items]
  );

  return (
    <div>
      {/* ── フィルターバー ─────────────────────────────────── */}
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        {(["all","in","out"] as TypeFilter[]).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} style={{
            padding:"5px 14px", borderRadius:99, fontSize:11, fontWeight:700,
            cursor:"pointer", border:"1.5px solid",
            background: typeFilter===f ? (f==="in"?"#3b82f6":f==="out"?"#ea580c":"#0f172a") : "#fff",
            color:       typeFilter===f ? "#fff" : "#64748b",
            borderColor: typeFilter===f ? (f==="in"?"#3b82f6":f==="out"?"#ea580c":"#0f172a") : "#e2e8f0",
            transition:"all .15s",
          }}>
            {f==="all" ? "全て" : f==="in" ? "▲ 入庫" : "▼ 出庫"}
          </button>
        ))}

        {uniqueColors.length > 0 && (
          <select
            className="input-base"
            style={{ flex:1, minWidth:120, padding:"5px 10px", fontSize:12 }}
            value={colorFilter}
            onChange={e => setColorFilter(e.target.value)}
          >
            <option value="all">全色</option>
            {uniqueColors.map(c => (
              <option key={c.code} value={c.code}>{c.code} {c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── 履歴リスト ─────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <p style={{ fontWeight:700, color:"#475569" }}>
            {transactions.length === 0 ? "まだ取引履歴がありません" : "条件に一致する履歴がありません"}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {filtered.map((txn, i) => {
            const item = itemMap[txn.itemId];
            const colorHex = item?.colorHex ?? "#9098A0";
            const isIn = txn.type === "in";
            return (
              <div key={txn.id} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"12px 16px",
                borderBottom: i < filtered.length-1 ? "1px solid #f1f5f9" : "none",
                transition:"background .15s",
              }}>
                {/* 色スウォッチ */}
                <div style={{ width:24, height:24, borderRadius:6, background:colorHex, flexShrink:0, border:"1px solid rgba(0,0,0,.1)" }} />

                {/* 色情報 */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {txn.colorName}
                  </div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>
                    {txn.colorCode} ・ {txn.date}
                    {txn.reason && <span style={{ marginLeft:6 }}>｜{txn.reason}</span>}
                  </div>
                </div>

                {/* 入庫/出庫バッジ + 数量 */}
                <div style={{ flexShrink:0, textAlign:"right" }}>
                  <div style={{
                    fontSize:14, fontWeight:900,
                    color: isIn ? "#3b82f6" : "#ea580c",
                  }}>
                    {isIn ? "▲" : "▼"} {txn.amount}{txn.unit}
                  </div>
                  <div style={{
                    fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:99, marginTop:2,
                    background: isIn ? "#eff6ff" : "#fff7ed",
                    color:      isIn ? "#3b82f6" : "#ea580c",
                    display:"inline-block",
                  }}>
                    {isIn ? "入庫" : "出庫"}
                  </div>
                </div>
              </div>
            );
          })}

          {/* もっと見る */}
          {transactions.length > showCount && (
            <div style={{ padding:"12px 16px", textAlign:"center", borderTop:"1px solid #f1f5f9" }}>
              <button onClick={() => setShowCount(n => n + 50)} className="btn-outline" style={{ fontSize:12 }}>
                さらに表示（残 {transactions.length - showCount} 件）
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 統計サマリー ─────────────────────────────────────── */}
      {transactions.length > 0 && (
        <div className="card" style={{ marginTop:12 }}>
          <div className="section-title">取引サマリー</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[
              { label:"総取引数",   value:transactions.length,                                              unit:"件",  color:"#0f172a" },
              { label:"総入庫量",   value:transactions.filter(t=>t.type==="in").reduce((s,t)=>s+t.amount,0),  unit:"", color:"#3b82f6" },
              { label:"総出庫量",   value:transactions.filter(t=>t.type==="out").reduce((s,t)=>s+t.amount,0), unit:"", color:"#ea580c" },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:900, color:s.color }}>
                  {s.value}
                  {s.unit && <span style={{ fontSize:11, marginLeft:2, color:"#94a3b8" }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
