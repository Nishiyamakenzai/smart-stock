import { getSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { member_id, subscription } = await request.json();
  if (!member_id || !subscription?.endpoint) {
    return Response.json({ error: 'missing fields' }, { status: 400 });
  }

  const sb = getSupabase();

  // 同じエンドポイントが別メンバーに紐付いていたら更新（端末の人切替対応）
  // なければ新規挿入
  const { data: existing } = await sb
    .from('push_subscriptions')
    .select('id, member_id')
    .eq('endpoint', subscription.endpoint)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await sb
      .from('push_subscriptions')
      .update({
        member_id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .eq('endpoint', subscription.endpoint));
  } else {
    ({ error } = await sb.from('push_subscriptions').insert({
      member_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }));
  }

  if (error) {
    console.error('[push/subscribe] DB error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { member_id, endpoint } = await request.json();
  const sb = getSupabase();
  await sb.from('push_subscriptions').delete().eq('member_id', member_id).eq('endpoint', endpoint);
  return Response.json({ ok: true });
}
