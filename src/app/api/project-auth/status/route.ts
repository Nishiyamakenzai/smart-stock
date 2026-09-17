import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { verifyToken, PROJECT_COOKIE_NAME } from "@/lib/auth";
import { dbGet } from "@/lib/supabase";

/**
 * GET /api/project-auth/status
 * 案件進捗管理システム専用ログイン状態と初回セットアップ状態を返す
 */
export async function GET() {
  const authRow = await dbGet<{ id: string; passwordHash: string }>("project_auth");
  const mode = authRow ? "login" : "setup";

  // アカウントが存在しない（=リセット済み）場合は、古いクッキーが残っていてもログイン扱いにしない
  if (mode === "setup") {
    return NextResponse.json({ loggedIn: false, mode });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(PROJECT_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ loggedIn: false, mode });
  }

  const payload = await verifyToken(token);
  return NextResponse.json({ loggedIn: !!payload, mode });
}
