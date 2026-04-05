import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { dbGet, dbSet } from "@/lib/supabase";
import { signToken, buildCookieHeader } from "@/lib/auth";

/**
 * POST /api/auth/setup
 * Body: { id: string, pw: string }
 * 初回のみ実行可能（DBにauthキーが存在しない場合のみ）
 */
export async function POST(req: NextRequest) {
  const { id, pw } = await req.json();

  if (!id || id.length < 3) {
    return NextResponse.json({ error: "IDは3文字以上で入力してください" }, { status: 400 });
  }
  if (!pw || pw.length < 4) {
    return NextResponse.json({ error: "パスワードは4文字以上で入力してください" }, { status: 400 });
  }

  // 既にアカウントが存在する場合は拒否
  const existing = await dbGet("auth");
  if (existing) {
    return NextResponse.json({ error: "アカウントは既に設定済みです" }, { status: 409 });
  }

  // パスワードをハッシュ化して保存
  const passwordHash = await bcrypt.hash(pw, 10);
  await dbSet("auth", { id, passwordHash });

  const token = await signToken({ id });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildCookieHeader(token));
  return res;
}
