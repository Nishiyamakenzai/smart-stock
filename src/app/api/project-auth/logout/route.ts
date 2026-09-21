import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { clearCookieHeader, PROJECT_COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/project-auth/logout
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearCookieHeader(PROJECT_COOKIE_NAME));
  return res;
}
