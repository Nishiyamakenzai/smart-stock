"use client";
import Link from "next/link";

export default function ProjectSettingsPage() {
  const items = [
    { href: "/projects/settings/processes", icon: "🔧", label: "工程マスター", desc: "標準工程の追加・編集・並び替え・表示/非表示" },
    { href: "/projects/settings/masters", icon: "🗂️", label: "発生源・失注理由", desc: "選択肢の追加・編集" },
    { href: "/projects/settings/backups", icon: "💾", label: "データバックアップ", desc: "自動バックアップの確認・手動実行・ダウンロード" },
    { href: "/projects/settings/account", icon: "🔑", label: "ログインID・パスワード変更", desc: "このシステム専用のログイン情報を変更" },
  ];
  return (
    <div style={{ padding: "16px 14px" }}>
      <div className="section-title">設定</div>
      {items.map((it) => (
        <Link key={it.href} href={it.href} className="card" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
          <span style={{ fontSize: 26 }}>{it.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{it.label}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{it.desc}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
