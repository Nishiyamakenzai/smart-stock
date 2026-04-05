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
}

export interface FixedCosts {
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
}

export type MonthlyFixed = Record<number, FixedCosts>;

export interface AnnualBudget {
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
}

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
