"use client";
import { useState } from "react";

interface Props {
  mode: "login" | "setup";
  onLogin: () => void;
  basePath?: string;
  icon?: string;
  brandTitle?: string;
  brandTagline?: string;
  brandSub?: string;
  companyLine?: string;
  setupFooterText?: string;
  loginFooterText?: string;
}

type ResetStep = "email" | "code";

export default function LoginScreen({
  mode, onLogin,
  basePath = "/api/auth",
  icon = "🎨",
  brandTitle = "COATEX",
  brandTagline = "経営を、塗り替えろ。",
  brandSub = "SMART COATING & BUSINESS SOLUTIONS",
  companyLine = "西山建材工業",
  setupFooterText = "設定したID・パスワードを社員全員で共有してください",
  loginFooterText = "会社共有アカウントでログインしてください",
}: Props) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // リセット状態
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newId, setNewId] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [resetDone, setResetDone] = useState(false);

  /* ── ログイン / セットアップ ── */
  const handleSetup = async () => {
    if (id.length < 3) { setErr("IDは3文字以上で入力してください"); return; }
    if (pw.length < 4) { setErr("パスワードは4文字以上で入力してください"); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch(`${basePath}/setup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "エラーが発生しました"); return; }
      onLogin();
    } catch { setErr("通信エラーが発生しました"); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!id || !pw) { setErr("ID・パスワードを入力してください"); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch(`${basePath}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "IDまたはパスワードが違います"); return; }
      onLogin();
    } catch { setErr("通信エラーが発生しました"); }
    finally { setLoading(false); }
  };

  /* ── リセット Step1: メール送信 ── */
  const handleSendCode = async () => {
    if (!resetEmail) { setErr("メールアドレスを入力してください"); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch(`${basePath}/reset-request`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "エラーが発生しました"); return; }
      setResetStep("code");
    } catch { setErr("通信エラーが発生しました"); }
    finally { setLoading(false); }
  };

  /* ── リセット Step2: コード確認 ── */
  const handleConfirmReset = async () => {
    if (!otp) { setErr("認証コードを入力してください"); return; }
    if (newId.length < 3) { setErr("新しいIDは3文字以上で入力してください"); return; }
    if (newPw.length < 4) { setErr("新しいパスワードは4文字以上で入力してください"); return; }
    if (newPw !== newPw2) { setErr("パスワードが一致しません"); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch(`${basePath}/reset-confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, newId, newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "リセットに失敗しました"); return; }
      setResetDone(true);
    } catch { setErr("通信エラーが発生しました"); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (!showReset) { mode === "setup" ? handleSetup() : handleLogin(); return; }
    if (resetStep === "email") handleSendCode();
    else handleConfirmReset();
  };

  const inputStyle: React.CSSProperties = { fontSize: 14, padding: "12px 14px" };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg, #f0f4f8 0%, #e8f0fe 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20,
    }}>
      <div style={{ position:"fixed", top:"-20%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f620,#1d4ed810)", pointerEvents:"none" }}/>
      <div style={{ position:"fixed", bottom:"-20%", left:"-10%", width:400, height:400, borderRadius:"50%", background:"linear-gradient(135deg,#8b5cf620,#6d28d910)", pointerEvents:"none" }}/>

      <div style={{
        width:"100%", maxWidth:400,
        background:"#ffffff",
        borderRadius:24,
        padding:"40px 36px",
        border:"1px solid #e2e8f0",
        boxShadow:"0 20px 60px rgba(15,23,42,.12), 0 4px 16px rgba(15,23,42,.06)",
        animation:"scaleIn .4s cubic-bezier(.16,1,.3,1)",
        position:"relative", zIndex:1,
      }}>

        {/* ヘッダー */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:64, height:64,
            background:"linear-gradient(135deg, #1e3a8a, #1d4ed8)",
            borderRadius:18, marginBottom:16,
            boxShadow:"0 6px 20px rgba(29,78,216,.45)",
            fontSize:13, fontWeight:900, color:"#fff", letterSpacing:0.5,
            border:"2px solid rgba(255,255,255,.15)",
          }}>{icon}</div>
          <div style={{ fontSize:26, fontWeight:900, color:"#0f172a", letterSpacing:"-0.5px", lineHeight:1 }}>{brandTitle}</div>
          <div style={{ fontSize:11, fontWeight:700, color:"#f97316", marginTop:5, letterSpacing:0.5 }}>{brandTagline}</div>
          <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, marginTop:3, letterSpacing:1 }}>{brandSub}</div>
          <div style={{ fontSize:10, color:"#94a3b8", marginTop:6 }}>{companyLine}</div>
          <div style={{
            display:"inline-block", marginTop:10, padding:"4px 14px",
            background: showReset ? "#fff7ed" : "#eff6ff",
            borderRadius:99, fontSize:11,
            color: showReset ? "#f97316" : "#3b82f6",
            fontWeight:600,
          }}>
            {showReset
              ? resetStep === "email" ? "パスワードをリセット" : "認証コードを入力"
              : mode === "setup" ? "初回アカウント設定" : "ダッシュボードにログイン"
            }
          </div>
        </div>

        {/* ── リセット完了 ── */}
        {showReset && resetDone ? (
          <div style={{ display:"flex", flexDirection:"column", gap:14, textAlign:"center" }}>
            <div style={{ fontSize:48, lineHeight:1 }}>✅</div>
            <div style={{ fontSize:16, fontWeight:800, color:"#059669" }}>リセット完了！</div>
            <div style={{ fontSize:13, color:"#475569", lineHeight:1.8 }}>
              新しいID: <strong>{newId}</strong><br/>で再ログインできます
            </div>
            <button
              onClick={() => { setShowReset(false); setResetDone(false); setOtp(""); setId(newId); setPw(""); setErr(""); }}
              className="btn-primary"
              style={{ width:"100%", padding:"13px", fontSize:14, borderRadius:12 }}
            >
              ログイン画面へ →
            </button>
          </div>

        /* ── リセット Step1: メアド入力 ── */
        ) : showReset && resetStep === "email" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ padding:"12px 14px", background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:10, fontSize:12, color:"#0369a1", lineHeight:1.7 }}>
              📧 登録済みのメールアドレスに<br/>
              <strong>6桁の認証コード</strong>を送ります
            </div>
            <div>
              <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>メールアドレス</label>
              <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="登録済みのメールアドレス"
                className="input-base" style={inputStyle} autoComplete="email"
              />
            </div>

            {err && (
              <div style={{ padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#dc2626" }}>
                ⚠ {err}
              </div>
            )}

            <button onClick={handleSendCode} disabled={loading} className="btn-primary"
              style={{ width:"100%", padding:"13px", fontSize:14, borderRadius:12, opacity:loading?0.7:1, cursor:loading?"not-allowed":"pointer" }}>
              {loading ? "送信中..." : "認証コードを送信 →"}
            </button>
            <button onClick={() => { setShowReset(false); setErr(""); }}
              style={{ background:"none", border:"none", color:"#94a3b8", fontSize:12, cursor:"pointer", padding:4 }}>
              ← ログイン画面に戻る
            </button>
          </div>

        /* ── リセット Step2: コード + 新ID・PW ── */
        ) : showReset && resetStep === "code" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ padding:"10px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, fontSize:12, color:"#166534", lineHeight:1.7 }}>
              ✉ <strong>{resetEmail}</strong> に<br/>認証コードを送りました（15分有効）
            </div>
            <div>
              <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>認証コード（6桁）</label>
              <input type="text" inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} onKeyDown={handleKeyDown}
                placeholder="123456"
                className="input-base"
                style={{ ...inputStyle, textAlign:"center", letterSpacing:8, fontSize:22, fontWeight:800 }}
              />
            </div>
            <div>
              <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>新しいログインID</label>
              <input type="text" value={newId} onChange={e => setNewId(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="3文字以上"
                className="input-base" style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>新しいパスワード</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="4文字以上"
                className="input-base" style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>パスワード（確認）</label>
              <input type="password" value={newPw2} onChange={e => setNewPw2(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="もう一度入力"
                className="input-base" style={inputStyle}
              />
            </div>

            {err && (
              <div style={{ padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#dc2626" }}>
                ⚠ {err}
              </div>
            )}

            <button onClick={handleConfirmReset} disabled={loading} className="btn-primary"
              style={{ width:"100%", padding:"13px", fontSize:14, borderRadius:12, opacity:loading?0.7:1, cursor:loading?"not-allowed":"pointer" }}>
              {loading ? "処理中..." : "IDとパスワードをリセット"}
            </button>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setResetStep("email"); setOtp(""); setErr(""); }}
                style={{ flex:1, background:"none", border:"none", color:"#94a3b8", fontSize:12, cursor:"pointer", padding:4 }}>
                ← コードを再送信
              </button>
              <button onClick={() => { setShowReset(false); setResetStep("email"); setErr(""); }}
                style={{ flex:1, background:"none", border:"none", color:"#94a3b8", fontSize:12, cursor:"pointer", padding:4 }}>
                ログイン画面へ
              </button>
            </div>
          </div>

        /* ── 通常ログイン / 初回セットアップ ── */
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>ログインID</label>
              <input type="text" value={id} onChange={e => setId(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="例: nishiyama"
                className="input-base" style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize:12, color:"#475569", fontWeight:600, display:"block", marginBottom:6 }}>パスワード</label>
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="4文字以上"
                className="input-base" style={inputStyle}
              />
            </div>

            {err && (
              <div style={{ padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#dc2626", fontWeight:500 }}>
                ⚠ {err}
              </div>
            )}

            <button onClick={mode === "setup" ? handleSetup : handleLogin} disabled={loading} className="btn-primary"
              style={{ width:"100%", padding:"13px", fontSize:14, marginTop:4, borderRadius:12, opacity:loading?0.7:1, cursor:loading?"not-allowed":"pointer" }}>
              {loading ? "処理中..." : mode === "setup" ? "アカウントを作成" : "ログイン →"}
            </button>

            {mode === "login" && (
              <button onClick={() => { setShowReset(true); setResetStep("email"); setErr(""); }}
                style={{ background:"none", border:"none", color:"#94a3b8", fontSize:12, cursor:"pointer", padding:4, textDecoration:"underline" }}>
                IDまたはパスワードを忘れた方
              </button>
            )}
          </div>
        )}

        {!showReset && (
          <div style={{ marginTop:20, textAlign:"center" }}>
            {mode === "setup"
              ? <p style={{ fontSize:11, color:"#94a3b8" }}>{setupFooterText}</p>
              : <p style={{ fontSize:11, color:"#94a3b8" }}>{loginFooterText}</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}
