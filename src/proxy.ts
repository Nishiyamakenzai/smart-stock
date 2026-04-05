import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/**
 * Proxy (Edge): /api/data/* へのリクエストを保護
 * 有効なJWTクッキーがない場合は401を返す
 * /api/auth/* は認証不要（ログイン・セットアップ用）
 */
export const config = {
  matcher: ["/api/data/:path*"],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}
