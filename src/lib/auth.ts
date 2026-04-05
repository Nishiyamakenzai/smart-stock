import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const ISSUER = "mq-dashboard";
const AUDIENCE = "mq-dashboard";

export const COOKIE_NAME = "mq-token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30日

/** JWTを発行する */
export async function signToken(payload: { id: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("30d")
    .sign(SECRET);
}

/** JWTを検証する（無効な場合はnullを返す） */
export async function verifyToken(token: string): Promise<{ id: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return { id: payload.id as string };
  } catch {
    return null;
  }
}

/** ログイン用Cookieヘッダー文字列を生成 */
export function buildCookieHeader(token: string): string {
  return [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** ログアウト用Cookie削除ヘッダー文字列を生成 */
export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}
