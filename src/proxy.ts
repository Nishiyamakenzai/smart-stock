import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME, EVAL_COOKIE_NAME } from "@/lib/auth";

/**
 * Proxy (Edge): /api/data/*, /api/evaluation/* へのリクエストを保護
 * 有効なJWTクッキーがない場合は401を返す
 * /api/auth/*, /api/evaluation-auth/* は認証不要（ログイン・セットアップ用）
 *
 * 評価制度（/api/evaluation/*）はCOATEXの共有パスワードとは別セッション（eval-token）で保護する
 */
export const config = {
  matcher: ["/api/data/:path*", "/api/evaluation/:path*"],
};

export async function proxy(req: NextRequest) {
  const isEval = req.nextUrl.pathname.startsWith("/api/evaluation/");
  const cookieName = isEval ? EVAL_COOKIE_NAME : COOKIE_NAME;
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}
