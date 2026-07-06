import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { dbGet, dbSet } from "@/lib/supabase";
import { signToken, buildCookieHeader, EVAL_COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/evaluation-auth/setup
 * Body: { id: string, pw: string }
 * 評価制度専用アカウントの初回セットアップ（COATEXの共有パスワードとは別管理）
 */
export async function POST(req: NextRequest) {
  const { id, pw } = await req.json();

  if (!id || id.length < 3) {
    return NextResponse.json({ error: "IDは3文字以上で入力してください" }, { status: 400 });
  }
  if (!pw || pw.length < 4) {
    return NextResponse.json({ error: "パスワードは4文字以上で入力してください" }, { status: 400 });
  }

  const existing = await dbGet("evaluation_auth");
  if (existing) {
    return NextResponse.json({ error: "アカウントは既に設定済みです" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(pw, 10);
  await dbSet("evaluation_auth", { id, passwordHash });

  const token = await signToken({ id });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildCookieHeader(token, EVAL_COOKIE_NAME));
  return res;
}
