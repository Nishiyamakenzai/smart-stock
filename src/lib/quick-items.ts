import type { ScoredCriterionKey } from "@/lib/evaluation-types";
import type { JobType } from "@/lib/job-types";

export type QuickItemCategory = ScoredCriterionKey | "score_attitude";

export interface QuickItem {
  id: string;
  category: QuickItemCategory;
  label: string;
}

// 4段階（能力・態度グループ共通）: 0=できていない 〜 3=いつもできている
export const QUICK_SCALE_ABILITY = [
  { value: 0, label: "できていない" },
  { value: 1, label: "あまりできていない" },
  { value: 2, label: "だいたいできている" },
  { value: 3, label: "いつもできている" },
] as const;

// 3段階（姿勢のルール専用・減点方式）: 0=問題なし 〜 -2=よく問題がある
export const QUICK_SCALE_RULE = [
  { value: 0, label: "問題なし" },
  { value: -1, label: "たまに気になる" },
  { value: -2, label: "よく問題がある" },
] as const;

// ── 職種ごとの能力評価（1〜3・6項目ずつ） ──────────────────
export const ABILITY_QUICK_ITEMS_BY_JOB_TYPE: Record<JobType, QuickItem[]> = {
  craftsman: [
    { id: "cq1", category: "score_quality", label: "塗装の下地処理（ケレン・目地処理など）を手順通り丁寧に行えているか" },
    { id: "cq2", category: "score_quality", label: "塗りムラ・タレ・気泡など仕上がりの欠陥がないか" },
    { id: "cq3", category: "score_quality", label: "養生を丁寧に行い、周囲を汚さず作業できているか" },
    { id: "cq4", category: "score_quality", label: "色合わせ・膜厚など仕様書通りの品質を守れているか" },
    { id: "cq5", category: "score_quality", label: "完了後の清掃・後片付けまできちんと行っているか" },
    { id: "cq6", category: "score_quality", label: "道具・車・倉庫・ネタ場を整理整頓し大切に扱っているか" },

    { id: "cs1", category: "score_speed", label: "段取りよく作業を進め、手待ち時間が少ないか" },
    { id: "cs2", category: "score_speed", label: "予定工期・日程通りに作業を終えられているか" },
    { id: "cs3", category: "score_speed", label: "無駄な動きが少なく効率よく体を使えているか" },
    { id: "cs4", category: "score_speed", label: "天候や現場状況の変化に応じて柔軟にスケジュール調整できるか" },
    { id: "cs5", category: "score_speed", label: "複数の作業を並行して段取りできるか" },
    { id: "cs6", category: "score_speed", label: "急ぎの対応が必要なときに素早く動けるか" },

    { id: "ck1", category: "score_knowledge", label: "塗料の種類・特性・使い分けを理解しているか" },
    { id: "ck2", category: "score_knowledge", label: "建物の構造や下地材の違いを理解し、適切な施工ができるか" },
    { id: "ck3", category: "score_knowledge", label: "劣化症状（チョーキング・ひび割れ等）を見分け、原因を説明できるか" },
    { id: "ck4", category: "score_knowledge", label: "補修方法や下地処理の使い分けを自分で判断できるか" },
    { id: "ck5", category: "score_knowledge", label: "新しい工法・材料について自分から学ぼうとしているか" },
    { id: "ck6", category: "score_knowledge", label: "お客様や後輩に専門知識をわかりやすく説明できるか" },
  ],
  site_management: [
    { id: "mq1", category: "score_quality", label: "現場全体の進捗と仕上がりを正確に把握できているか" },
    { id: "mq2", category: "score_quality", label: "職人への指示・仕様伝達に漏れや誤りがないか" },
    { id: "mq3", category: "score_quality", label: "手直し・クレームにつながる管理不備を未然に防げているか" },
    { id: "mq4", category: "score_quality", label: "定期点検を漏れなく実施し、正しく報告できているか" },
    { id: "mq5", category: "score_quality", label: "安全管理・近隣配慮を徹底できているか" },
    { id: "mq6", category: "score_quality", label: "現場の写真・書類などの記録を正確に残せているか" },

    { id: "ms1", category: "score_speed", label: "訪問営業・近隣あいさつ回りを指示を待たず自発的に行えているか" },
    { id: "ms2", category: "score_speed", label: "お客様への提案・説明をわかりやすく行えているか" },
    { id: "ms3", category: "score_speed", label: "トラブル発生時に自分で解決策を考え、提案できているか" },
    { id: "ms4", category: "score_speed", label: "見積もり・提案書などの対応スピードは適切か" },
    { id: "ms5", category: "score_speed", label: "お客様からの問い合わせに迅速に対応できているか" },
    { id: "ms6", category: "score_speed", label: "反応が悪い相手や断られた相手にもめげずに次の行動へ移せるか" },

    { id: "mk1", category: "score_knowledge", label: "建材・工法・関連法規について理解し、説明できるか" },
    { id: "mk2", category: "score_knowledge", label: "現場ごとの仕様・注意点を正しく把握しているか" },
    { id: "mk3", category: "score_knowledge", label: "見積もり・原価の仕組みを理解しているか" },
    { id: "mk4", category: "score_knowledge", label: "新しい知識や制度を自分から学ぼうとしているか" },
    { id: "mk5", category: "score_knowledge", label: "職人からの技術的な質問に的確に答えられるか" },
    { id: "mk6", category: "score_knowledge", label: "他社事例や業界動向にアンテナを張っているか" },
  ],
  office: [
    { id: "oq1", category: "score_quality", label: "書類作成・データ入力に誤りが少ないか" },
    { id: "oq2", category: "score_quality", label: "確認作業を怠らず、ミスを未然に防げているか" },
    { id: "oq3", category: "score_quality", label: "整理整頓・情報管理（ファイリング等）が適切にできているか" },
    { id: "oq4", category: "score_quality", label: "数字や金額の取り扱いに正確さがあるか" },
    { id: "oq5", category: "score_quality", label: "マニュアルやルールに沿った処理ができているか" },
    { id: "oq6", category: "score_quality", label: "見た目や体裁にも気を配った資料作成ができているか" },

    { id: "os1", category: "score_speed", label: "問い合わせ・依頼への対応が早いか" },
    { id: "os2", category: "score_speed", label: "期限を守って業務を処理できているか" },
    { id: "os3", category: "score_speed", label: "優先順位をつけて効率よく動けているか" },
    { id: "os4", category: "score_speed", label: "繁忙期でも滞りなく業務を回せているか" },
    { id: "os5", category: "score_speed", label: "複数の業務を並行して処理できるか" },
    { id: "os6", category: "score_speed", label: "急な依頼にも柔軟に対応できるか" },

    { id: "ok1", category: "score_knowledge", label: "業務システムや社内ルールを理解しているか" },
    { id: "ok2", category: "score_knowledge", label: "経理・総務等の関連知識を自分から学ぼうとしているか" },
    { id: "ok3", category: "score_knowledge", label: "分からないことをそのままにせず確認・学習しているか" },
    { id: "ok4", category: "score_knowledge", label: "現場や職人の仕事内容についても理解しようとしているか" },
    { id: "ok5", category: "score_knowledge", label: "法改正や制度変更など必要な知識を更新できているか" },
    { id: "ok6", category: "score_knowledge", label: "他部署との連携に必要な知識を持っているか" },
  ],
};

