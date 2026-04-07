import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { dbGet, dbSet } from "@/lib/supabase";
import { signToken, buildCookieHeader } from "@/lib/auth";

/**
 * POST /api/auth/reset-confirm
 * Body: { otp: string, newId: string, newPw: string }
 * OTPが正しければID・パスワードを上書き
 */
export async function POST(req: NextRequest) {
  const { otp, newId, newPw } = await req.json();

  if (!otp || !newId || !newPw) {
    return NextResponse.json({ error: "すべての項目を入力してください" }, { status: 400 });
  }
  if (newId.length < 3) {
    return NextResponse.json({ error: "IDは3文字以上で入力してください" }, { status: 400 });
  }
  if (newPw.length < 4) {
    return NextResponse.json({ error: "パスワードは4文字以上で入力してください" }, { status: 400 });
  }

  const stored = await dbGet<{ otp: string; expiresAt: number }>("auth-reset-otp");

  if (!stored) {
    return NextResponse.json({ error: "認証コードが見つかりません。再度コードを送信してください" }, { status: 400 });
  }
  if (Date.now() > stored.expiresAt) {
    return NextResponse.json({ error: "認証コードの有効期限が切れています。再度送信してください" }, { status: 400 });
  }
  if (otp.trim() !== stored.otp) {
    return NextResponse.json({ error: "認証コードが正しくありません" }, { status: 401 });
  }

  // OTPを削除（使い捨て）
  await dbSet("auth-reset-otp", null);

  // 新しいID・パスワードを保存
  const passwordHash = await bcrypt.hash(newPw, 10);
  await dbSet("auth", { id: newId, passwordHash });

  // ログイン状態にする
  const token = await signToken({ id: newId });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildCookieHeader(token));
  return res;
}
