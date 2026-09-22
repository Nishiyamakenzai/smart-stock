import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { dbGet, dbSet } from "@/lib/supabase";
import { signToken, verifyToken, buildCookieHeader, PROJECT_COOKIE_NAME } from "@/lib/auth";

/**
 * PATCH /api/project-auth/credentials
 * Body: { newId: string, newPw: string }
 * ログイン中の本人だけが、ID・パスワードを自分の好きなものに変更できる。
 */
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PROJECT_COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "ログインしてから変更してください" }, { status: 401 });
  }

  const { newId, newPw } = await req.json();
  if (!newId || newId.length < 3) {
    return NextResponse.json({ error: "IDは3文字以上で入力してください" }, { status: 400 });
  }
  if (!newPw || newPw.length < 4) {
    return NextResponse.json({ error: "パスワードは4文字以上で入力してください" }, { status: 400 });
  }

  const existing = await dbGet<{ id: string; passwordHash: string }>("project_auth");
  if (!existing) {
    return NextResponse.json({ error: "アカウントが見つかりません" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPw, 10);
  await dbSet("project_auth", { id: newId, passwordHash });

  const newToken = await signToken({ id: newId });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildCookieHeader(newToken, PROJECT_COOKIE_NAME));
  return res;
}
