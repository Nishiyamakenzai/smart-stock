import type { Evaluation, EvaluationProfile, EvaluationSettings } from "@/lib/evaluation-types";
import { getGradeBySalaryYen, DAYS_PER_MONTH, GradeInfo, getGradeInfo } from "@/lib/grades";

/** プロフィール（月給・日給・上書き）から現在の等級を判定する */
export function resolveGrade(profile: EvaluationProfile | null | undefined): GradeInfo | null {
  if (!profile) return null;
  if (profile.grade_override) return getGradeInfo(profile.grade_override);
  const monthlyYen =
    profile.wage_type === "daily"
      ? (profile.daily_wage ?? 0) * DAYS_PER_MONTH
      : profile.monthly_salary ?? 0;
  if (!monthlyYen) return null;
  return getGradeBySalaryYen(monthlyYen);
}

/** 月給換算（円）を返す */
export function monthlyEquivalentYen(profile: EvaluationProfile | null | undefined): number | null {
  if (!profile) return null;
  if (profile.wage_type === "daily") {
    return profile.daily_wage ? profile.daily_wage * DAYS_PER_MONTH : null;
  }
  return profile.monthly_salary ?? null;
}

export interface HalfYearGroup {
  label: string;
  evaluations: Evaluation[]; // 新しい順、最大2件
  totalScore: number;
  passedPerPeriod: boolean; // 含まれる全評価が1回あたりの基準を満たしているか
  passedHalfYear: boolean;  // 半年合計が基準を満たしているか
  eligible: boolean;        // 昇給・昇格判定の対象になるか（2回分揃っていて両方の基準を満たす）
}

/** 評価（新しい順）を2件ずつペアにして半年判定を作る */
export function buildHalfYearGroups(
  evaluationsDesc: Evaluation[],
  settings: EvaluationSettings
): HalfYearGroup[] {
  const groups: HalfYearGroup[] = [];
  for (let i = 0; i < evaluationsDesc.length; i += 2) {
    const pair = evaluationsDesc.slice(i, i + 2);
    const totalScore = pair.reduce((s, e) => s + e.total_score, 0);
    const passedPerPeriod = pair.every((e) => e.total_score >= settings.perPeriodMin);
    const passedHalfYear = totalScore >= settings.halfYearMin;
    const label =
      pair.length === 2
        ? `${pair[1].period_label} 〜 ${pair[0].period_label}`
        : `${pair[0].period_label}（評価継続中）`;
    groups.push({
      label,
      evaluations: pair,
      totalScore,
      passedPerPeriod,
      passedHalfYear,
      eligible: pair.length === 2 && passedPerPeriod && passedHalfYear,
    });
  }
  return groups;
}

export function fmtYen(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("ja-JP") + "円";
}

export function fmtManYen(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return (n / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 1 }) + "万円";
}
