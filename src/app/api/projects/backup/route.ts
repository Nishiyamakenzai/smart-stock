import { getSupabase, dbGet, dbSet } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SNAPSHOT_SLOTS = 10;
const META_KEY = "pm_backup_meta";
const slotKey = (i: number) => `pm_backup_${i}`;

interface BackupMeta {
  nextIndex: number;
}

/**
 * GET /api/projects/backup
 * 案件進捗管理システムの全データ（案件・工程・履歴・マスタ）を丸ごとスナップショットし、
 * app_data テーブルに世代ローテーション（最大10世代）で保存する。
 * Vercelのcron（vercel.json）から毎日呼び出される想定。
 */
export async function GET() {
  const sb = getSupabase();

  const [projects, processes, logs, sources, lostReasons, templates] = await Promise.all([
    sb.from("pm_projects").select("*"),
    sb.from("pm_project_processes").select("*"),
    sb.from("pm_process_logs").select("*"),
    sb.from("pm_sources").select("*"),
    sb.from("pm_lost_reasons").select("*"),
    sb.from("pm_process_templates").select("*"),
  ]);

  const firstError = [projects, processes, logs, sources, lostReasons, templates].find((r) => r.error)?.error;
  if (firstError) {
    return Response.json({ error: firstError.message }, { status: 500 });
  }

  const snapshot = {
    createdAt: new Date().toISOString(),
    counts: {
      projects: projects.data?.length ?? 0,
      processes: processes.data?.length ?? 0,
      logs: logs.data?.length ?? 0,
    },
    data: {
      pm_projects: projects.data,
      pm_project_processes: processes.data,
      pm_process_logs: logs.data,
      pm_sources: sources.data,
      pm_lost_reasons: lostReasons.data,
      pm_process_templates: templates.data,
    },
  };

  const meta = (await dbGet<BackupMeta>(META_KEY)) ?? { nextIndex: 0 };
  const index = meta.nextIndex % SNAPSHOT_SLOTS;

  await dbSet(slotKey(index), snapshot);
  await dbSet(META_KEY, { nextIndex: index + 1 });

  return Response.json({ ok: true, slot: index, createdAt: snapshot.createdAt, counts: snapshot.counts });
}
