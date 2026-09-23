"use client";
import { useState } from "react";

interface Props {
  onConfirm: (payload: { periodStart: string; periodEnd: string; contractAmount: number; note: string }) => void;
  onClose: () => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 };

/** 「契約」を完了にするときに、工期（開始日〜終了日）と契約金額をまとめて入力するシート */
export default function ContractCompleteModal({ onConfirm, onClose }: Props) {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const confirm = () => {
    if (!periodStart || !periodEnd) { setErr("工期の開始日と終了日を選択してください"); return; }
    if (periodEnd < periodStart) { setErr("終了日は開始日より後にしてください"); return; }
    if (!contractAmount) { setErr("契約金額を入力してください"); return; }
    onConfirm({ periodStart, periodEnd, contractAmount: Number(contractAmount), note: note.trim() });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 18px calc(20px + env(safe-area-inset-bottom))", maxHeight: "85vh", overflowY: "auto", animation: "slideUp .25s ease" }}>
        <div style={{ width: 36, height: 4, background: "#e2e8f0", borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>契約を完了する</div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>成約と同時に、工期・契約金額を記録します。</p>

        <label style={labelStyle}>工期・開始日 *</label>
        <input type="date" className="input-base" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={{ marginBottom: 12 }} />

        <label style={labelStyle}>工期・終了日 *</label>
        <input type="date" className="input-base" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ marginBottom: 12 }} />

        <label style={labelStyle}>契約金額（円・税込） *</label>
        <input type="number" inputMode="numeric" className="input-base" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} placeholder="例：1500000" style={{ marginBottom: 12 }} />

        <label style={labelStyle}>コメント（任意）</label>
        <textarea className="input-base" value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ resize: "none", marginBottom: 8 }} />

        {err && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>⚠ {err}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>キャンセル</button>
          <button onClick={confirm} style={{ flex: 2, padding: "10px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            完了する
          </button>
        </div>
      </div>
    </div>
  );
}
