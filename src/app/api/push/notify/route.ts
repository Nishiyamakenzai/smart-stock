import webpush from 'web-push';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const { member_ids, title, body, url } = await request.json();
  if (!member_ids?.length) return Response.json({ ok: true });

  const sb = getSupabase();
  const { data: subs } = await sb
    .from('push_subscriptions')
    .select('*')
    .in('member_id', member_ids);

  if (!subs?.length) return Response.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({ title, body, url: url || '/tasks' });
  let sent = 0;

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        // 期限切れの購読を削除
        if ((err as { statusCode?: number }).statusCode === 410) {
          await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    })
  );

  return Response.json({ ok: true, sent });
}
