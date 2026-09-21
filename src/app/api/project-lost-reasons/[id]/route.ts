import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** PATCH /api/project-lost-reasons/[id] — 名称・並び順・有効/無効の編集 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "display_order", "is_active"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "更新項目がありません" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data, error } = await sb.from("pm_lost_reasons").update(update).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
