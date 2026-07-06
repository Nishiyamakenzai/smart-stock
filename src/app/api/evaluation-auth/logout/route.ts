import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { clearCookieHeader, EVAL_COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/evaluation-auth/logout
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearCookieHeader(EVAL_COOKIE_NAME));
  return res;
}
