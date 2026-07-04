"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LoginScreen from "@/components/LoginScreen";

function EvalNav() {
  const pathname = usePathname();
  const items = [
    { href: "/evaluation", label: "👥 一覧", exact: true },
    { href: "/evaluation/grades", label: "🏯 等級表", exact: false },
    { href: "/evaluation/settings", label: "⚙️ 判定基準", exact: false },
  ];
  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 60 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#1e293b" }}>⛩️ 職人評価制度</span>
        </div>
        <Link href="/" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← ダッシュボードへ</Link>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "0 12px 10px" }}>
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} style={{
              padding: "6px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              textDecoration: "none",
              color: active ? "#fff" : "#475569",
              background: active ? "#1e3a5f" : "#f1f5f9",
            }}>{it.label}</Link>
          );
        })}
      </div>
    </div>
  );
}

export default function EvaluationLayout({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        setLoggedIn(data.loggedIn === true);
        setMode(data.mode ?? "login");
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  if (!hydrated) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!loggedIn) return <LoginScreen mode={mode} onLogin={() => setLoggedIn(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <EvalNav />
      <div style={{ padding: "16px 16px 40px", maxWidth: 960, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
