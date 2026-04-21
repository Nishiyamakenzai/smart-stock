import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('members')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, role, color, display_order } = body;
  if (!name || !role || !color) return Response.json({ error: 'name, role, color required' }, { status: 400 });

  const sb = getSupabase();
  const { data, error } = await sb
    .from('members')
    .insert({ name, role, color, display_order: display_order ?? 99 })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
