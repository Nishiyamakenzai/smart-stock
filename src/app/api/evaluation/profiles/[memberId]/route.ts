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

  const { data, error } = await sb
    .from("evaluation_profiles")
    .upsert(
      {
        member_id: memberId,
        wage_type: wage_type ?? existing?.wage_type ?? "monthly",
        monthly_salary: monthly_salary !== undefined ? monthly_salary : existing?.monthly_salary ?? null,
        daily_wage: daily_wage !== undefined ? daily_wage : existing?.daily_wage ?? null,
        join_date: join_date !== undefined ? join_date : existing?.join_date ?? null,
        grade_override: grade_override !== undefined ? grade_override : existing?.grade_override ?? null,
        excluded: excluded !== undefined ? excluded : existing?.excluded ?? false,
        full_name: full_name !== undefined ? full_name : existing?.full_name ?? null,
      },
      { onConflict: "member_id" }
    )
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
