import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { dbGet } from "@/lib/supabase";

/**
 * GET /api/auth/status
 * ログイン状態と初回セットアップ状態を返す
 * - loggedIn: 現在のCookieが有効かどうか
 * - mode: "setup"（未設定）or "login"（設定済み）
 */
export async function GET() {
  // DBにauthキーが存在するかで初回セットアップか判定
  const authRow = await dbGet<{ id: string; passwordHash: string }>("auth");
  const mode = authRow ? "login" : "setup";

  // Cookieの有効性チェック
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ loggedIn: false, mode });
  }

  const payload = await verifyToken(token);
  return NextResponse.json({ loggedIn: !!payload, mode });
}
