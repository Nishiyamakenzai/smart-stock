import { getSupabase } from "@/lib/supabase";
import { withColumnFallback } from "@/lib/db-fallback";
import type { NextRequest } from "next/server";
import { CRITERIA, computeTotal } from "@/lib/evaluation-constants";
import type { ScoredCriterionKey } from "@/lib/evaluation-types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getSupabase();
  const { data, error } = await sb.from("evaluations").select("*").eq("id", id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const sb = getSupabase();

  const { data: existing, error: fetchErr } = await sb.from("evaluations").select("*").eq("id", id).single();
  if (fetchErr || !existing) return Response.json({ error: fetchErr?.message ?? "not found" }, { status: 404 });

  const merged = { ...existing, ...body };
  const scores: Record<ScoredCriterionKey, number> = {} as Record<ScoredCriterionKey, number>;
  for (const c of CRITERIA) scores[c.key] = merged[c.key];
  const total_score = computeTotal(scores, merged.score_attitude);

  const { data, error, droppedKeys } = await withColumnFallback(
    ["criteria_notes"],
    { ...body, total_score },
    async (payload) => {
      const r = await sb.from("evaluations").update(payload).eq("id", id).select().single();
      return { data: r.data, error: r.error };
    }
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (droppedKeys.length > 0) {
    return Response.json({
      ...data,
      warning: `${droppedKeys.join(", ")} はデータベースに未追加のため保存されませんでした。supabase/evaluation_schema_v3.sql を実行してください。`,
    });
  }
  return Response.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getSupabase();
  const { error } = await sb.from("evaluations").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
