"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { StockItem, StockTransaction, InventoryData } from "@/lib/inventory-types";
import StockTab from "./StockTab";
import HistoryTab from "./HistoryTab";
import ChartTab from "./ChartTab";
import AdjustModal from "./AdjustModal";
import ColorModal from "./ColorModal";

type Tab = "stock" | "history" | "chart";
const TABS: [Tab, string][] = [["stock","在庫"], ["history","履歴"], ["chart","グラフ"]];

export default function InventoryDashboard() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("stock");
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustInitType, setAdjustInitType] = useState<"in" | "out">("in");
  const [showColorModal, setShowColorModal] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);

  // ── データ読み込み ───────────────────────────────────────
  useEffect(() => {
    fetch("/api/inventory")
      .then(r => r.json())
      .then((d: InventoryData) => {
        setItems(d.items ?? []);
        setTransactions(d.transactions ?? []);
      })
      .catch(console.error)
      .finally(() => setDataLoaded(true));
  }, []);

  // ── デバウンス自動保存 ──────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const save = useCallback((its: StockItem[], txns: StockTransaction[]) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: its, transactions: txns }),
      }).catch(console.error);
    }, 1200);
  }, []);

  useEffect(() => {
    if (dataLoaded) save(items, transactions);
  }, [items, transactions, dataLoaded, save]);

  // ── 集計値 ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const lowStock = items.filter(i => i.minStock > 0 && i.stock <= i.minStock).length;
    const today = new Date().toISOString().substring(0, 7);
    const monthTxns = transactions.filter(t => t.date.startsWith(today));
    const monthIn  = monthTxns.filter(t => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const monthOut = monthTxns.filter(t => t.type === "out").reduce((s, t) => s + t.amount, 0);
    return { lowStock, monthIn, monthOut };
  }, [items, transactions]);

  // ── ハンドラー ───────────────────────────────────────────
  const handleAdjust = useCallback((
    item: StockItem, type: "in" | "out", amount: number, reason: string, date: string
  ) => {
    const txn: StockTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      itemId: item.id,
      colorCode: item.colorCode,
      colorName: item.colorName,
      type, amount,
      unit: item.unit,
      reason,
      date,
      createdAt: new Date().toISOString(),
    };
    const newStock = type === "in" ? item.stock + amount : Math.max(0, item.stock - amount);
    setItems(prev => prev.map(i => i.id === item.id
      ? { ...i, stock: newStock, updatedAt: new Date().toISOString() }
      : i
    ));
    setTransactions(prev => [txn, ...prev].slice(0, 500));
    setAdjustItem(null);
  }, []);

  const handleAddItem = useCallback((item: StockItem) => {
    setItems(prev => {
      if (prev.find(i => i.colorCode === item.colorCode)) return prev;
      return [...prev, item];
    });
    setShowColorModal(false);
  }, []);

  const handleEditItem = useCallback((item: StockItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    setEditItem(null);
    setShowColorModal(false);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    setTransactions(prev => prev.filter(t => t.itemId !== itemId));
    setEditItem(null);
    setShowColorModal(false);
  }, []);

  const openAdjust = useCallback((item: StockItem, type: "in" | "out") => {
    setAdjustInitType(type);
    setAdjustItem(item);
  }, []);

  const openEdit = useCallback((item: StockItem) => {
    setEditItem(item);
    setShowColorModal(true);
  }, []);

  // ── ローディング ─────────────────────────────────────────
  if (!dataLoaded) {
    return (
      <div style={{ minHeight:"100vh", background:"#f0f4f8", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #e2e8f0", borderTopColor:"#3b82f6", animation:"spin 0.8s linear infinite" }} />
        <p style={{ color:"#94a3b8", fontSize:13, fontWeight:500 }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4f8" }}>

      {/* ── ヘッダー ───────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#3b82f6 100%)", color:"#fff", paddingBottom:0 }}>
        {/* Top bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"16px 20px 12px" }}>
          <div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.5)", fontWeight:700, letterSpacing:3, marginBottom:4 }}>
              PAINT INVENTORY SYSTEM
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:"#fff", lineHeight:1 }}>塗料在庫管理</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", marginTop:3 }}>アステックペイント対応</div>
          </div>
          <a href="/" style={{ padding:"6px 12px", background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.25)", borderRadius:8, fontSize:11, fontWeight:600, color:"rgba(255,255,255,.85)", textDecoration:"none", whiteSpace:"nowrap" }}>
            ← MQ戻る
          </a>
        </div>

        {/* KPI Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, padding:"0 20px 16px" }} className="kpi-grid">
          {[
            { label:"管理色数",       value:items.length,       unit:"色",  grad:"linear-gradient(135deg,#3b82f6,#1d4ed8)", shadow:"rgba(59,130,246,.35)" },
            { label:"低在庫アラート", value:stats.lowStock,     unit:"色",  grad:stats.lowStock > 0 ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "linear-gradient(135deg,#10b981,#059669)", shadow:stats.lowStock > 0 ? "rgba(239,68,68,.35)" : "rgba(16,185,129,.35)" },
            { label:"今月入庫",       value:stats.monthIn,      unit:"",    grad:"linear-gradient(135deg,#10b981,#059669)", shadow:"rgba(16,185,129,.35)" },
            { label:"今月出庫",       value:stats.monthOut,     unit:"",    grad:"linear-gradient(135deg,#f59e0b,#d97706)", shadow:"rgba(245,158,11,.35)" },
          ].map(k => (
            <div key={k.label} className="kpi-card" style={{ background:k.grad, boxShadow:`0 4px 14px ${k.shadow}` }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.7)", fontWeight:700, marginBottom:4, lineHeight:1.3 }}>{k.label}</div>
              <div style={{ fontSize:24, fontWeight:900, lineHeight:1, letterSpacing:"-0.5px" }}>
                {k.value}
                {k.unit && <span style={{ fontSize:10, fontWeight:600, opacity:.7, marginLeft:2 }}>{k.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── タブバー ───────────────────────────────────────── */}
      <div style={{ position:"sticky", top:0, zIndex:100, background:"#fff", borderBottom:"1px solid #e2e8f0", boxShadow:"0 1px 4px rgba(15,23,42,.06)" }}>
        <div style={{ display:"flex", padding:"0 16px", overflowX:"auto" }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`tab-btn${tab===id?" active":""}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── コンテンツ ─────────────────────────────────────── */}
      <div style={{ padding:"14px 16px", maxWidth:800, margin:"0 auto" }}>
        {tab === "stock" && (
          <StockTab
            items={items}
            onAdjust={openAdjust}
            onEdit={openEdit}
            onAddColor={() => { setEditItem(null); setShowColorModal(true); }}
          />
        )}
        {tab === "history" && (
          <HistoryTab transactions={transactions} items={items} />
        )}
        {tab === "chart" && (
          <ChartTab items={items} transactions={transactions} />
        )}
      </div>

      {/* ── モーダル ───────────────────────────────────────── */}
      {adjustItem && (
        <AdjustModal
          item={adjustItem}
          initType={adjustInitType}
          onSave={handleAdjust}
          onClose={() => setAdjustItem(null)}
        />
      )}
      {showColorModal && (
        <ColorModal
          editItem={editItem}
          existingCodes={items.map(i => i.colorCode)}
          onAdd={handleAddItem}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onClose={() => { setShowColorModal(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}
