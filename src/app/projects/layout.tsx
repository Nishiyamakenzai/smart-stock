"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import LoginScreen from "@/components/LoginScreen";
import BottomNav from "@/components/projects/BottomNav";
import { useCurrentMember } from "@/lib/useCurrentMember";

function TopBar({ onLogout }: { onLogout: () => void }) {
  const { currentMember, setCurrentId } = useCurrentMember();
  return (
    <div
      className="no-print"
      style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px",
      }}
    >
      <Link href="/projects" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#1e293b" }}>🏮 ANDON</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {currentMember && (
          <button
            onClick={() => setCurrentId(null)}
            title="タップで使用者を切り替え"
            style={{
              display: "flex", alignItems: "center", gap: 6, background: currentMember.color + "18",
              border: `1.5px solid ${currentMember.color}44`, borderRadius: 99, padding: "5px 10px", cursor: "pointer",
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: currentMember.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: currentMember.color }}>{currentMember.name}</span>
          </button>
        )}
        <button onClick={onLogout} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>
          ログアウト
        </button>
        <Link href="/" style={{ fontSize: 11, color: "#64748b", textDecoration: "none" }}>← 一覧へ</Link>
      </div>
    </div>
  );
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/project-auth/status")
      .then((r) => r.json())
      .then((data) => {
        setLoggedIn(data.loggedIn === true);
        setMode(data.mode ?? "login");
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/project-auth/logout", { method: "POST" });
    setLoggedIn(false);
  };

  if (!hydrated) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <LoginScreen
        mode={mode}
        onLogin={() => setLoggedIn(true)}
        basePath="/api/project-auth"
        icon="🏮"
        brandTitle="ANDON"
        brandTagline="止まっている案件が、光る。"
        brandSub="案件進捗管理システム"
        companyLine="西山建材工業"
        setupFooterText="このID・パスワードは案件進捗を扱う担当者全員で共有してください"
        loginFooterText="COATEX・TASUKIとは別のID・パスワードです"
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 80 }}>
      <TopBar onLogout={handleLogout} />
      <div className="projects-content-wrap">{children}</div>
      <BottomNav />
    </div>
  );
}
