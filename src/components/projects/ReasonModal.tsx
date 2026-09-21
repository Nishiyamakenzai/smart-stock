"use client";
import { useState } from "react";

interface Props {
  title: string;
  placeholder?: string;
  required?: boolean;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** 不要・保留・問題ありを押したときの理由入力シート */
export default function ReasonModal({ title, placeholder = "理由・補足（任意）", required, confirmLabel = "確定", confirmColor = "#3b82f6", onConfirm, onClose }: Props) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const handleConfirm = () => {
    if (required && !text.trim()) { setErr("理由を入力してください"); return; }
    onConfirm(text.trim());
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 18px calc(20px + env(safe-area-inset-bottom))", animation: "slideUp .25s ease" }}>
        <div style={{ width: 36, height: 4, background: "#e2e8f0", borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>{title}</div>
        <textarea
          className="input-base"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ resize: "none", marginBottom: 8 }}
          autoFocus
        />
        {err && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>⚠ {err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>キャンセル</button>
          <button
            onClick={handleConfirm}
            style={{ flex: 2, padding: "10px 16px", background: confirmColor, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
