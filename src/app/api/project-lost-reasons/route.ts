import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/project-lost-reasons — 失注理由マスタ一覧 */
export async function GET() {
  const sb = getSupabase();
  const { data, error } = await sb.from("pm_lost_reasons").select("*").order("display_order");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

/** POST /api/project-lost-reasons — 失注理由を追加 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, display_order } = body;
  if (!name || !name.trim()) return Response.json({ error: "名称を入力してください" }, { status: 400 });

  const sb = getSupabase();
  let order = display_order;
  if (order === undefined || order === null) {
    const { data: maxRow } = await sb
      .from("pm_lost_reasons")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = (maxRow?.display_order ?? 0) + 1;
  }

  const { data, error } = await sb.from("pm_lost_reasons").insert({ name: name.trim(), display_order: order }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
