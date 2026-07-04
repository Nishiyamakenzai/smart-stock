import { getSupabase } from "@/lib/supabase";
import type { Member } from "@/lib/task-types";
import type { EvaluationProfile, EmployeeWithProfile } from "@/lib/evaluation-types";

export async function GET() {
  const sb = getSupabase();
  const [membersRes, profilesRes] = await Promise.all([
    sb.from("members").select("*").eq("is_active", true).order("display_order"),
    sb.from("evaluation_profiles").select("*"),
  ]);
  if (membersRes.error) return Response.json({ error: membersRes.error.message }, { status: 500 });
  if (profilesRes.error) return Response.json({ error: profilesRes.error.message }, { status: 500 });

  const profileByMember = new Map<string, EvaluationProfile>(
    (profilesRes.data as EvaluationProfile[]).map((p) => [p.member_id, p])
  );
  const result: EmployeeWithProfile[] = (membersRes.data as Member[]).map((m) => ({
    ...m,
    profile: profileByMember.get(m.id) ?? null,
  }));
  return Response.json(result);
}
