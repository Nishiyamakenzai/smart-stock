import { getSupabase } from "@/lib/supabase";
import type { ProcessStatus } from "@/lib/project-types";

/** 案件一覧・詳細で共通して使う select 句（担当者・発生源を展開） */
export const PROJECT_SELECT = `
  *,
  source:pm_sources(*),
  lost_reason:pm_lost_reasons(*),
  processes:pm_project_processes(
    *,
    planned_assignee:members!pm_project_processes_planned_assignee_id_fkey(*),
    actual_assignee:members!pm_project_processes_actual_assignee_id_fkey(*)
  )
`;

export async function fetchProjectById(id: string) {
  const sb = getSupabase();
  const { data, error } = await sb.from("pm_projects").select(PROJECT_SELECT).eq("id", id).single();
  return { data, error };
}

interface LogParams {
  projectId: string;
  processId?: string | null;
  action: string;
  processName?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  detail?: string | null;
  changedBy?: string | null;
}

export async function insertLog(params: LogParams) {
  const sb = getSupabase();
  await sb.from("pm_process_logs").insert({
    project_id: params.projectId,
    process_id: params.processId ?? null,
    action: params.action,
    process_name: params.processName ?? null,
    from_status: params.fromStatus ?? null,
    to_status: params.toStatus ?? null,
    detail: params.detail ?? null,
    changed_by: params.changedBy ?? null,
  });
}

export const VALID_PROCESS_STATUSES: ProcessStatus[] = ["未完了", "進行中", "完了", "不要", "保留", "問題あり"];
