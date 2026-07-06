import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { dbGet } from "@/lib/supabase";
import { signToken, buildCookieHeader, EVAL_COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/evaluation-auth/login
 * Body: { id: string, pw: string }
 */
export async function POST(req: NextRequest) {
  const { id, pw } = await req.json();

  if (!id || !pw) {
    return NextResponse.json({ error: "ID・パスワードを入力してください" }, { status: 400 });
  }

  const authRow = await dbGet<{ id: string; passwordHash: string }>("evaluation_auth");
  if (!authRow) {
    return NextResponse.json({ error: "アカウントが見つかりません" }, { status: 404 });
  }

  const idMatch = authRow.id === id;
  const pwMatch = await bcrypt.compare(pw, authRow.passwordHash);

  if (!idMatch || !pwMatch) {
    return NextResponse.json({ error: "IDまたはパスワードが違います" }, { status: 401 });
  }

  const token = await signToken({ id });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildCookieHeader(token, EVAL_COOKIE_NAME));
  return res;
}
