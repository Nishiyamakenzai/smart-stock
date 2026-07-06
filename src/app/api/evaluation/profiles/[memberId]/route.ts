import { getSupabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const body = await request.json();
  const { wage_type, monthly_salary, daily_wage, join_date, grade_override, excluded, full_name } = body;

  if (wage_type && wage_type !== "monthly" && wage_type !== "daily") {
    return Response.json({ error: "wage_type must be 'monthly' or 'daily'" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data: existing } = await sb
    .from("evaluation_profiles")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  const fullPayload = {
    member_id: memberId,
    wage_type: wage_type ?? existing?.wage_type ?? "monthly",
    monthly_salary: monthly_salary !== undefined ? monthly_salary : existing?.monthly_salary ?? null,
    daily_wage: daily_wage !== undefined ? daily_wage : existing?.daily_wage ?? null,
    join_date: join_date !== undefined ? join_date : existing?.join_date ?? null,
    grade_override: grade_override !== undefined ? grade_override : existing?.grade_override ?? null,
    excluded: excluded !== undefined ? excluded : existing?.excluded ?? false,
    full_name: full_name !== undefined ? full_name : existing?.full_name ?? null,
  };

  let { data, error } = await sb
    .from("evaluation_profiles")
    .upsert(fullPayload, { onConflict: "member_id" })
    .select()
    .single();

  // evaluation_schema_v2.sql (excluded / full_name カラム追加)が未実行の環境向けフォールバック。
  // 新カラムが存在しない場合は、それらを除いた基本項目だけで保存を再試行する。
  let missingNewColumns = false;
  if (error && /schema cache|column/i.test(error.message) && /excluded|full_name/i.test(error.message)) {
    missingNewColumns = true;
    const { excluded: _excluded, full_name: _fullName, ...corePayload } = fullPayload;
    const retry = await sb
      .from("evaluation_profiles")
      .upsert(corePayload, { onConflict: "member_id" })
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (missingNewColumns) {
    return Response.json({
      ...data,
      warning: "excluded / full_name はデータベースに未追加のため保存されませんでした。supabase/evaluation_schema_v2.sql を実行してください。",
    });
  }
  return Response.json(data);
}
