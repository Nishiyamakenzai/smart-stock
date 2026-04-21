import { getSupabase } from '@/lib/supabase';

const MEMBER_SELECT = `
  *,
  assignee:members!tasks_assignee_id_fkey(id,name,color,role),
  reviewer:members!tasks_reviewer_id_fkey(id,name,color,role),
  created_by_member:members!tasks_created_by_fkey(id,name,color,role),
  next_assignee:members!tasks_next_assignee_id_fkey(id,name,color,role)
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignee = searchParams.get('assignee');
  const reviewer = searchParams.get('reviewer');
  const status = searchParams.get('status');

  const sb = getSupabase();
  let query = sb
    .from('tasks')
    .select(MEMBER_SELECT)
    .order('priority', { ascending: true })   // 緊急→高→普通→低
    .order('created_at', { ascending: false });

  if (assignee) query = query.eq('assignee_id', assignee);
  if (reviewer) query = query.eq('reviewer_id', reviewer);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // 優先度でソート（緊急→高→普通→低）
  const PRIORITY_ORDER = ['緊急', '高', '普通', '低'];
  const sorted = (data ?? []).sort((a, b) => {
    const pa = PRIORITY_ORDER.indexOf(a.priority);
    const pb = PRIORITY_ORDER.indexOf(b.priority);
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return Response.json(sorted);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    title, assignee_id, reviewer_id, status, priority,
    due_date, note, category, created_by,
    next_assignee_id, next_task_title, next_task_auto,
  } = body;

  if (!title) return Response.json({ error: 'title required' }, { status: 400 });

  const sb = getSupabase();
  const { data: task, error } = await sb
    .from('tasks')
    .insert({
      title, assignee_id, reviewer_id,
      status: status || '未対応',
      priority: priority || '普通',
      due_date, note, category, created_by,
      next_assignee_id: next_assignee_id || null,
      next_task_title: next_task_title || null,
      next_task_auto: next_task_auto || false,
    })
    .select(MEMBER_SELECT)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await sb.from('task_logs').insert({
    task_id: task.id,
    action: 'created',
    new_value: title,
    changed_by: created_by,
  });

  return Response.json(task, { status: 201 });
}
