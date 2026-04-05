"use client";
import { useState } from "react";

interface Props {
  mode: "login" | "setup";
  onLogin: () => void;
}

/**
 * ログイン画面
 * - mode="setup": 初回アカウント作成（/api/auth/setup を呼ぶ）
 * - mode="login": 以降のログイン（/api/auth/login を呼ぶ）
 * localStorage は一切使用しない（サーバー側で管理）
 */
export default function LoginScreen({ mode, onLogin }: Props) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    if (id.length < 3) { setErr("IDは3文字以上で入力してください"); return; }
    if (pw.length < 4) { setErr("パスワードは4文字以上で入力してください"); return; }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "エラーが発生しました"); return; }
      onLogin();
    } catch {
      setErr("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!id || !pw) { setErr("ID・パスワードを入力してください"); return; }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "IDまたはパスワードが違います"); return; }
      onLogin();
    } catch {
      setErr("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") mode === "setup" ? handleSetup() : handleLogin();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f4f8 0%, #e8f0fe 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      {/* 装飾バブル */}
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f620,#1d4ed810)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-20%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf620,#6d28d910)", pointerEvents: "none" }} />

      <div style={{
        width: "100%", maxWidth: 400,
        background: "#ffffff",
        borderRadius: 24,
        padding: "40px 36px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 20px 60px rgba(15,23,42,.12), 0 4px 16px rgba(15,23,42,.06)",
        animation: "scaleIn .4s cubic-bezier(.16,1,.3,1)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 60, height: 60,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            borderRadius: 18, marginBottom: 16,
            boxShadow: "0 6px 20px rgba(59,130,246,.4)",
            fontSize: 28,
          }}>📊</div>
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 3 }}>MQ ACCOUNTING</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 6 }}>西山建材工業</div>
          <div style={{
            display: "inline-block", marginTop: 10, padding: "4px 14px",
            background: "#eff6ff", borderRadius: 99,
            fontSize: 11, color: "#3b82f6", fontWeight: 600,
          }}>
            {mode === "setup" ? "初回アカウント設定" : "ダッシュボードにログイン"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6 }}>ログインID</label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例: nishiyama"
              className="input-base"
              style={{ fontSize: 14, padding: "12px 14px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6 }}>パスワード</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="4文字以上"
              className="input-base"
              style={{ fontSize: 14, padding: "12px 14px" }}
            />
          </div>

          {err && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
              ⚠ {err}
            </div>
          )}

          <button
            onClick={mode === "setup" ? handleSetup : handleLogin}
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "13px", fontSize: 14, marginTop: 4, borderRadius: 12, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "処理中..." : mode === "setup" ? "アカウントを作成" : "ログイン →"}
          </button>
        </div>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          {mode === "setup"
            ? <p style={{ fontSize: 11, color: "#94a3b8" }}>設定したID・パスワードを社員全員で共有してください</p>
            : <p style={{ fontSize: 11, color: "#94a3b8" }}>会社共有アカウントでログインしてください</p>
          }
        </div>
      </div>
    </div>
  );
}
