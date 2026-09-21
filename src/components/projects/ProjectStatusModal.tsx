"use client";
import { useState } from "react";
import type { ProjectStatus, LostReason } from "@/lib/project-types";
import { PROJECT_STATUS_LIST, PROJECT_STATUS_ICONS } from "@/lib/project-types";

interface Props {
  currentStatus: ProjectStatus;
  lostReasons: LostReason[];
  onConfirm: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function ProjectStatusModal({ currentStatus, lostReasons, onConfirm, onClose }: Props) {
  const [status, setStatus] = useState<ProjectStatus>(currentStatus);
  const [wonAt, setWonAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [contractAmount, setContractAmount] = useState("");
  const [lostAt, setLostAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [lostReasonId, setLostReasonId] = useState("");
  const [lostDetail, setLostDetail] = useState("");
  const [err, setErr] = useState("");

  const confirm = () => {
    if (status === "成約" && !contractAmount) { setErr("契約金額を入力してください"); return; }
    if (status === "失注" && !lostReasonId) { setErr("失注理由を選択してください"); return; }
    const payload: Record<string, unknown> = { status };
    if (status === "成約") { payload.won_at = wonAt; payload.contract_amount = Number(contractAmount); }
    if (status === "失注") { payload.lost_at = lostAt; payload.lost_reason_id = lostReasonId; payload.lost_reason_detail = lostDetail; }
    onConfirm(payload);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 18px calc(20px + env(safe-area-inset-bottom))", maxHeight: "85vh", overflowY: "auto", animation: "slideUp .25s ease" }}>
        <div style={{ width: 36, height: 4, background: "#e2e8f0", borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>案件状態を変更</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          {PROJECT_STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                padding: "10px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: status === s ? "1.5px solid #1e3a8a" : "1.5px solid #e2e8f0",
                background: status === s ? "#1e3a8a" : "#fff", color: status === s ? "#fff" : "#475569",
              }}
            >
              {PROJECT_STATUS_ICONS[s]} {s}
            </button>
          ))}
        </div>

        {status === "成約" && (
          <>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>成約日</label>
            <input type="date" className="input-base" value={wonAt} onChange={(e) => setWonAt(e.target.value)} style={{ marginBottom: 12 }} />
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>契約金額（円）*</label>
            <input type="number" className="input-base" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} placeholder="例：1500000" style={{ marginBottom: 12 }} />
          </>
        )}

        {status === "失注" && (
          <>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>失注日</label>
            <input type="date" className="input-base" value={lostAt} onChange={(e) => setLostAt(e.target.value)} style={{ marginBottom: 12 }} />
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>失注理由 *</label>
            <select className="input-base" value={lostReasonId} onChange={(e) => setLostReasonId(e.target.value)} style={{ marginBottom: 12 }}>
              <option value="">選択してください</option>
              {lostReasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>理由詳細（任意）</label>
            <textarea className="input-base" value={lostDetail} onChange={(e) => setLostDetail(e.target.value)} rows={2} style={{ resize: "none", marginBottom: 12 }} />
          </>
        )}

        {err && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 10 }}>⚠ {err}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>キャンセル</button>
          <button onClick={confirm} className="btn-primary" style={{ flex: 2 }}>この内容で確定</button>
        </div>
      </div>
    </div>
  );
}
