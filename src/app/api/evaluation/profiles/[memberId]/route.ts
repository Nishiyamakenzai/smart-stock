import { getSupabase } from "@/lib/supabase";
import type { NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const body = await request.json();
  const { wage_type, monthly_salary, daily_wage, join_date, grade_override } = body;

  if (wage_type && wage_type !== "monthly" && wage_type !== "daily") {
    return Response.json({ error: "wage_type must be 'monthly' or 'daily'" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data, error } = await sb
    .from("evaluation_profiles")
    .upsert(
      {
        member_id: memberId,
        wage_type: wage_type ?? "monthly",
        monthly_salary: monthly_salary ?? null,
        daily_wage: daily_wage ?? null,
        join_date: join_date ?? null,
        grade_override: grade_override ?? null,
      },
      { onConflict: "member_id" }
    )
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
