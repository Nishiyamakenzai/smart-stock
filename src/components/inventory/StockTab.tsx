"use client";
import { useState, useMemo } from "react";
import type { StockItem } from "@/lib/inventory-types";

type Filter = "all" | "wall" | "roof" | "custom" | "low";

interface StockTabProps {
  items: StockItem[];
  onAdjust: (item: StockItem, type: "in" | "out") => void;
  onEdit: (item: StockItem) => void;
  onAddColor: () => void;
}

function stockColor(item: StockItem): string {
  if (item.minStock <= 0) return "#3b82f6";
  if (item.stock <= item.minStock) return "#ef4444";
  if (item.stock <= item.minStock * 1.5) return "#f59e0b";
  return "#10b981";
}

function stockBarWidth(item: StockItem): number {
  const cap = Math.max(item.minStock * 3, item.stock, 1);
  return Math.min(item.stock / cap * 100, 100);
}

function StockCard({ item, onAdjust, onEdit }: { item: StockItem; onAdjust: StockTabProps["onAdjust"]; onEdit: StockTabProps["onEdit"] }) {
  const isLow = item.minStock > 0 && item.stock <= item.minStock;
  const isWarn = item.minStock > 0 && !isLow && item.stock <= item.minStock * 1.5;
  const sc = stockColor(item);
  const bw = stockBarWidth(item);

  // テキスト色（明るい背景 vs 暗い背景）
  const needsDarkText = isLightHex(item.colorHex);

  return (
    <div className="card stagger-item" style={{ padding:"14px", margin:0, position:"relative" }}>
      {/* ヘッダー：カラースウォッチ + コード + 名前 */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
        <div style={{
          width:32, height:32, borderRadius:8, background:item.colorHex,
          flexShrink:0, border:"1px solid rgba(0,0,0,.12)",
          boxShadow:"0 1px 4px rgba(0,0,0,.1)",
        }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color:"#64748b", fontWeight:600, letterSpacing:.5 }}>
            {item.colorCode}
            <span style={{ marginLeft:6, fontSize:9, padding:"1px 5px", borderRadius:99, background:item.category==="屋根専用"?"#e0f2fe":"#f0fdf4", color:item.category==="屋根専用"?"#0284c7":"#15803d", fontWeight:700 }}>
              {item.isCustom ? "カスタム" : item.category}
            </span>
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1 }}>
            {item.colorName}
          </div>
        </div>
        {(isLow || isWarn) && (
          <span style={{ flexShrink:0, padding:"2px 7px", borderRadius:99, fontSize:9, fontWeight:800, background:isLow?"#fef2f2":"#fffbeb", color:isLow?"#ef4444":"#d97706", border:`1px solid ${isLow?"#fecaca":"#fed7aa"}` }}>
            {isLow ? "LOW" : "注意"}
          </span>
        )}
      </div>

      {/* 在庫バー */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
          <span style={{ fontSize:11, color:"#64748b" }}>在庫</span>
          <span style={{ fontSize:20, fontWeight:900, color:sc, lineHeight:1 }}>
            {item.stock}
            <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", marginLeft:3 }}>{item.unit}</span>
          </span>
        </div>
        <div style={{ height:8, background:"#e2e8f0", borderRadius:4, overflow:"hidden" }}>
          <div style={{ width:`${bw}%`, height:"100%", background:sc, borderRadius:4, transition:"width .6s cubic-bezier(.16,1,.3,1)" }} />
        </div>
        {item.minStock > 0 && (
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:3, textAlign:"right" }}>
            最低在庫: {item.minStock}{item.unit}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => onAdjust(item, "in")} style={{
          flex:1, padding:"9px 0", background:"#eff6ff", color:"#3b82f6",
          border:"1.5px solid #bfdbfe", borderRadius:8, fontSize:12, fontWeight:700,
          cursor:"pointer", transition:"background .15s",
        }}>＋ 入庫</button>
        <button onClick={() => onAdjust(item, "out")} style={{
          flex:1, padding:"9px 0", background:"#fff7ed", color:"#ea580c",
          border:"1.5px solid #fed7aa", borderRadius:8, fontSize:12, fontWeight:700,
          cursor:"pointer", transition:"background .15s",
        }}>－ 出庫</button>
        <button onClick={() => onEdit(item)} style={{
          padding:"9px 11px", background:"#f8fafc", color:"#64748b",
          border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:14, cursor:"pointer",
          transition:"background .15s",
        }}>⚙</button>
      </div>

      {item.note && (
        <div style={{ marginTop:8, fontSize:11, color:"#94a3b8", borderTop:"1px solid #f1f5f9", paddingTop:6 }}>
          {item.note}
        </div>
      )}
    </div>
  );
}

