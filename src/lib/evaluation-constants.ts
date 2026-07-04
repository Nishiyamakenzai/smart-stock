import type { EvaluationSettings, ScoredCriterionKey } from "@/lib/evaluation-types";

export type ScoreLetter = "S" | "A" | "B" | "C" | "D";

// S:極めて優秀 / A:優秀 / B:普通 / C:やや不十分 / D:かなり不十分
export const SCORE_LETTERS: ScoreLetter[] = ["S", "A", "B", "C", "D"];

export const SCORE_VALUES: Record<ScoreLetter, number> = { S: 2, A: 1, B: 0, C: -1, D: -2 };

export const SCORE_LABELS: Record<ScoreLetter, string> = {
  S: "極めて優秀",
  A: "優秀",
  B: "普通",
  C: "やや不十分",
  D: "かなり不十分",
};

export const SCORE_COLORS: Record<ScoreLetter, string> = {
  S: "#7c3aed",
  A: "#059669",
  B: "#64748b",
  C: "#d97706",
  D: "#dc2626",
};

export function valueToLetter(v: number): ScoreLetter {
  const found = (Object.entries(SCORE_VALUES) as [ScoreLetter, number][]).find(([, val]) => val === v);
  return found ? found[0] : "B";
}

export interface CriterionDef {
  key: ScoredCriterionKey;
  no: number;
  label: string;
  group: "ability" | "attitude";
  points: string[];
}

// 【能力評価】1〜3 ＋ 【態度評価】4〜8（人事評価シートより）
export const CRITERIA: CriterionDef[] = [
  {
    key: "score_quality", no: 1, label: "品質", group: "ability",
    points: ["仕上がりの品質と精度が良いか", "塗りムラや欠陥がないか", "道具や車、倉庫やネタ場などを丁寧に扱い整理整頓ができているか"],
  },
  {
    key: "score_speed", no: 2, label: "スピード", group: "ability",
    points: ["作業の速さと段取り力", "予定工期内に作業を終えられるか", "ムダのない動きができているか"],
  },
  {
    key: "score_knowledge", no: 3, label: "知識", group: "ability",
    points: ["道具の使い分けや建物の構造、建材の種類を常に探求しているか", "塗料の種類や性能を自分から覚えようとしているか", "劣化症状、補修方法などを理解し、説明ができるか"],
  },
  {
    key: "score_discipline", no: 4, label: "規律性", group: "attitude",
    points: ["上司や役員の指示・意見を素直に聞き、実行できているか", "遅刻・早退・報連相の遅れや忘れがなく、時間を守れているか", "作業ルールや安全規則を守り、模範的な行動をとれているか"],
  },
  {
    key: "score_cooperation", no: 5, label: "協調性", group: "attitude",
    points: ["部下や仲間の意見を尊重し、協力して作業できているか", "自分勝手な行動はしなかったか", "仲間が忙しいときに自ら進んでサポートする姿勢がみられたか"],
  },
  {
    key: "score_responsibility", no: 6, label: "責任感", group: "attitude",
    points: ["ミスや不具合があった場合、自分の責任として受け止めているか", "与えられた仕事を、最後まで責任をもって取り組んだか", "自分の役割を理解し、期待に応えるよう仕事に取り組んだか"],
  },
  {
    key: "score_initiative", no: 7, label: "積極性", group: "attitude",
    points: ["注意や指示を素直に聞き、忘れないように工夫改善をし実行しているか", "常に向上心があり、成長する意欲が見られるか", "指導やアドバイスを積極的に行っているか（受けているか）"],
  },
  {
    key: "score_trust", no: 8, label: "信頼性", group: "attitude",
    points: ["お客様や協力会社に対して礼儀正しい態度で接しているか", "プライドや感情で反発せず、組織としての序列を守れているか", "身だしなみ・言葉遣い・姿勢など、恥ずかしくない行動ができているか"],
  },
];

// 9. 姿勢のルールは「できて当たり前」＝加点なし、0〜-2点の減点のみ
export const ATTITUDE_RULE_LETTERS: ScoreLetter[] = ["B", "C", "D"];

export const MAX_SCORE = CRITERIA.length * SCORE_VALUES.S; // 16
export const MIN_SCORE = CRITERIA.length * SCORE_VALUES.D + SCORE_VALUES.D; // -18（姿勢のルール込み）

// 昇給・昇格の合格ライン（デフォルト値／設定画面から調整可能）
export const DEFAULT_EVALUATION_SETTINGS: EvaluationSettings = {
  perPeriodMin: 12,
  halfYearMin: 25,
};

export function computeTotal(scores: Record<ScoredCriterionKey, number>, attitude: number): number {
  const sum = CRITERIA.reduce((acc, c) => acc + (scores[c.key] ?? 0), 0);
  return sum + attitude;
}
