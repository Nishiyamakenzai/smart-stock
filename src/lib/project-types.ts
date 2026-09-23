export type ProjectStatus =
  | "進行中" | "成約" | "施工中" | "工事完了・最終確認" | "完了" | "保留" | "失注" | "取消";

export type ProcessStatus = "未完了" | "進行中" | "完了" | "不要" | "保留" | "問題あり";

export interface Member {
  id: string;
  name: string;
  role: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export interface Source {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface LostReason {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface ProcessTemplate {
  id: string;
  name: string;
  category: string;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
}

export interface ProjectProcess {
  id: string;
  project_id: string;
  template_id: string | null;
  name: string;
  category: string;
  sort_order: number;
  status: ProcessStatus;
  planned_assignee_id: string | null;
  actual_assignee_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  note: string | null;
  skip_reason: string | null;
  problem_note: string | null;
  created_at: string;
  updated_at: string;
  planned_assignee?: Member | null;
  actual_assignee?: Member | null;
}

export interface Project {
  id: string;
  project_no: number;
  name: string;
  customer_name: string | null;
  occurred_at: string | null;
  source_id: string | null;
  address: string | null;
  building_age: string | null;
  customer_age_range: string | null;
  work_content: string | null;
  construction_period: string | null;
  status: ProjectStatus;
  won_at: string | null;
  contract_amount: number | null;
  lost_at: string | null;
  lost_reason_id: string | null;
  lost_reason_detail: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  source?: Source | null;
  lost_reason?: LostReason | null;
  processes?: ProjectProcess[];
}

export interface ProcessLog {
  id: string;
  project_id: string;
  process_id: string | null;
  action: string;
  process_name: string | null;
  from_status: string | null;
  to_status: string | null;
  detail: string | null;
  changed_by: string | null;
  created_at: string;
  changed_by_member?: Member | null;
}

export const PROJECT_STATUS_LIST: ProjectStatus[] = [
  "進行中", "成約", "施工中", "工事完了・最終確認", "完了", "保留", "失注", "取消",
];

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  進行中: "#F59E0B",
  成約: "#10B981",
  施工中: "#F97316",
  "工事完了・最終確認": "#06B6D4",
  完了: "#7C3AED",
  保留: "#3B82F6",
  失注: "#EF4444",
  取消: "#64748B",
};

export const PROJECT_STATUS_ICONS: Record<ProjectStatus, string> = {
  進行中: "🟡",
  成約: "🟢",
  施工中: "🏗️",
  "工事完了・最終確認": "🔍",
  完了: "🏁",
  保留: "🔵",
  失注: "🔴",
  取消: "⚫",
};

export const PROCESS_STATUS_COLORS: Record<ProcessStatus, string> = {
  未完了: "#94A3B8",
  進行中: "#3B82F6",
  完了: "#10B981",
  不要: "#94A3B8",
  保留: "#F59E0B",
  問題あり: "#EF4444",
};

export const PROCESS_STATUS_ICONS: Record<ProcessStatus, string> = {
  未完了: "🔜",
  進行中: "▶️",
  完了: "✅",
  不要: "❌",
  保留: "⏸️",
  問題あり: "⚠️",
};

/** 案件の「現在工程」「次工程」を求める。完了・不要以外で最も順番が早いものが現在工程。 */
export function getCurrentProcess(processes: ProjectProcess[]): ProjectProcess | null {
  const sorted = [...processes].sort((a, b) => a.sort_order - b.sort_order);
  return sorted.find((p) => p.status !== "完了" && p.status !== "不要") ?? null;
}

/**
 * 「次に必要」な工程をまとめて求める。
 * 通常は現在工程の次に来る工程だけを返すが、間の工程が完了扱い（不要ではなく）になっていて
 * 現在工程が飛び越えられている場合は、現在工程も一緒に「次に必要」へ含める。
 * （不要にした工程は正常に読み飛ばすだけで、抜けとは扱わない）
 */
export function getNextNeededProcesses(processes: ProjectProcess[]): ProjectProcess[] {
  const current = getCurrentProcess(processes);
  if (!current) return [];
  const sorted = [...processes].sort((a, b) => a.sort_order - b.sort_order);
  const after = sorted.filter((p) => p.sort_order > current.sort_order);
  const classicNext = after.find((p) => p.status !== "完了" && p.status !== "不要");
  if (!classicNext) return [];
  const between = after.filter((p) => p.sort_order < classicNext.sort_order);
  const hasCompletedGap = between.some((p) => p.status === "完了");
  return hasCompletedGap ? [current, classicNext] : [classicNext];
}

export function countDone(processes: ProjectProcess[]): { done: number; total: number } {
  const total = processes.filter((p) => p.status !== "不要").length;
  const done = processes.filter((p) => p.status === "完了").length;
  return { done, total };
}

/**
 * 案件が最後まで完了しているか（＝「完了フォルダ」に振り分けるべきか）を判定する。
 * 最終工程「完了」があればその状態を見る。古い案件で「完了」工程が無い場合は、
 * 全工程が完了・不要のどちらかで埋まっていれば完了扱いにする。
 */
export function isFullyCompleted(processes: ProjectProcess[]): boolean {
  if (processes.length === 0) return false;
  const finalStep = processes.find((p) => p.name === "完了");
  if (finalStep) return finalStep.status === "完了";
  return getCurrentProcess(processes) === null;
}

/** 最終更新（工程の中で最も新しい completed_at / updated_at）からの停滞日数 */
export function stagnationDays(processes: ProjectProcess[], projectUpdatedAt: string): number {
  const dates = processes
    .map((p) => p.completed_at ?? p.updated_at)
    .filter((d): d is string => !!d)
    .concat(projectUpdatedAt);
  const latest = dates.reduce((max, d) => (new Date(d) > new Date(max) ? d : max), dates[0] ?? projectUpdatedAt);
  const diffMs = Date.now() - new Date(latest).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatYen(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return `¥${n.toLocaleString("ja-JP")}`;
}

/** 住所からGoogleマップの検索URLを作る */
export function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * 築年数の入力を「築◯◯年（20XX年頃）」の表示用文字列に変換する。
 * 数字だけが入力された場合のみ自動変換し、それ以外（「新築」等）はそのまま扱う。
 */
export function formatBuildingAge(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) {
    const years = Number(trimmed);
    const builtYear = new Date().getFullYear() - years;
    return `築${years}年（${builtYear}年頃）`;
  }
  return trimmed;
}
