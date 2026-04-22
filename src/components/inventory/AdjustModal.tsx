"use client";
import { useState, useEffect } from "react";
import type { StockItem } from "@/lib/inventory-types";

interface AdjustModalProps {
  item: StockItem;
  initType: "in" | "out";
  onSave: (item: StockItem, type: "in" | "out", amount: number, reason: string, date: string) => void;
  onClose: () => void;
}

const today = () => new Date().toISOString().substring(0, 10);

export default function AdjustModal({ item, initType, onSave, onClose }: AdjustModalProps) {
  const [type, setType]     = useState<"in" | "out">(initType);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [date, setDate]     = useState(today());

  useEffect(() => { setType(initType); }, [initType]);

  const newStock = type === "in"
    ? item.stock + amount
    : Math.max(0, item.stock - amount);

  const delta = type === "in" ? `+${amount}` : `-${Math.min(amount, item.stock)}`;
  const isOver = type === "out" && amount > item.stock;

  const handleSave = () => {
    if (amount <= 0) return;
    onSave(item, type, amount, reason, date);
  };

  // バックドロップクリックで閉じる
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div onClick={handleBackdrop} style={{
      position:"fixed", inset:0, background:"rgba(15,23,42,.5)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      animation:"fadeIn .2s ease",
    }}>
      <div style={{
        background:"#fff", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:480,
        padding:"24px 20px 32px", animation:"slideUp .25s cubic-bezier(.16,1,.3,1)",
        maxHeight:"90vh", overflowY:"auto",
      }}>
        {/* ドラッグハンドル */}
        <div style={{ width:40, height:4, borderRadius:2, background:"#e2e8f0", margin:"0 auto 20px" }} />

        {/* タイトル */}
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:item.colorHex, border:"1px solid rgba(0,0,0,.1)" }} />
            <div>
              <div style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>{item.colorCode}</div>
              <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>{item.colorName}</div>
            </div>
          </div>
          <div style={{ fontSize:13, color:"#64748b" }}>
            現在庫: <strong style={{ color:"#0f172a", fontSize:15 }}>{item.stock}</strong> {item.unit}
          </div>
        </div>

        {/* 入庫/出庫トグル */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
          {(["in","out"] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              padding:"12px 0", borderRadius:12, fontSize:14, fontWeight:800, cursor:"pointer",
              border:"2px solid",
              background: type===t ? (t==="in"?"linear-gradient(135deg,#3b82f6,#1d4ed8)":"linear-gradient(135deg,#f59e0b,#d97706)") : "#f8fafc",
              color:      type===t ? "#fff" : "#64748b",
              borderColor:type===t ? (t==="in"?"#3b82f6":"#f59e0b") : "#e2e8f0",
              transition:"all .15s",
            }}>
              {t === "in" ? "＋ 入庫" : "－ 出庫"}
            </button>
          ))}
        </div>

        {/* 数量ステッパー */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>
            数量 <span style={{ color:"#94a3b8", fontWeight:400 }}>（{item.unit}）</span>
          </label>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setAmount(a => Math.max(1, a - 1))} style={{
              width:44, height:44, borderRadius:10, border:"1.5px solid #e2e8f0",
              background:"#f8fafc", fontSize:20, fontWeight:700, cursor:"pointer", color:"#475569",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>−</button>
            <input
              type="number" min={1} value={amount}
              onChange={e => setAmount(Math.max(1, parseInt(e.target.value)||1))}
              className="input-base"
              style={{ flex:1, textAlign:"center", fontSize:22, fontWeight:900, padding:"8px" }}
            />
            <button onClick={() => setAmount(a => a + 1)} style={{
              width:44, height:44, borderRadius:10, border:"1.5px solid #e2e8f0",
              background:"#f8fafc", fontSize:20, fontWeight:700, cursor:"pointer", color:"#475569",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>＋</button>
          </div>
        </div>

        {/* 日付 */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>日付</label>
          <input
            type="date" value={date}
            onChange={e => setDate(e.target.value)}
            className="input-base"
            style={{ fontSize:16 }}
          />
        </div>

        {/* 理由・メモ */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:8 }}>
            理由・メモ <span style={{ color:"#94a3b8", fontWeight:400 }}>（任意）</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="例: ○○現場使用、仕入れ補充など"
            rows={2}
            style={{
              width:"100%", padding:"9px 12px", background:"#f8fafc",
              border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14,
              color:"#0f172a", outline:"none", resize:"none", boxSizing:"border-box",
              fontFamily:"inherit",
            }}
          />
        </div>

        {/* プレビュー */}
        <div style={{
          padding:"12px 16px", borderRadius:12, marginBottom:20,
          background: type==="in" ? "#eff6ff" : isOver ? "#fef2f2" : "#fff7ed",
          border: `1px solid ${type==="in" ? "#bfdbfe" : isOver ? "#fecaca" : "#fed7aa"}`,
        }}>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:2 }}>調整後の在庫</div>
          <div style={{ fontSize:18, fontWeight:900, color: type==="in"?"#3b82f6":isOver?"#ef4444":"#ea580c" }}>
            {item.stock} {delta} = <span style={{ fontSize:22 }}>{newStock}</span> {item.unit}
          </div>
          {isOver && (
            <div style={{ fontSize:11, color:"#ef4444", marginTop:4 }}>⚠ 出庫量が現在庫を超えています（0缶になります）</div>
          )}
        </div>

        {/* ボタン */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10 }}>
          <button onClick={onClose} style={{
            padding:"13px 0", borderRadius:12, border:"1.5px solid #e2e8f0",
            background:"#f8fafc", color:"#64748b", fontSize:13, fontWeight:700, cursor:"pointer",
          }}>キャンセル</button>
          <button onClick={handleSave} style={{
            padding:"13px 0", borderRadius:12, border:"none",
            background: type==="in" ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "linear-gradient(135deg,#f59e0b,#d97706)",
            color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer",
            boxShadow: type==="in" ? "0 4px 12px rgba(59,130,246,.3)" : "0 4px 12px rgba(245,158,11,.3)",
          }}>
            {type === "in" ? "入庫を記録" : "出庫を記録"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