// ── 態度評価（4〜8・職種共通・各5項目） ────────────────────
export const ATTITUDE_GROUP_QUICK_ITEMS: QuickItem[] = [
  { id: "d1", category: "score_discipline", label: "上司や役員の指示・意見を素直に聞き、実行できているか" },
  { id: "d2", category: "score_discipline", label: "指示された内容を否定せず、まず受け止めてから行動できているか" },
  { id: "d3", category: "score_discipline", label: "遅刻・早退・報連相の遅れがなく時間を守れているか" },
  { id: "d4", category: "score_discipline", label: "作業ルール・安全規則・社内ルールを守れているか" },
  { id: "d5", category: "score_discipline", label: "決められた手順やマニュアルを守って行動できているか" },

  { id: "c1", category: "score_cooperation", label: "仲間の意見を尊重し、協力して作業できているか" },
  { id: "c2", category: "score_cooperation", label: "自分勝手な判断で周囲を困らせることはないか" },
  { id: "c3", category: "score_cooperation", label: "仲間が忙しいときに自ら進んでサポートする姿勢があるか" },
  { id: "c4", category: "score_cooperation", label: "他部署・他の職種のメンバーとも円滑にコミュニケーションが取れているか" },
  { id: "c5", category: "score_cooperation", label: "感情的にならず、冷静に周囲と関われているか" },

  { id: "r1", category: "score_responsibility", label: "ミスや不具合を自分の責任として受け止め、言い訳をしないか" },
  { id: "r2", category: "score_responsibility", label: "与えられた仕事を最後まで責任をもってやり遂げているか" },
  { id: "r3", category: "score_responsibility", label: "自分の役割・立場を理解し、期待に応える働きができているか" },
  { id: "r4", category: "score_responsibility", label: "困ったときだけ助けを求めるのではなく、日頃から報連相ができているか" },
  { id: "r5", category: "score_responsibility", label: "任された仕事を人任せにせず、最後まで自分事として取り組めているか" },

  { id: "i1", category: "score_initiative", label: "指示がなくても自ら課題を見つけ、行動に移せているか" },
  { id: "i2", category: "score_initiative", label: "常に向上心を持ち、成長しようとする意欲が見られるか" },
  { id: "i3", category: "score_initiative", label: "後輩や仲間への指導・アドバイスを積極的に行っているか" },
  { id: "i4", category: "score_initiative", label: "新しいことへの挑戦を前向きに受け止められているか" },
  { id: "i5", category: "score_initiative", label: "難しい課題に対しても、自分なりの解決策を考えようとしているか" },

  { id: "t1", category: "score_trust", label: "お客様や協力会社に礼儀正しい態度で接しているか" },
  { id: "t2", category: "score_trust", label: "立場や実力に驕らず、組織としての序列・指示系統を守れているか" },
  { id: "t3", category: "score_trust", label: "身だしなみ・言葉遣いなど、恥ずかしくない行動ができているか" },
  { id: "t4", category: "score_trust", label: "他の人がいる前でも、上司の指示に反発したり否定したりしないか" },
  { id: "t5", category: "score_trust", label: "一貫した言動で、周囲から信頼される行動が取れているか" },
];

