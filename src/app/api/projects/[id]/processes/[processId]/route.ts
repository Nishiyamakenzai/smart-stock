import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { PROJECT_SELECT, insertLog } from "@/lib/project-data";

export const dynamic = "force-dynamic";

type Action = "complete" | "skip" | "hold" | "problem" | "reopen" | "update";

/**
 * 特定の工程の状態が変わったとき、案件状態（pm_projects.status）を自動的に連動させる。
 * 「契約」は問題あり操作を「失注」として扱う（案件にとって致命的なため、通常の問題ありとは別枠）。
 * 「契約」を完了にした場合は、あわせて入力された工期・契約金額も案件情報へ反映する。
 */
function deriveProjectStatusUpdate(
  processName: string,
  action: Action,
  reason: string | null,
  body: Record<string, unknown>
): Record<string, unknown> | null {
  const today = new Date().toISOString().slice(0, 10);
  if (processName === "契約") {
    if (action === "complete") {
      const update: Record<string, unknown> = { status: "成約", won_at: today };
      if (typeof body.contract_amount === "number") update.contract_amount = body.contract_amount;
      if (typeof body.construction_period === "string" && body.construction_period) update.construction_period = body.construction_period;
      return update;
    }
    if (action === "problem") return { status: "失注", lost_at: today, lost_reason_detail: reason || null };
    if (action === "hold") return { status: "保留" };
  }
  if (processName === "近隣挨拶" && action === "complete") return { status: "施工中" };
  if (processName === "完工・近隣挨拶" && action === "complete") return { status: "工事完了・最終確認" };
  if (processName === "完了" && action === "complete") return { status: "完了" };
  return null;
}

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

  const projectStatusUpdate = action !== "update" ? deriveProjectStatusUpdate(before.name, action, body.reason || null, body) : null;
  if (projectStatusUpdate) {
    const { data: projectBefore } = await sb.from("pm_projects").select("status").eq("id", id).single();
    const { error: statusError } = await sb.from("pm_projects").update(projectStatusUpdate).eq("id", id);
    if (!statusError && projectBefore && projectBefore.status !== projectStatusUpdate.status) {
      await insertLog({
        projectId: id,
        action: "status_changed",
        fromStatus: projectBefore.status,
        toStatus: projectStatusUpdate.status as string,
        detail: `「${before.name}」が${logDetail}になったため自動更新`,
        changedBy: actorId,
      });
    }
  }

  const { data: full, error: fetchError } = await sb.from("pm_projects").select(PROJECT_SELECT).eq("id", id).single();
  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });

  return Response.json({ process: updated, project: full });
}
