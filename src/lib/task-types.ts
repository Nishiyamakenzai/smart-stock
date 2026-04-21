export type TaskStatus = '未対応' | '対応中' | '確認待ち' | '完了' | '保留';
export type TaskPriority = '緊急' | '高' | '普通' | '低';
export type LogAction = 'created' | 'status_changed' | 'reassigned' | 'commented' | 'edited';

export interface Member {
  id: string;
  name: string;
  role: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  task_number: number;
  title: string;
  assignee_id: string | null;
  reviewer_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  note: string | null;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Member;
  reviewer?: Member;
  created_by_member?: Member;
}

export interface TaskLog {
  id: string;
  task_id: string;
  action: LogAction;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  created_at: string;
  changed_by_member?: Member;
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  '未対応': '#EF4444',
  '対応中': '#F59E0B',
  '確認待ち': '#10B981',
  '完了': '#6B7280',
  '保留': '#3B82F6',
};

export const STATUS_ORDER: TaskStatus[] = ['未対応', '対応中', '確認待ち', '完了'];

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  '緊急': '#EF4444',
  '高': '#F97316',
  '普通': '#6B7280',
  '低': '#94A3B8',
};

export function nextStatus(current: TaskStatus): TaskStatus {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return current;
  return STATUS_ORDER[idx + 1];
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
