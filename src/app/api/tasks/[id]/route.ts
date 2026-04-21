import { getSupabase } from '@/lib/supabase';
import type { NextRequest } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

const MEMBER_SELECT = `
  *,
  assignee:members!tasks_assignee_id_fkey(id,name,color,role),
  reviewer:members!tasks_reviewer_id_fkey(id,name,color,role),
  created_by_member:members!tasks_created_by_fkey(id,name,color,role),
  next_assignee:members!tasks_next_assignee_id_fkey(id,name,color,role)
`;

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sb = getSupabase();

  const [{ data: task, error }, { data: logs }] = await Promise.all([
    sb.from('tasks').select(MEMBER_SELECT).eq('id', id).single(),
    sb
      .from('task_logs')
      .select('*, changed_by_member:members!task_logs_changed_by_fkey(id,name,color)')
      .eq('task_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ task, logs: logs ?? [] });
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();
  const { changed_by, ...fields } = body;

  const sb = getSupabase();
  const { data: old } = await sb.from('tasks').select('*').eq('id', id).single();

  // 完了時はcompleted_atを自動セット
  if (fields.status === '完了' && (!old || old.status !== '完了')) {
    fields.completed_at = new Date().toISOString();
  }

  const { data: task, error } = await sb
    .from('tasks').update(fields).eq('id', id).select(MEMBER_SELECT).single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const logs: Array<{ task_id: string; action: string; old_value?: string; new_value?: string; changed_by: string }> = [];

  if (old && fields.status && old.status !== fields.status) {
    logs.push({ task_id: id, action: 'status_changed', old_value: old.status, new_value: fields.status, changed_by });
  }
  if (old && fields.assignee_id !== undefined && old.assignee_id !== fields.assignee_id) {
    logs.push({ task_id: id, action: 'reassigned', old_value: old.assignee_id ?? '', new_value: fields.assignee_id ?? '', changed_by });
  }
  if (logs.length === 0) {
    logs.push({ task_id: id, action: 'edited', changed_by });
  }
  if (logs.length > 0) await sb.from('task_logs').insert(logs);

  // 完了時に次タスクを自動生成
  let nextTask = null;
  const source = fields.next_task_auto !== undefined ? fields : old;
  if (
    fields.status === '完了' &&
    old?.status !== '完了' &&
    source?.next_task_auto &&
    source?.next_assignee_id &&
    source?.next_task_title
  ) {
    const { data: created } = await sb.from('tasks').insert({
      title: source.next_task_title,
      assignee_id: source.next_assignee_id,
      status: '未対応',
      priority: old?.priority ?? '普通',
      created_by: changed_by ?? old?.assignee_id,
      note: `「#${old?.task_number} ${old?.title}」完了後に自動生成`,
    }).select(MEMBER_SELECT).single();

    if (created) {
      nextTask = created;
      await sb.from('task_logs').insert({
        task_id: created.id,
        action: 'created',
        new_value: `「${old?.title}」完了後に自動生成`,
        changed_by: changed_by ?? old?.assignee_id,
      });
    }
  }

  return Response.json({ task, nextTask });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sb = getSupabase();
  const { error } = await sb.from('tasks').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
