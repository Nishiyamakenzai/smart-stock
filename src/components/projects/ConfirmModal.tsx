"use client";

interface Props {
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** 削除など取り返しのつかない操作の前に一度確認する共通モーダル */
export default function ConfirmModal({ title, description, confirmLabel = "実行する", confirmColor = "#dc2626", onConfirm, onClose }: Props) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 210, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 18, padding: 22, animation: "scaleIn .2s ease" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{title}</div>
        {description && <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 18 }}>{description}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>キャンセル</button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: "10px 16px", background: confirmColor, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
