import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { clearCookieHeader } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * JWTクッキーを削除してログアウト
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearCookieHeader());
  return res;
}
