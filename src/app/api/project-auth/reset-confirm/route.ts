import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { dbGet, dbSet, dbDelete } from "@/lib/supabase";
import { signToken, buildCookieHeader, PROJECT_COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/project-auth/reset-confirm
 * Body: { otp: string, newId: string, newPw: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { otp, newId, newPw } = body;

    if (!otp || !newId || !newPw) {
      return NextResponse.json({ error: "すべての項目を入力してください" }, { status: 400 });
    }
    if (newId.length < 3) {
      return NextResponse.json({ error: "IDは3文字以上で入力してください" }, { status: 400 });
    }
    if (newPw.length < 4) {
      return NextResponse.json({ error: "パスワードは4文字以上で入力してください" }, { status: 400 });
    }

    const stored = await dbGet<{ otp: string; expiresAt: number }>("project_auth_reset_otp");

    if (!stored) {
      return NextResponse.json({ error: "認証コードが見つかりません。再度コードを送信してください" }, { status: 400 });
    }
    if (Date.now() > stored.expiresAt) {
      return NextResponse.json({ error: "認証コードの有効期限が切れています。再度送信してください" }, { status: 400 });
    }
    if (String(otp).trim() !== String(stored.otp).trim()) {
      return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 401 });
    }

    try {
      await dbDelete("project_auth_reset_otp");
    } catch {
      // 削除失敗しても続行（期限切れで再利用不可）
    }

    const passwordHash = await bcrypt.hash(newPw, 10);
    await dbSet("project_auth", { id: newId, passwordHash });

    const token = await signToken({ id: newId });
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", buildCookieHeader(token, PROJECT_COOKIE_NAME));
    return res;
  } catch (err) {
    console.error("[project-auth reset-confirm] error:", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。もう一度お試しください" },
      { status: 500 }
    );
  }
}
