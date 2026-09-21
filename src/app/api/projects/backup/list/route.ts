import { dbGet } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface SnapshotMeta {
  createdAt: string;
  counts: { projects: number; processes: number; logs: number };
}

/** GET /api/projects/backup/list — 保存済みバックアップ世代の一覧（中身は含まない） */
export async function GET() {
  const slots = await Promise.all(
    Array.from({ length: 10 }, (_, i) => i).map(async (i) => {
      const snap = await dbGet<SnapshotMeta>(`pm_backup_${i}`);
      return snap ? { slot: i, createdAt: snap.createdAt, counts: snap.counts } : null;
    })
  );
  const list = slots.filter((s): s is { slot: number; createdAt: string; counts: SnapshotMeta["counts"] } => s !== null);
  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return Response.json(list);
}
