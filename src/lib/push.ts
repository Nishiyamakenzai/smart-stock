import webpush from 'web-push';
import { getSupabase } from './supabase';

export async function sendPushToMembers(
  member_ids: (string | null | undefined)[],
  title: string,
  body: string,
  url: string = '/tasks'
): Promise<{ sent: number }> {
  const ids = member_ids.filter((id): id is string => Boolean(id));
  if (!ids.length) return { sent: 0 };

  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    console.error('[push] VAPID env vars not set');
    return { sent: 0 };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const sb = getSupabase();
  const { data: subs, error } = await sb
    .from('push_subscriptions')
    .select('*')
    .in('member_id', ids);

  if (error) {
    console.error('[push] DB error fetching subscriptions:', error.message);
    return { sent: 0 };
  }
  if (!subs?.length) return { sent: 0 };

  const payload = JSON.stringify({ title, body, url });
  let sent = 0;

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 86400, urgency: 'normal' }
        );
        sent++;
      } catch (err: unknown) {
        const e = err as { statusCode?: number; body?: string; message?: string };
        console.error(`[push] sendNotification failed: status=${e.statusCode} body=${e.body ?? e.message} endpoint=${sub.endpoint.slice(0, 50)}`);
        if (e.statusCode === 410 || e.statusCode === 404) {
          await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    })
  );

  return { sent };
}
