import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { dbSet } from "@/lib/supabase";
import { signToken, buildCookieHeader } from "@/lib/auth";

/**
 * POST /api/auth/reset
 * Body: { resetKey: string, newId: string, newPw: string }
 * RESET_SECRET 環境変数と一致した場合のみID・パスワードを上書きする
 */
export async function POST(req: NextRequest) {
  const { resetKey, newId, newPw } = await req.json();

  const secret = process.env.RESET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "リセット機能が設定されていません（RESET_SECRET未設定）" }, { status: 500 });
  }

  if (!resetKey || resetKey !== secret) {
    return NextResponse.json({ error: "リセットキーが正しくありません" }, { status: 401 });
  }

  if (!newId || newId.length < 3) {
    return NextResponse.json({ error: "IDは3文字以上で入力してください" }, { status: 400 });
  }
  if (!newPw || newPw.length < 4) {
    return NextResponse.json({ error: "パスワードは4文字以上で入力してください" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPw, 10);
  await dbSet("auth", { id: newId, passwordHash });

  const token = await signToken({ id: newId });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildCookieHeader(token));
  return res;
}
