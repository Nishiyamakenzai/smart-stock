"use client";
import type { Member } from "@/lib/project-types";

interface Props {
  members: Member[];
  title?: string;
  onSelect: (memberId: string) => void;
  onClose: () => void;
}

/** 「あなたは誰ですか？」選択モーダル。完了・不要などの操作をする直前に、未選択なら表示する。 */
export default function MemberPickerModal({ members, title = "あなたは誰ですか？", onSelect, onClose }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0",
          padding: "20px 18px calc(20px + env(safe-area-inset-bottom))", animation: "slideUp .25s ease",
          maxHeight: "80vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: "#e2e8f0", borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14, textAlign: "center" }}>{title}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "14px 6px", borderRadius: 14, border: `1.5px solid ${m.color}44`,
                background: `${m.color}12`, cursor: "pointer",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: m.color,
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 800,
              }}>{m.name.slice(0, 1)}</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{m.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ width: "100%", marginTop: 16, padding: 12, background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
