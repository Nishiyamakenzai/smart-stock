import { getSupabase } from "@/lib/supabase";
import { withColumnFallback } from "@/lib/db-fallback";
import type { NextRequest } from "next/server";
import { CRITERIA, computeTotal } from "@/lib/evaluation-constants";
import type { ScoredCriterionKey } from "@/lib/evaluation-types";

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member_id");
  const sb = getSupabase();
  let query = sb.from("evaluations").select("*").order("period_start", { ascending: false });
  if (memberId) query = query.eq("member_id", memberId);
  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    member_id, period_label, period_start, period_end, grade_at_evaluation,
    score_attitude, note, evaluator, criteria_notes, is_draft,
  } = body;

  if (!member_id || !period_label || !period_start || !period_end || !grade_at_evaluation) {
    return Response.json({ error: "member_id, period_label, period_start, period_end, grade_at_evaluation are required" }, { status: 400 });
  }

  const scores: Record<ScoredCriterionKey, number> = {} as Record<ScoredCriterionKey, number>;
  for (const c of CRITERIA) {
    const v = body[c.key];
    if (typeof v !== "number" || v < -2 || v > 2) {
      return Response.json({ error: `${c.key} must be a number between -2 and 2` }, { status: 400 });
    }
    scores[c.key] = v;
  }
  const attitude = typeof score_attitude === "number" ? score_attitude : 0;
  if (attitude < -2 || attitude > 0) {
    return Response.json({ error: "score_attitude must be between -2 and 0" }, { status: 400 });
  }

  const total_score = computeTotal(scores, attitude);

  const sb = getSupabase();
  const fullPayload = {
    member_id, period_label, period_start, period_end, grade_at_evaluation,
    ...scores,
    score_attitude: attitude,
    total_score,
    note: note ?? null,
    evaluator: evaluator ?? null,
    criteria_notes: criteria_notes && typeof criteria_notes === "object" ? criteria_notes : {},
    is_draft: is_draft === true,
  };

  const { data, error, droppedKeys } = await withColumnFallback(
    ["criteria_notes", "is_draft"],
    fullPayload,
    async (payload) => {
      const r = await sb.from("evaluations").insert(payload).select().single();
      return { data: r.data, error: r.error };
    }
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (droppedKeys.length > 0) {
    return Response.json({
      ...data,
      warning: `${droppedKeys.join(", ")} はデータベースに未追加のため保存されませんでした。supabase/evaluation_schema_v3.sql・v4.sql を実行してください。`,
    }, { status: 201 });
  }
  return Response.json(data, { status: 201 });
}
