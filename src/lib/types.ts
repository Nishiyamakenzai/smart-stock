export interface VBreak {
  scaffold: number;
  paint: number;
  sub: number;
  material: number;
  fee: number;
  fixRoy: number;
  varRoy: number;
  other: number;
}

export interface Project {
  id: number;
  name: string;
  month: number;
  p: number;
  v: VBreak;
  status: string;
  area?: string;
}

export interface Municipality {
  id: string;
  name: string;
  homes: number;
}

export interface ShareRateState {
  favorites: string[];
  contractCounts: Record<string, number>;
}

// F1 人件費
export interface F1Items {
  exec: number;      // 役員報酬
  salary: number;    // 給与
  bonus: number;     // 賞与
  social: number;    // 社会保険料
  welfare: number;   // 福利厚生費
}
// F2 経費
export interface F2Items {
  rent: number;      // 家賃
  repair: number;    // 修繕費
  fuel: number;      // 燃料代
}
// F3 戦略費
export interface F3Items {
  adWeb: number;     // 広告費（ウェブ）
  adFlyer: number;   // 広告費（チラシ）
  adPortal: number;  // 広告費（ポータル）
  adSign: number;    // 広告費（看板/広報/その他）
  adYoutube: number; // 広告費（Youtube/ブログ等）
  system: number;    // システム利用料
  telecom: number;   // 通信費
  travel: number;    // 旅費交通費
  training: number;  // 研修費
  supplies: number;  // 消耗品
  other: number;     // その他
}
// F4 金利
export interface F4Items {
  interest: number;  // 借入金利息
}
// F5 保険・顧問等
export interface F5Items {
  insurance: number; // 保険料
  advisor: number;   // 顧問料
  membership: number;// 会費
  misc: number;      // 雑費
}

export interface FixedCosts {
  f1: F1Items;
  f2: F2Items;
  f3: F3Items;
  f4: F4Items;
  f5: F5Items;
}

export type MonthlyFixed = Record<number, FixedCosts>;
export type AnnualBudget = FixedCosts; // 同一構造（年間金額）

export interface Targets {
  pq: number;
  mq: number;
  g: number;
  q: number;
  avgP: number;
  mRate: number;
}

export interface BSData {
  cash: number;
  receivable: number;
  inventory: number;
  fixedAsset: number;
  otherAsset: number;
  payable: number;
  shortLoan: number;
  longLoan: number;
  otherDebt: number;
}

export interface MonthData {
  pq: number;
  vq: number;
  mq: number;
  q: number;
  f: number;
  g: number;
  avgP: number;
  avgM: number;
  mRate: number;
  fmRatio: number;
  vBreak: VBreak;
  label: string;
}

export interface CumData {
  cumPQ: number;
  cumMQ: number;
  cumF: number;
}

export interface Pipeline {
  [key: string]: number;
}

export interface ComputedData {
  md: MonthData[];
  cum: CumData[];
  totalPQ: number;
  totalVQ: number;
  totalMQ: number;
  totalF: number;
  totalG: number;
  totalQ: number;
  avgP: number;
  avgV: number;
  avgM: number;
  totalMRate: number;
  totalFMRatio: number;
  activeMonths: number;
  pipe: Pipeline;
  pipeA: Pipeline;
}

export interface AIHint {
  t: 'good' | 'warn' | 'bad' | 'info';
  s: string;
}

export interface PrevPeriod {
  pq: number;
  vq: number;
  mq: number;
  f: number;
  g: number;
  q: number;
  avgP: number;
}
