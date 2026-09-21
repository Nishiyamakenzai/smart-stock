import { NextRequest } from "next/server";
import { dbGet } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/projects/backup/[slot] — 指定世代のバックアップ全内容を取得（ダウンロード用） */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  const index = Number(slot);
  if (!Number.isInteger(index) || index < 0 || index > 9) {
    return Response.json({ error: "不正な世代番号です" }, { status: 400 });
  }
  const snap = await dbGet(`pm_backup_${index}`);
  if (!snap) return Response.json({ error: "バックアップが見つかりません" }, { status: 404 });
  return Response.json(snap);
}
