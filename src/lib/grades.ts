export interface GradeInfo {
  grade: number;
  name: string;
  catchphrase: string;
  salaryMin: number; // 万円
  salaryMax: number; // 万円
  jobContent: string;
  authority: string;
  promotionCondition: string;
}

// 等級制度詳細（等級1〜10）
export const GRADES: GradeInfo[] = [
  {
    grade: 1,
    name: "こけし侍",
    catchphrase: "道具にまだ振り回されてる！でも志は一人前。",
    salaryMin: 17,
    salaryMax: 18,
    jobContent: "養生や清掃など補助的な作業を中心に担当。工具の名前・使い方、安全ルールを覚える段階。指導者のもとで基本動作を反復する。",
    authority: "指示された作業のみ実施。判断や変更は不可。",
    promotionCondition: "基本的な作業知識と道具の使い方を習得。ミスや注意が大幅に減少。",
  },
  {
    grade: 2,
    name: "竹の子侍",
    catchphrase: "にょきにょき成長中。伸びしろしかない若武者。",
    salaryMin: 19,
    salaryMax: 20,
    jobContent: "簡単な作業を一部任される。先輩のサポートを受けながら、小面積の塗装や材料準備、整理整頓を自ら行う。基本ルールを理解し現場に慣れる段階。",
    authority: "自身の担当作業範囲内で簡易的な判断が可能（塗料の準備等）。",
    promotionCondition: "下塗りや養生などを単独で遂行可能になり、現場の流れを理解。倉庫や車の管理や片付けも自主的に行う。",
  },
  {
    grade: 3,
    name: "一太刀侍（いったちざむらい）",
    catchphrase: "まずは1つの現場を任されるようになった切込み隊長。",
    salaryMin: 21,
    salaryMax: 22,
    jobContent: "全体の作業工程を理解し、自分の担当部分を持って仕事ができるようになる。仕上がり品質やスピードにばらつきがあるが、修正対応も自ら行う意識を持つ。",
    authority: "標準的な作業手順について、自ら判断して実行可能。段取り力が試される。",
    promotionCondition: "品質・スピードともに一定基準に到達。先輩の手直しが少なくなってきた。物忘れや遅刻が無いように自己管理を徹底。",
  },
  {
    grade: 4,
    name: "半熟武士",
    catchphrase: "技はある。でもまだ“完熟”じゃない。焦らず進め。",
    salaryMin: 23,
    salaryMax: 24,
    jobContent: "一般的な塗装作業を単独で任せられるレベル。塗装範囲の確認、工程の段取り、後輩への作業指示なども少しずつ経験。顧客と軽微な会話にも対応する。",
    authority: "現場状況に応じて作業手順の微調整や人員への指示が可能。",
    promotionCondition: "自己判断で作業を進め、後輩へのフォローも行えるようになる。現場を少しずつ任される。",
  },
  {
    grade: 5,
    name: "ぬり将",
    catchphrase: "現場の将として、部下に指示を出す立場。責任も増える。",
    salaryMin: 25,
    salaryMax: 26,
    jobContent: "小規模現場の責任者的立場として材料の選定、簡単な工程管理、報告書の記入なども行う。後輩の教育や現場での判断も任され、施工品質の安定感が求められる。",
    authority: "工程組み・材料管理・安全管理・進捗調整まで一部任される。",
    promotionCondition: "小規模現場を任せられ、顧客対応や簡単な現場管理もこなせる。",
  },
  {
    grade: 6,
    name: "段取り侍",
    catchphrase: "現場の采配はお手のもの。カッコいい立ち回りができる剣士。",
    salaryMin: 27,
    salaryMax: 28,
    jobContent: "高難度塗装（多色仕上げや特殊塗料）や大型施設の現場を任される。複数人のチームリーダーとして、全体工程の把握と品質・進捗の管理を行う。",
    authority: "現場全体の段取りと判断を自ら行い、品質・納期への責任を負う。",
    promotionCondition: "高難度作業をこなしながら、複数人をまとめて成果を上げる。",
  },
  {
    grade: 7,
    name: "百戦錬磨の侍",
    catchphrase: "トラブルも、クレームも、経験で乗り越えてきた猛者。",
    salaryMin: 29,
    salaryMax: 32,
    jobContent: "1つの現場全体の責任を持ち、顧客対応・工程管理・材料管理・人員配置をすべて担う。トラブルへの判断対応も任され、リーダーシップが求められる。",
    authority: "予算調整、職人割当て、外注依頼、工程遅延対応など現場マネジメント全般。担当現場での全責任を担う。",
    promotionCondition: "1現場の責任者として品質・安全・工程のすべてを安定管理。",
  },
  {
    grade: 8,
    name: "総大将",
    catchphrase: "チームの頭領。もう戦（現場）に出れば無双状態。",
    salaryMin: 33,
    salaryMax: 39,
    jobContent: "複数現場を同時に管理し、経営陣の補佐として社内全体の段取り・技術指導を行う。後輩育成計画の立案や作業標準化の提案などにも関わる。",
    authority: "人員調整や緊急対応など現場外の判断にも関与。経営層と協議。",
    promotionCondition: "複数現場・後輩育成・職長業務など高負荷業務の遂行能力。",
  },
  {
    grade: 9,
    name: "奥義継承者",
    catchphrase: "技術・人間力ともに極めた者にのみ与えられる名。",
    salaryMin: 40,
    salaryMax: 45,
    jobContent: "施工部門の最高責任者として、複数チームを統括。品質・納期・安全・利益管理をトータルで担う。会社全体の施工戦略に関与し、経営層との連携も多い。",
    authority: "施工戦略、採用、設備導入など施工部門全体の意思決定を担う。",
    promotionCondition: "数期に渡り安定して成果を出し、部門全体に貢献していると認められる。",
  },
  {
    grade: 10,
    name: "伝説のぬり侍",
    catchphrase: "社内に語り継がれる最強職人。もはや生きる伝説。",
    salaryMin: 46,
    salaryMax: 50,
    jobContent: "名人レベルの職人として、業界内外に名前が通る存在。技術指導、現場監査、新案開発、広報活動などにも関与。会社ブランドを体現する存在。",
    authority: "社外折衝、新技術導入、育成体系構築など最上位職人としての経営貢献。",
    promotionCondition: "会社の成長に不可欠な存在として経営陣から任命される。",
  },
];

