import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { PROJECT_SELECT, insertLog } from "@/lib/project-data";

export const dynamic = "force-dynamic";

/** GET /api/projects/[id] — 案件詳細 + 履歴タイムライン */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getSupabase();

  const [projectRes, logsRes] = await Promise.all([
    sb.from("pm_projects").select(PROJECT_SELECT).eq("id", id).single(),
    sb
      .from("pm_process_logs")
      .select("*, changed_by_member:members(*)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (projectRes.error) return Response.json({ error: projectRes.error.message }, { status: 404 });
  if (logsRes.error) return Response.json({ error: logsRes.error.message }, { status: 500 });

  return Response.json({ project: projectRes.data, logs: logsRes.data });
}

/**
 * PATCH /api/projects/[id] — 基本情報・案件状態の更新
 * 成約: { status: '成約', won_at, contract_amount, changed_by }
 * 失注: { status: '失注', lost_at, lost_reason_id, lost_reason_detail, changed_by }
 * それ以外の基本情報も同じエンドポイントで更新可能
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { changed_by, ...fields } = body;

  const allowed = [
    "name", "customer_name", "occurred_at", "source_id", "address", "building_age",
    "customer_age_range", "work_content", "construction_period",
    "status", "won_at", "contract_amount", "lost_at", "lost_reason_id", "lost_reason_detail",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key] === "" ? null : fields[key];
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "更新項目がありません" }, { status: 400 });
  }

  const sb = getSupabase();

  const { data: before, error: beforeError } = await sb
    .from("pm_projects")
    .select("status")
    .eq("id", id)
    .single();
  if (beforeError) return Response.json({ error: beforeError.message }, { status: 404 });

  const { error } = await sb.from("pm_projects").update(update).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (typeof update.status === "string" && update.status !== before.status) {
    await insertLog({
      projectId: id,
      action: "status_changed",
      fromStatus: before.status,
      toStatus: update.status as string,
      detail:
        update.status === "成約" ? "成約"
        : update.status === "失注" ? "失注"
        : `案件状態を「${update.status}」に変更`,
      changedBy: changed_by || null,
    });
  } else {
    await insertLog({
      projectId: id,
      action: "edited",
      detail: "基本情報を更新",
      changedBy: changed_by || null,
    });
  }

  const { data: full, error: fetchError } = await sb.from("pm_projects").select(PROJECT_SELECT).eq("id", id).single();
  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });

  return Response.json(full);
}

/**
 * DELETE /api/projects/[id] — 案件を完全に削除（工程・履歴も連動して削除される）
 * 間違って登録した案件など、記録として残す必要が無いものを消すために使う。
 * 失注・取消として記録を残したい場合は、削除ではなく案件状態の変更を使う。
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getSupabase();

  const { data: existing, error: findError } = await sb.from("pm_projects").select("id, name").eq("id", id).single();
  if (findError || !existing) return Response.json({ error: "案件が見つかりません" }, { status: 404 });

  const { error } = await sb.from("pm_projects").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
