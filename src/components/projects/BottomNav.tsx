"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { href: "/projects", icon: "📋", label: "案件一覧" },
    { href: "/projects/new", icon: "➕", label: "新規登録" },
    { href: "/projects/settings", icon: "⚙️", label: "設定" },
  ];

  return (
    <nav
      className="no-print"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
        background: "#fff", borderTop: "1px solid #E2E8F0", display: "flex", zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {items.map((item) => {
        const active = item.href === "/projects" ? pathname === "/projects" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 2, textDecoration: "none",
              color: active ? "#1e3a8a" : "#94A3B8", fontWeight: active ? 700 : 400, fontSize: 11,
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
