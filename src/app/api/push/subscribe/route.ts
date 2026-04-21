import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { member_id, subscription } = await request.json();
  if (!member_id || !subscription?.endpoint) {
    return Response.json({ error: 'missing fields' }, { status: 400 });
  }
  const sb = getSupabase();
  const { error } = await sb.from('push_subscriptions').upsert(
    {
      member_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: 'member_id,endpoint' }
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { member_id, endpoint } = await request.json();
  const sb = getSupabase();
  await sb.from('push_subscriptions').delete().eq('member_id', member_id).eq('endpoint', endpoint);
  return Response.json({ ok: true });
}
