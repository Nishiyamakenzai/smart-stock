import type { EvaluationSettings, ScoredCriterionKey } from "@/lib/evaluation-types";
import type { JobType } from "@/lib/job-types";

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

// 態度評価（4〜8）は職種共通
const ATTITUDE_CRITERIA: CriterionDef[] = [
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
    points: ["指示がなくても自ら課題を見つけ、行動に移せているか", "常に向上心があり、成長する意欲が見られるか", "指導やアドバイスを積極的に行っているか（受けているか）"],
  },
  {
    key: "score_trust", no: 8, label: "信頼性", group: "attitude",
    points: ["お客様や協力会社に対して礼儀正しい態度で接しているか", "プライドや感情で反発せず、組織としての序列を守れているか", "身だしなみ・言葉遣い・姿勢など、恥ずかしくない行動ができているか"],
  },
];

// 職種ごとの能力評価（1〜3）。DBのカラム（score_quality/score_speed/score_knowledge）は
// 職種を問わず共通で、ラベルと評価内容だけを職種に合わせて切り替える。
export const CRITERIA_BY_JOB_TYPE: Record<JobType, CriterionDef[]> = {
  craftsman: [
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
    ...ATTITUDE_CRITERIA,
  ],
  site_management: [
    {
      key: "score_quality", no: 1, label: "現場管理品質", group: "ability",
      points: ["現場全体の仕上がり・進捗を正しく把握し管理できているか", "手直しやクレームにつながる管理不備がないか", "定期点検を漏れなく実施・報告できているか"],
    },
    {
      key: "score_speed", no: 2, label: "渉外・提案力", group: "ability",
      points: ["訪問営業や近隣あいさつ回りを、指示を待たず自発的に行えているか", "お客様への提案・説明を分かりやすく行えているか", "トラブル発生時に自分で解決策を考え、提案できているか"],
    },
    {
      key: "score_knowledge", no: 3, label: "知識", group: "ability",
      points: ["建材・工法・関連法規について理解し、説明できるか", "現場ごとの仕様・注意点を正しく把握しているか", "新しい知識を自分から学ぼうとしているか"],
    },
    ...ATTITUDE_CRITERIA,
  ],
  office: [
    {
      key: "score_quality", no: 1, label: "事務品質", group: "ability",
      points: ["書類作成・データ入力の正確性", "ミスや漏れが少ないか、確認を怠っていないか", "整理整頓・情報管理が適切にできているか"],
    },
    {
      key: "score_speed", no: 2, label: "対応スピード", group: "ability",
      points: ["問い合わせや依頼への対応の速さ", "期限を守って業務を処理できているか", "優先順位をつけて効率よく動けているか"],
    },
    {
      key: "score_knowledge", no: 3, label: "知識", group: "ability",
      points: ["業務システムや社内ルールを理解しているか", "経理・総務等の関連知識を自分から学ぼうとしているか", "分からないことをそのままにせず確認・学習しているか"],
    },
    ...ATTITUDE_CRITERIA,
  ],
};

// 後方互換用（既存コードは「職人」基準をデフォルトとして参照する）
export const CRITERIA: CriterionDef[] = CRITERIA_BY_JOB_TYPE.craftsman;

export function getCriteriaForJobType(jobType: JobType | null | undefined): CriterionDef[] {
  return CRITERIA_BY_JOB_TYPE[jobType ?? "craftsman"] ?? CRITERIA_BY_JOB_TYPE.craftsman;
}

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