// ── 姿勢のルール（9・減点のみ・8項目） ──────────────────────
export const RULE_QUICK_ITEMS: QuickItem[] = [
  { id: "u1", category: "score_attitude", label: "遅刻・無断欠勤・報告なしの直行直帰などのルール違反はないか" },
  { id: "u2", category: "score_attitude", label: "車両・道具・会社備品の私的利用や乱雑な扱いはないか" },
  { id: "u3", category: "score_attitude", label: "現場や社内での言葉遣い・態度に問題はないか" },
  { id: "u4", category: "score_attitude", label: "お客様・近隣・協力会社とのトラブルの原因になる言動はないか" },
  { id: "u5", category: "score_attitude", label: "指示命令系統を無視した独断行動はないか" },
  { id: "u6", category: "score_attitude", label: "SNS・私的な発言等で会社の信用を損なう行為はないか" },
  { id: "u7", category: "score_attitude", label: "安全管理を怠り、事故やヒヤリハットにつながる行動はないか" },
  { id: "u8", category: "score_attitude", label: "経費・書類・タイムカードなどの不正確な報告はないか" },
];

export interface QuickItemGroup {
  category: QuickItemCategory;
  scale: "ability" | "rule";
  items: QuickItem[];
}

/** 職種に応じた全項目（約51項目）をカテゴリ順に取得する */
export function getQuickItemGroupsForJobType(jobType: JobType | null | undefined): QuickItemGroup[] {
  const abilityItems = ABILITY_QUICK_ITEMS_BY_JOB_TYPE[jobType ?? "craftsman"] ?? ABILITY_QUICK_ITEMS_BY_JOB_TYPE.craftsman;
  const abilityCategories: QuickItemCategory[] = ["score_quality", "score_speed", "score_knowledge"];
  const attitudeCategories: QuickItemCategory[] = ["score_discipline", "score_cooperation", "score_responsibility", "score_initiative", "score_trust"];

  const groups: QuickItemGroup[] = [];
  for (const cat of abilityCategories) {
    groups.push({ category: cat, scale: "ability", items: abilityItems.filter((it) => it.category === cat) });
  }
  for (const cat of attitudeCategories) {
    groups.push({ category: cat, scale: "ability", items: ATTITUDE_GROUP_QUICK_ITEMS.filter((it) => it.category === cat) });
  }
  groups.push({ category: "score_attitude", scale: "rule", items: RULE_QUICK_ITEMS });
  return groups;
}

export function getAllQuickItemsForJobType(jobType: JobType | null | undefined): QuickItem[] {
  return getQuickItemGroupsForJobType(jobType).flatMap((g) => g.items);
}
