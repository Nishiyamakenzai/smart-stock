"use client";
import { useState, useEffect } from "react";
import LoginScreen from "@/components/LoginScreen";
import MQDashboard from "@/components/MQDashboard";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [hydrated, setHydrated] = useState(false);

  // サーバーのCookieとDBのauthキーを確認してセッション状態を復元
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        setLoggedIn(data.loggedIn === true);
        setMode(data.mode ?? "login");
      })
      .catch(() => {
        // ネットワークエラー時はログイン画面を表示
      })
      .finally(() => setHydrated(true));
  }, []);

  const handleLogin = () => setLoggedIn(true);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    // ログアウト後にモードを再確認
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setMode(d.mode ?? "login"))
      .catch(() => {});
  };

  // ハイドレーション前はスピナーを表示（ちらつき防止）
  if (!hydrated) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid #e2e8f0",
          borderTopColor: "#3b82f6",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  if (!loggedIn) return <LoginScreen mode={mode} onLogin={handleLogin} />;
  return <MQDashboard onLogout={handleLogout} />;
}
