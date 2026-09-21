import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { PROJECT_SELECT, insertLog } from "@/lib/project-data";

export const dynamic = "force-dynamic";

type Action = "complete" | "skip" | "hold" | "problem" | "reopen" | "update";

/**
 * PATCH /api/projects/[id]/processes/[processId]
 * 社員が行う操作は「完了」「不要」「保留」「問題あり」の4つ + 元に戻す(reopen) + 予定担当者/期限/補足の更新(update)
 * Body: { action, actor_id?, reason?, note?, planned_assignee_id?, due_date? }
 *
 * 完了・不要を押した本人（actor_id）が自動的に対応者として記録され、日時も自動記録される。
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; processId: string }> }) {
  const { id, processId } = await params;
  const body = await req.json();
  const action = body.action as Action;
  const actorId: string | null = body.actor_id || null;

  const sb = getSupabase();

  const { data: before, error: beforeError } = await sb
    .from("pm_project_processes")
    .select("*")
    .eq("id", processId)
    .eq("project_id", id)
    .single();
  if (beforeError || !before) return Response.json({ error: "工程が見つかりません" }, { status: 404 });

  const update: Record<string, unknown> = {};
  let logDetail = "";
  let toStatus = before.status;

  switch (action) {
    case "complete":
      update.status = "完了";
      update.actual_assignee_id = actorId;
      update.completed_at = new Date().toISOString();
      update.problem_note = null;
      update.note = body.reason ?? before.note;
      toStatus = "完了";
      logDetail = body.reason ? `完了：${body.reason}` : "完了";
      break;
    case "skip":
      update.status = "不要";
      update.actual_assignee_id = actorId;
      update.completed_at = new Date().toISOString();
      update.skip_reason = body.reason || null;
      toStatus = "不要";
      logDetail = body.reason ? `不要：${body.reason}` : "不要";
      break;
    case "hold":
      update.status = "保留";
      update.note = body.reason ?? before.note;
      toStatus = "保留";
      logDetail = body.reason ? `保留：${body.reason}` : "保留";
      break;
    case "problem":
      update.status = "問題あり";
      update.problem_note = body.reason || null;
      toStatus = "問題あり";
      logDetail = body.reason ? `問題あり：${body.reason}` : "問題あり";
      break;
    case "reopen":
      update.status = "未完了";
      update.actual_assignee_id = null;
      update.completed_at = null;
      update.skip_reason = null;
      update.problem_note = null;
      toStatus = "未完了";
      logDetail = "未完了に戻す";
      break;
    case "update":
      if ("planned_assignee_id" in body) update.planned_assignee_id = body.planned_assignee_id || null;
      if ("due_date" in body) update.due_date = body.due_date || null;
      if ("note" in body) update.note = body.note || null;
      logDetail = "予定担当者・期限・補足を更新";
      break;
    default:
      return Response.json({ error: "不正な操作です" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await sb
    .from("pm_project_processes")
    .update(update)
    .eq("id", processId)
    .select()
    .single();
  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

  if (action !== "update") {
    await insertLog({
      projectId: id,
      processId,
      action: "status_changed",
      processName: before.name,
      fromStatus: before.status,
      toStatus,
      detail: logDetail,
      changedBy: actorId,
    });
  } else {
    await insertLog({
      projectId: id,
      processId,
      action: "edited",
      processName: before.name,
      detail: logDetail,
      changedBy: actorId,
    });
  }

  const { data: full, error: fetchError } = await sb.from("pm_projects").select(PROJECT_SELECT).eq("id", id).single();
  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });

  return Response.json({ process: updated, project: full });
}
