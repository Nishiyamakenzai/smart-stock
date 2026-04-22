"use client";
import { useState, useMemo } from "react";
import { PAINT_COLORS } from "@/lib/paint-colors";
import type { StockItem } from "@/lib/inventory-types";

interface ColorModalProps {
  editItem: StockItem | null;
  existingCodes: string[];
  onAdd: (item: StockItem) => void;
  onEdit: (item: StockItem) => void;
  onDelete: (itemId: string) => void;
  onClose: () => void;
}

type Mode = "pick" | "astech" | "custom";

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ColorModal({ editItem, existingCodes, onAdd, onEdit, onDelete, onClose }: ColorModalProps) {
  const isEdit = !!editItem;

  // ── モード ──────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>(isEdit ? (editItem.isCustom ? "custom" : "astech") : "pick");

  // ── アステック色選択 ─────────────────────────────────────
  const [astechSearch, setAstechSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState(isEdit && !editItem.isCustom ? editItem.colorCode : "");

  const filteredColors = useMemo(() => {
    const q = astechSearch.toLowerCase();
    return PAINT_COLORS.filter(c =>
      !existingCodes.includes(c.code) || (isEdit && c.code === editItem?.colorCode)
    ).filter(c =>
      !q || c.code.includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [astechSearch, existingCodes, isEdit, editItem]);

  // ── カスタム色フォーム ─────────────────────────────────
  const [customCode,  setCustomCode]  = useState(isEdit && editItem.isCustom ? editItem.colorCode : "");
  const [customName,  setCustomName]  = useState(isEdit && editItem.isCustom ? editItem.colorName : "");
  const [customHex,   setCustomHex]   = useState(isEdit && editItem.isCustom ? editItem.colorHex : "#9098A0");

  // ── 共通フォーム ───────────────────────────────────────
  const [unit,       setUnit]       = useState(editItem?.unit ?? "缶");
  const [initStock,  setInitStock]  = useState(editItem?.stock ?? 0);
  const [minStock,   setMinStock]   = useState(editItem?.minStock ?? 3);
  const [note,       setNote]       = useState(editItem?.note ?? "");

  const [confirmDel, setConfirmDel] = useState(false);

  // ── 保存 ─────────────────────────────────────────────
  const handleSave = () => {
    const now = new Date().toISOString();

    if (mode === "astech") {
      const color = PAINT_COLORS.find(c => c.code === selectedCode);
      if (!color) return;
      const item: StockItem = {
        id:        isEdit ? editItem!.id : genId(),
        colorCode: color.code,
        colorName: color.name,
        colorHex:  color.hex,
        isCustom:  false,
        category:  color.category,
        stock:     isEdit ? editItem!.stock : initStock,
        unit, minStock, note,
        addedAt:   isEdit ? editItem!.addedAt : now,
        updatedAt: now,
      };
      isEdit ? onEdit(item) : onAdd(item);

    } else if (mode === "custom") {
      if (!customName.trim()) return;
      const code = customCode.trim() || `CUST-${Date.now().toString(36).toUpperCase()}`;
      const item: StockItem = {
        id:        isEdit ? editItem!.id : genId(),
        colorCode: code,
        colorName: customName.trim(),
        colorHex:  customHex,
        isCustom:  true,
        category:  "カスタム",
        stock:     isEdit ? editItem!.stock : initStock,
        unit, minStock, note,
        addedAt:   isEdit ? editItem!.addedAt : now,
        updatedAt: now,
      };
      isEdit ? onEdit(item) : onAdd(item);
    }
  };

  const canSave = mode === "astech" ? !!selectedCode : !!customName.trim();

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
        background:"#fff", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:500,
        padding:"20px 20px 40px",
        maxHeight:"92vh", overflowY:"auto",
        animation:"slideUp .25s cubic-bezier(.16,1,.3,1)",
      }}>
        {/* ハンドル */}
        <div style={{ width:40, height:4, borderRadius:2, background:"#e2e8f0", margin:"0 auto 16px" }} />

        {/* タイトル */}
        <div style={{ fontSize:17, fontWeight:800, color:"#0f172a", marginBottom:16, textAlign:"center" }}>
          {isEdit ? "色の設定を編集" : "在庫に色を追加"}
        </div>

        {/* ── モード選択（新規時のみ） ── */}
        {!isEdit && mode === "pick" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            <button onClick={() => setMode("astech")} style={{
              padding:"20px 12px", borderRadius:16, border:"2px solid #3b82f6",
              background:"#eff6ff", cursor:"pointer", textAlign:"center",
            }}>
              <div style={{ fontSize:24, marginBottom:8 }}>🎨</div>
              <div style={{ fontSize:13, fontWeight:800, color:"#1d4ed8" }}>アステック</div>
              <div style={{ fontSize:11, color:"#3b82f6", marginTop:2 }}>標準色から選ぶ</div>
              <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>89色対応</div>
            </button>
            <button onClick={() => setMode("custom")} style={{
              padding:"20px 12px", borderRadius:16, border:"2px solid #8b5cf6",
              background:"#f5f3ff", cursor:"pointer", textAlign:"center",
            }}>
              <div style={{ fontSize:24, marginBottom:8 }}>✏️</div>
              <div style={{ fontSize:13, fontWeight:800, color:"#6d28d9" }}>カスタム</div>
              <div style={{ fontSize:11, color:"#8b5cf6", marginTop:2 }}>自分で色を追加</div>
              <div style={{ fontSize:10, color:"#94a3b8", marginTop:4 }}>自由入力</div>
            </button>
          </div>
        )}

        {/* ── アステック色選択 ── */}
        {mode === "astech" && (
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>アステック標準色を選択</span>
              {!isEdit && <button onClick={() => setMode("pick")} style={{ fontSize:11, color:"#94a3b8", background:"none", border:"none", cursor:"pointer" }}>← 戻る</button>}
            </div>

            {/* 検索 */}
            <div style={{ position:"relative", marginBottom:10 }}>
              <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94a3b8" }}>🔍</div>
              <input className="input-base" style={{ paddingLeft:32, fontSize:14 }}
                placeholder="色名・番号で検索..."
                value={astechSearch} onChange={e => setAstechSearch(e.target.value)} />
            </div>

            {/* カラーグリッド */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, maxHeight:240, overflowY:"auto", padding:"4px 2px" }}>
              {filteredColors.map(c => {
                const isSel = selectedCode === c.code;
                return (
                  <button key={c.code} onClick={() => setSelectedCode(c.code)} style={{
                    padding:"8px 4px", borderRadius:10, border:`2px solid ${isSel?"#3b82f6":"transparent"}`,
                    background: isSel ? "#eff6ff" : "#f8fafc",
                    cursor:"pointer", textAlign:"center",
                    outline:"none", transition:"all .15s",
                    boxShadow: isSel ? "0 0 0 2px #3b82f6" : "none",
                  }}>
                    <div style={{ width:32, height:22, borderRadius:6, background:c.hex, margin:"0 auto 4px", border:"1px solid rgba(0,0,0,.1)" }} />
                    <div style={{ fontSize:8, fontWeight:700, color:"#64748b", lineHeight:1.2 }}>{c.code}</div>
                    <div style={{ fontSize:8, color:"#0f172a", lineHeight:1.3, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {c.name.length > 6 ? c.name.slice(0,6)+"…" : c.name}
                    </div>
                  </button>
                );
              })}
              {filteredColors.length === 0 && (
                <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"20px 0", color:"#94a3b8", fontSize:12 }}>
                  一致する色がありません
                </div>
              )}
            </div>

            {/* 選択中の色 */}
            {selectedCode && (() => {
              const c = PAINT_COLORS.find(x => x.code === selectedCode);
              if (!c) return null;
              return (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10, padding:"10px 12px", background:"#eff6ff", borderRadius:10, border:"1px solid #bfdbfe" }}>
                  <div style={{ width:28, height:28, borderRadius:6, background:c.hex, border:"1px solid rgba(0,0,0,.1)" }} />
                  <div>
                    <div style={{ fontSize:12, fontWeight:800, color:"#1d4ed8" }}>{c.code} {c.name}</div>
                    <div style={{ fontSize:10, color:"#3b82f6" }}>{c.category}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── カスタム色フォーム ── */}
        {mode === "custom" && (
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>カスタム色を追加</span>
              {!isEdit && <button onClick={() => setMode("pick")} style={{ fontSize:11, color:"#94a3b8", background:"none", border:"none", cursor:"pointer" }}>← 戻る</button>}
            </div>

            {/* 色見本 */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, padding:"12px 14px", background:"#f8fafc", borderRadius:12 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:customHex, border:"1px solid rgba(0,0,0,.12)", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>参考カラー</label>
                <input type="color" value={customHex} onChange={e => setCustomHex(e.target.value)}
                  style={{ width:48, height:28, padding:0, border:"1.5px solid #e2e8f0", borderRadius:6, cursor:"pointer" }} />
                <span style={{ marginLeft:10, fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{customHex}</span>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>色番号（任意）</label>
                <input className="input-base" placeholder="例: MY-001"
                  value={customCode} onChange={e => setCustomCode(e.target.value)} style={{ fontSize:14 }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>色名 *</label>
                <input className="input-base" placeholder="例: オリジナルグレー"
                  value={customName} onChange={e => setCustomName(e.target.value)} style={{ fontSize:14 }} />
              </div>
            </div>
          </div>
        )}

        {/* ── 共通フォーム（色を選んだ後） ── */}
        {(mode === "astech" || mode === "custom") && (
          <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>単位</label>
                <select className="input-base" value={unit} onChange={e => setUnit(e.target.value)} style={{ fontSize:14 }}>
                  {["缶","kg","L","セット","本","袋"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              {!isEdit && (
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>初期在庫</label>
                  <input type="number" min={0} value={initStock}
                    onChange={e => setInitStock(Math.max(0, parseInt(e.target.value)||0))}
                    className="input-base" style={{ fontSize:16, textAlign:"center" }} />
                </div>
              )}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>最低在庫</label>
                <input type="number" min={0} value={minStock}
                  onChange={e => setMinStock(Math.max(0, parseInt(e.target.value)||0))}
                  className="input-base" style={{ fontSize:16, textAlign:"center" }} />
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>
                メモ <span style={{ fontWeight:400, color:"#94a3b8" }}>（任意）</span>
              </label>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="保管場所、仕様など"
                rows={2}
                style={{ width:"100%", padding:"9px 12px", background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, color:"#0f172a", outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
            </div>

            {/* ボタン */}
            <div style={{ display:"grid", gridTemplateColumns: isEdit ? "1fr 1fr 2fr" : "1fr 2fr", gap:8 }}>
              <button onClick={onClose} style={{
                padding:"12px 0", borderRadius:12, border:"1.5px solid #e2e8f0",
                background:"#f8fafc", color:"#64748b", fontSize:12, fontWeight:700, cursor:"pointer",
              }}>キャンセル</button>

              {isEdit && !confirmDel && (
                <button onClick={() => setConfirmDel(true)} style={{
                  padding:"12px 0", borderRadius:12, border:"1.5px solid #fecaca",
                  background:"#fff", color:"#ef4444", fontSize:12, fontWeight:700, cursor:"pointer",
                }}>削除</button>
              )}
              {isEdit && confirmDel && (
                <button onClick={() => onDelete(editItem!.id)} style={{
                  padding:"12px 0", borderRadius:12, border:"none",
                  background:"#ef4444", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                }}>本当に削除</button>
              )}

              <button onClick={handleSave} disabled={!canSave} style={{
                padding:"12px 0", borderRadius:12, border:"none",
                background: canSave ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "#e2e8f0",
                color: canSave ? "#fff" : "#94a3b8",
                fontSize:13, fontWeight:800, cursor: canSave ? "pointer" : "default",
                boxShadow: canSave ? "0 4px 12px rgba(59,130,246,.3)" : "none",
              }}>
                {isEdit ? "設定を保存" : "追加する"}
              </button>
            </div>
          </div>
        )}
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
