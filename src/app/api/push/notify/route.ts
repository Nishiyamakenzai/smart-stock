import { sendPushToMembers } from '@/lib/push';

export async function POST(request: Request) {
  const { member_ids, title, body, url } = await request.json();
  if (!member_ids?.length) return Response.json({ ok: true, sent: 0 });
  const { sent } = await sendPushToMembers(member_ids, title, body, url);
  return Response.json({ ok: true, sent });
}