function isLightHex(hex: string): boolean {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 160;
}

const FILTER_LABELS: [Filter, string][] = [
  ["all","全て"],["wall","外壁用"],["roof","屋根専用"],["custom","カスタム"],["low","低在庫"],
];

export default function StockTab({ items, onAdjust, onEdit, onAddColor }: StockTabProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter(item => {
        const ms = !q || item.colorCode.includes(q) || item.colorName.toLowerCase().includes(q);
        const mf = filter === "all" ? true
          : filter === "wall"   ? !item.isCustom && item.category === "外壁・屋根用"
          : filter === "roof"   ? !item.isCustom && item.category === "屋根専用"
          : filter === "custom" ? item.isCustom
          : filter === "low"    ? item.minStock > 0 && item.stock <= item.minStock
          : true;
        return ms && mf;
      })
      .sort((a, b) => {
        // 低在庫を先頭に
        const la = a.minStock > 0 && a.stock <= a.minStock;
        const lb = b.minStock > 0 && b.stock <= b.minStock;
        if (la !== lb) return la ? -1 : 1;
        return a.colorCode.localeCompare(b.colorCode);
      });
  }, [items, search, filter]);

  const lowCount = useMemo(() => items.filter(i => i.minStock > 0 && i.stock <= i.minStock).length, [items]);

  return (
    <div>
      {/* ── アクションバー ─────────────────────────────────── */}
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <button onClick={onAddColor} className="btn-primary" style={{ fontSize:12, padding:"9px 16px" }}>
          ＋ 色を追加
        </button>
        {lowCount > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:12, fontWeight:700, color:"#ef4444" }}>
            ⚠ 低在庫 {lowCount}色
          </div>
        )}
      </div>

      {/* ── 検索バー ───────────────────────────────────────── */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94a3b8" }}>🔍</div>
        <input
          className="input-base"
          style={{ paddingLeft:36 }}
          placeholder="色名・番号で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── フィルター ─────────────────────────────────────── */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:14 }}>
        {FILTER_LABELS.map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding:"5px 12px", borderRadius:99, fontSize:11, fontWeight:700, cursor:"pointer",
            whiteSpace:"nowrap", border:"1.5px solid",
            background: filter===key ? "#3b82f6" : "#fff",
            color:       filter===key ? "#fff"    : "#64748b",
            borderColor: filter===key ? "#3b82f6" : "#e2e8f0",
            transition:"background .15s, color .15s",
          }}>
            {label}
            {key === "low" && lowCount > 0 && (
              <span style={{ marginLeft:4, background:"#ef4444", color:"#fff", borderRadius:99, padding:"0 5px", fontSize:9 }}>{lowCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── カードグリッド ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎨</div>
          {items.length === 0
            ? <><p style={{ fontWeight:700, color:"#475569", marginBottom:8 }}>まだ色が登録されていません</p>
                <p style={{ fontSize:12 }}>「＋ 色を追加」から在庫管理を始めましょう</p></>
            : <p style={{ fontWeight:700, color:"#475569" }}>「{search || filter}」に一致する色がありません</p>
          }
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
          {filtered.map(item => (
            <StockCard key={item.id} item={item} onAdjust={onAdjust} onEdit={onEdit} />
          ))}
        </div>
      )}

      {/* モバイル: 3列以上対応 */}
      <style>{`@media(min-width:520px){.inv-grid{grid-template-columns:repeat(3,1fr)!important}}`}</style>
    </div>
  );
}
