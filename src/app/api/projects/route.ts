import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { PROJECT_SELECT, insertLog } from "@/lib/project-data";

export const dynamic = "force-dynamic";

/** GET /api/projects — 案件一覧（担当者・発生源展開込み。絞り込みは画面側で行う） */
export async function GET() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("pm_projects")
    .select(PROJECT_SELECT)
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

/** POST /api/projects — 案件登録（有効な標準工程マスタを複製して工程を自動生成） */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name, customer_name, occurred_at, source_id, address, building_age,
    customer_age_range, work_content, construction_period, created_by,
  } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "案件名を入力してください" }, { status: 400 });
  }

  const sb = getSupabase();

  const { data: project, error: insertError } = await sb
    .from("pm_projects")
    .insert({
      name: name.trim(),
      customer_name: customer_name || null,
      occurred_at: occurred_at || null,
      source_id: source_id || null,
      address: address || null,
      building_age: building_age || null,
      customer_age_range: customer_age_range || null,
      work_content: work_content || null,
      construction_period: construction_period || null,
      created_by: created_by || null,
    })
    .select()
    .single();

  if (insertError || !project) {
    return Response.json({ error: insertError?.message ?? "案件の作成に失敗しました" }, { status: 500 });
  }

  const { data: templates, error: templateError } = await sb
    .from("pm_process_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (templateError) {
    return Response.json({ error: templateError.message }, { status: 500 });
  }

  if (templates && templates.length > 0) {
    const rows = templates.map((t) => ({
      project_id: project.id,
      template_id: t.id,
      name: t.name,
      category: t.category,
      sort_order: t.sort_order,
    }));
    const { error: processError } = await sb.from("pm_project_processes").insert(rows);
    if (processError) {
      return Response.json({ error: processError.message }, { status: 500 });
    }
  }

  await insertLog({
    projectId: project.id,
    action: "project_created",
    detail: "案件登録",
    changedBy: created_by || null,
  });

  const { data: full, error: fetchError } = await sb
    .from("pm_projects")
    .select(PROJECT_SELECT)
    .eq("id", project.id)
    .single();
  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });

  return Response.json(full, { status: 201 });
}
