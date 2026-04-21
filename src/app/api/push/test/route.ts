import { sendPushToMembers } from '@/lib/push';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { member_id } = await request.json();
  if (!member_id) return Response.json({ error: 'member_id required' }, { status: 400 });

  const sb = getSupabase();
  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('id')
    .eq('member_id', member_id);

  if (!subs?.length) {
    return Response.json({ error: 'no_subscription', message: 'この端末でまだ通知が設定されていません。「通知を受け取る」ボタンを押してください。' }, { status: 400 });
  }

  const { sent } = await sendPushToMembers(
    [member_id],
    '🔔 テスト通知',
    'プッシュ通知が正常に動作しています！',
    '/tasks'
  );

  if (sent === 0) {
    return Response.json({ error: 'send_failed', message: '通知の送信に失敗しました。サーバーログを確認してください。' }, { status: 500 });
  }

  return Response.json({ ok: true, sent });
}
