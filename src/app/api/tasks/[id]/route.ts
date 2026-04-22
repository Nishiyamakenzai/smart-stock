import { getSupabase } from '@/lib/supabase';
import { sendPushToMembers } from '@/lib/push';
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
    sb.from('task_logs')
      .select('*, changed_by_member:members!task_logs_changed_by_fkey(id,name,color)')
      .eq('task_id', id).order('created_at', { ascending: false }),
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

  if (fields.status === '完了' && old?.status !== '完了') {
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
  if (logs.length === 0) logs.push({ task_id: id, action: 'edited', changed_by });
  if (logs.length > 0) await sb.from('task_logs').insert(logs);

  // 確認待ちになったらレビュアーに通知
  if (fields.status === '確認待ち' && old?.status !== '確認待ち' && old?.reviewer_id && old.reviewer_id !== changed_by) {
    const changerName = task.assignee?.name ?? task.created_by_member?.name ?? '担当者';
    sendPushToMembers(
      [old.reviewer_id],
      '👆 確認依頼が届きました',
      `${changerName}さんから「${old.title ?? task.title}」の確認依頼です`,
      `/tasks/${id}`
    ).catch(e => console.error('[tasks/PUT 確認待ち push]', e));
  }

  // 担当者が変わったら新担当者に通知
  if (fields.assignee_id && fields.assignee_id !== old?.assignee_id && fields.assignee_id !== changed_by) {
    sendPushToMembers(
      [fields.assignee_id],
      '📋 タスクが割り当てられました',
      `「${task.title}」の担当者になりました`,
      `/tasks/${id}`
    ).catch(e => console.error('[tasks/PUT 担当変更 push]', e));
  }

  // 完了後の次タスク自動生成
  const nextTasks: unknown[] = [];
  const src = fields.next_task_auto !== undefined ? fields : old;

  if (fields.status === '完了' && old?.status !== '完了' && src?.next_task_auto) {
    const notePrefix = `「#${old?.task_number} ${old?.title}」完了後に自動生成`;
    const creatorId = changed_by ?? old?.assignee_id;

    // 新方式: next_tasks 配列
    const nextItems: Array<{ assignee_id: string; title: string }> = src?.next_tasks ?? [];
    for (const item of nextItems) {
      if (!item.assignee_id || !item.title) continue;
      const { data: created } = await sb.from('tasks').insert({
        title: item.title,
        assignee_id: item.assignee_id,
        status: '未対応',
        priority: old?.priority ?? '普通',
        created_by: creatorId,
        note: notePrefix,
      }).select(MEMBER_SELECT).single();

      if (created) {
        nextTasks.push(created);
        await sb.from('task_logs').insert({
          task_id: created.id, action: 'created',
          new_value: notePrefix, changed_by: creatorId,
        });
        if (created.assignee_id && created.assignee_id !== changed_by) {
          sendPushToMembers(
            [created.assignee_id],
            '🔗 次のタスクが届きました',
            `「${old?.title}」が完了し、あなたのタスク「${item.title}」が作成されました`,
            `/tasks/${created.id}`
          ).catch(e => console.error('[tasks/PUT nextTasks push]', e));
        }
      }
    }

    // 旧方式: next_assignee_id / next_task_title（後方互換）
    if (nextItems.length === 0 && src?.next_assignee_id && src?.next_task_title) {
      const { data: created } = await sb.from('tasks').insert({
        title: src.next_task_title,
        assignee_id: src.next_assignee_id,
        status: '未対応',
        priority: old?.priority ?? '普通',
        created_by: creatorId,
        note: notePrefix,
      }).select(MEMBER_SELECT).single();

      if (created) {
        nextTasks.push(created);
        await sb.from('task_logs').insert({
          task_id: created.id, action: 'created',
          new_value: notePrefix, changed_by: creatorId,
        });
        if (created.assignee_id && created.assignee_id !== changed_by) {
          sendPushToMembers(
            [created.assignee_id],
            '🔗 次のタスクが届きました',
            `「${old?.title}」が完了し、あなたのタスク「${src.next_task_title}」が作成されました`,
            `/tasks/${created.id}`
          ).catch(e => console.error('[tasks/PUT nextTask push]', e));
        }
      }
    }
  }

  return Response.json({ task, nextTask: nextTasks[0] ?? null, nextTasks });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sb = getSupabase();
  const { error } = await sb.from('tasks').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
