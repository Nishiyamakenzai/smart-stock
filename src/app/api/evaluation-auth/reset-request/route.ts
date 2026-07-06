import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { dbSet } from "@/lib/supabase";
import { Resend } from "resend";

/**
 * POST /api/evaluation-auth/reset-request
 * Body: { email: string }
 * 登録メールアドレス（ADMIN_EMAIL）と一致したら6桁OTPをメール送信
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;

    if (!adminEmail || !resendKey) {
      return NextResponse.json(
        { error: "メール設定が未完了です。Vercelに ADMIN_EMAIL と RESEND_API_KEY を設定してください" },
        { status: 500 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "正しいメールアドレスを入力してください" }, { status: 400 });
    }

    if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
      return NextResponse.json({ ok: true });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await dbSet("evaluation_auth_reset_otp", { otp, expiresAt });

    const resend = new Resend(resendKey);
    const { error: sendError } = await resend.emails.send({
      from: "職人評価制度 <onboarding@resend.dev>",
      to: adminEmail,
      subject: "【職人評価制度】パスワードリセット認証コード",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f0f4f8;border-radius:16px;">
          <div style="background:#fff;border-radius:12px;padding:28px 24px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:32px;">⛩️</div>
              <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:8px;">職人評価制度</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">パスワードリセット</div>
            </div>
            <p style="color:#475569;font-size:14px;margin-bottom:20px;">以下の認証コードを入力してください。</p>
            <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
              <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#1d4ed8;">${otp}</div>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;">このコードは15分間有効です。<br>心当たりがない場合は無視してください。</p>
          </div>
        </div>
      `,
    });

    if (sendError) {
      console.error("[evaluation-auth reset-request] Resend error:", sendError);
      return NextResponse.json(
        { error: "メール送信に失敗しました。RESEND_API_KEY を確認してください" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[evaluation-auth reset-request] error:", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。もう一度お試しください" },
      { status: 500 }
    );
  }
}
