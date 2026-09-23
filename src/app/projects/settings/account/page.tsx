"use client";
import { useState } from "react";
import Link from "next/link";

export default function AccountSettingsPage() {
  const [newId, setNewId] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (newId.length < 3) { setErr("IDは3文字以上で入力してください"); return; }
    if (newPw.length < 4) { setErr("パスワードは4文字以上で入力してください"); return; }
    if (newPw !== newPw2) { setErr("パスワードが一致しません"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/project-auth/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newId, newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "変更に失敗しました"); return; }
      setDone(true);
    } catch {
      setErr("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 14px 40px" }}>
      <Link href="/projects/settings" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← 設定</Link>
      <div className="section-title" style={{ marginTop: 12 }}>ログインID・パスワードの変更</div>
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
        ANDON（案件進捗管理システム）専用のログイン情報を、好きなID・パスワードに変更できます（COATEX・TASUKI・評価制度には影響しません）。
      </p>

      {done ? (
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 8 }}>変更しました</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
            新しいID：<strong>{newId}</strong><br />
            次回からはこちらでログインしてください。
          </div>
        </div>
      ) : (
        <div className="card">
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>新しいログインID</label>
          <input className="input-base" value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="3文字以上" style={{ marginBottom: 14 }} />

          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>新しいパスワード</label>
          <input type="password" className="input-base" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="4文字以上" style={{ marginBottom: 14 }} autoComplete="new-password" />

          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>新しいパスワード（確認）</label>
          <input type="password" className="input-base" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} placeholder="もう一度入力" style={{ marginBottom: 14 }} autoComplete="new-password" />

          {err && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>
              ⚠ {err}
            </div>
          )}

          <button className="btn-primary" onClick={submit} disabled={saving} style={{ width: "100%" }}>
            {saving ? "変更中..." : "この内容に変更する"}
          </button>
        </div>
      )}
    </div>
  );
}