export function getGradeInfo(grade: number): GradeInfo {
  return GRADES.find((g) => g.grade === grade) ?? GRADES[0];
}

/** 想定月給（万円）から等級を判定する。範囲外は最も近い等級に丸める。 */
export function getGradeBySalaryManYen(monthlyManYen: number): GradeInfo {
  if (monthlyManYen <= GRADES[0].salaryMax) return GRADES[0];
  const last = GRADES[GRADES.length - 1];
  if (monthlyManYen >= last.salaryMin) return last;
  const hit = GRADES.find((g) => monthlyManYen >= g.salaryMin && monthlyManYen <= g.salaryMax);
  if (hit) return hit;
  // 範囲の隙間に落ちた場合は、直近の下限に最も近い等級を採用
  let closest = GRADES[0];
  let bestDiff = Infinity;
  for (const g of GRADES) {
    const diff = Math.min(Math.abs(monthlyManYen - g.salaryMin), Math.abs(monthlyManYen - g.salaryMax));
    if (diff < bestDiff) { bestDiff = diff; closest = g; }
  }
  return closest;
}

/** 月給(円)換算 → 等級判定。日給月給の場合は事前に日給×25で月換算しておくこと */
export function getGradeBySalaryYen(monthlyYen: number): GradeInfo {
  return getGradeBySalaryManYen(monthlyYen / 10000);
}

export const DAYS_PER_MONTH = 25;
