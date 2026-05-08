import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { dbSet, getSupabase } from "@/lib/supabase";
import { DEMO_PROJECTS, DEMO_MF, DEFAULT_AB, DEFAULT_TARGETS, DEFAULT_BS, DEFAULT_SHARE_RATE } from "@/lib/data";

// APIルートは常に動的レンダリング（ビルド時にSupabaseへ接続しない）
export const dynamic = "force-dynamic";

const DATA_KEYS = ["mq-projects", "mq-mf", "mq-ab", "mq-targets", "mq-bs", "mq-share"] as const;
type DataKey = (typeof DATA_KEYS)[number];

const DEFAULTS: Record<DataKey, unknown> = {
  "mq-projects": DEMO_PROJECTS,
  "mq-mf":       DEMO_MF,
  "mq-ab":       DEFAULT_AB,
  "mq-targets":  DEFAULT_TARGETS,
  "mq-bs":       DEFAULT_BS,
  "mq-share":    DEFAULT_SHARE_RATE,
};

async function requireAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return !!payload;
}

/**
 * GET /api/data
 * 5つのデータキーを一括取得
 */
export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("app_data")
    .select("key, value")
    .in("key", DATA_KEYS);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // 存在しないキーはデフォルト値でフォールバック
  const result: Record<string, unknown> = {};
  for (const key of DATA_KEYS) {
    const row = data?.find((r) => r.key === key);
    result[key] = row ? row.value : DEFAULTS[key];
  }

  return NextResponse.json(result);
}

/**
 * POST /api/data
 * Body: { key: DataKey, value: unknown }
 * 1キーをupsert
 */
export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, value } = await req.json();

  if (!DATA_KEYS.includes(key as DataKey)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  await dbSet(key, value);
  return NextResponse.json({ ok: true });
}
