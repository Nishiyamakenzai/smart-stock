import { getSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assignee = searchParams.get('assignee');
  const reviewer = searchParams.get('reviewer');
  const status = searchParams.get('status');

  const sb = getSupabase();
  let query = sb
    .from('tasks')
    .select(`
      *,
      assignee:members!tasks_assignee_id_fkey(id,name,color,role),
      reviewer:members!tasks_reviewer_id_fkey(id,name,color,role),
      created_by_member:members!tasks_created_by_fkey(id,name,color,role)
    `)
    .order('created_at', { ascending: false });

  if (assignee) query = query.eq('assignee_id', assignee);
  if (reviewer) query = query.eq('reviewer_id', reviewer);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, assignee_id, reviewer_id, status, priority, due_date, note, category, created_by } = body;

  if (!title) return Response.json({ error: 'title required' }, { status: 400 });

  const sb = getSupabase();
  const { data: task, error } = await sb
    .from('tasks')
    .insert({ title, assignee_id, reviewer_id, status: status || '未対応', priority: priority || '普通', due_date, note, category, created_by })
    .select()
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
