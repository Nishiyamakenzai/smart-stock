import type { Member } from "@/lib/task-types";

export type WageType = "monthly" | "daily";

export interface EvaluationProfile {
  id: string;
  member_id: string;
  wage_type: WageType;
  monthly_salary: number | null; // 円
  daily_wage: number | null;     // 円
  join_date: string | null;
  grade_override: number | null;
  excluded: boolean;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithProfile extends Member {
  profile: EvaluationProfile | null;
}

export interface Evaluation {
  id: string;
  member_id: string;
  period_label: string;
  period_start: string;
  period_end: string;
  grade_at_evaluation: number;
  score_quality: number;
  score_speed: number;
  score_knowledge: number;
  score_discipline: number;
  score_cooperation: number;
  score_responsibility: number;
  score_initiative: number;
  score_trust: number;
  score_attitude: number;
  total_score: number;
  note: string | null;
  evaluator: string | null;
  created_at: string;
  updated_at: string;
}

export type AbilityCriterionKey = "score_quality" | "score_speed" | "score_knowledge";
export type AttitudeCriterionKey =
  | "score_discipline"
  | "score_cooperation"
  | "score_responsibility"
  | "score_initiative"
  | "score_trust";
export type ScoredCriterionKey = AbilityCriterionKey | AttitudeCriterionKey;

export interface EvaluationSettings {
  perPeriodMin: number; // 1回の評価で必要な最低合計点
  halfYearMin: number;  // 半年（2回分）で必要な最低合計点
}
