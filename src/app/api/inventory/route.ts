import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { dbGet, dbSet } from "@/lib/supabase";
import type { InventoryData } from "@/lib/inventory-types";

export const dynamic = "force-dynamic";

async function requireAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return !!payload;
}

const DEFAULT_DATA: InventoryData = { items: [], transactions: [] };

/**
 * GET /api/inventory
 * 在庫データ（アイテム＋取引履歴）を一括取得
 */
export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await dbGet<InventoryData>("inv-data");
  return NextResponse.json(data ?? DEFAULT_DATA);
}

/**
 * POST /api/inventory
 * Body: InventoryData
 * 在庫データを全量upsert
 */
export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as InventoryData;

  // 取引履歴は最新500件に制限
  const trimmed: InventoryData = {
    items: body.items ?? [],
    transactions: (body.transactions ?? []).slice(0, 500),
  };

  await dbSet("inv-data", trimmed);
  return NextResponse.json({ ok: true });
}
