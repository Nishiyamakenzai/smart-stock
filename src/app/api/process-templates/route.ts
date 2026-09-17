import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/process-templates — 工程マスタ一覧（管理画面用に非表示分も含む） */
export async function GET() {
  const sb = getSupabase();
  const { data, error } = await sb.from("pm_process_templates").select("*").order("sort_order");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

/** POST /api/process-templates — 工程マスタ追加（コードを書き換えずに工程を増やせる） */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, category, sort_order, is_required } = body;
  if (!name || !category) {
    return Response.json({ error: "工程名とカテゴリを入力してください" }, { status: 400 });
  }

  const sb = getSupabase();
  let order = sort_order;
  if (order === undefined || order === null) {
    const { data: maxRow } = await sb
      .from("pm_process_templates")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = (maxRow?.sort_order ?? 0) + 1;
  }

  const { data, error } = await sb
    .from("pm_process_templates")
    .insert({ name, category, sort_order: order, is_required: is_required ?? true })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
