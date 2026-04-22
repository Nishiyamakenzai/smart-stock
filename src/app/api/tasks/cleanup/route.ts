import { getSupabase } from '@/lib/supabase';

// Vercel Cron から呼ばれる（毎日深夜2時）
// 完了から30日以上経過したタスクを削除する
export async function GET(request: Request) {
  // Cron認証（Vercelが自動でセットするヘッダー）
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  // 削除対象の取得（ログに残すため）
  const { data: targets } = await sb
    .from('tasks')
    .select('id, task_number, title, completed_at')
    .eq('status', '完了')
    .lt('completed_at', cutoff.toISOString());

  if (!targets?.length) {
    return Response.json({ ok: true, deleted: 0, message: '削除対象なし' });
  }

  const ids = targets.map(t => t.id);

  // 関連するtask_logsを先に削除
  await sb.from('task_logs').delete().in('task_id', ids);

  // タスクを削除
  const { error } = await sb.from('tasks').delete().in('id', ids);
  if (error) {
    console.error('[cleanup] delete error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.log(`[cleanup] Deleted ${targets.length} tasks completed before ${cutoff.toISOString()}`);
  return Response.json({ ok: true, deleted: targets.length, tasks: targets.map(t => `#${t.task_number} ${t.title}`) });
}
