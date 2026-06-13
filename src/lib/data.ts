import type {
  Project, MonthlyFixed, AnnualBudget, Targets, BSData, PrevPeriod,
  VBreak, FixedCosts, F1Items, F2Items, F3Items, F4Items, F5Items,
  Municipality, ShareRateState, PromoBudgetItem, PromoPlanData,
} from "./types";

// ── デフォルト値ファクトリ ─────────────────────────────────────
export const newV = () => ({
  scaffold:0, paint:0, sub:0, material:0, fee:0, fixRoy:0, varRoy:0, other:0
});

export const defaultF1 = (): F1Items => ({ exec:0, salary:0, bonus:0, social:0, welfare:0 });
export const defaultF2 = (): F2Items => ({ rent:0, repair:0, fuel:0 });
export const defaultF3 = (): F3Items => ({
  adWeb:0, adFlyer:0, adPortal:0, adSign:0, adYoutube:0,
  system:0, telecom:0, travel:0, training:0, supplies:0, other:0
});
export const defaultF4 = (): F4Items => ({ interest:0 });
export const defaultF5 = (): F5Items => ({ insurance:0, advisor:0, membership:0, misc:0 });
export const defaultFixedCosts = (): FixedCosts => ({
  f1: defaultF1(), f2: defaultF2(), f3: defaultF3(), f4: defaultF4(), f5: defaultF5()
});

// ── 合計計算 ──────────────────────────────────────────────────
export const totalV = (v: VBreak): number =>
  v.scaffold + v.paint + v.sub + v.material + v.fee + v.fixRoy + v.varRoy + v.other;

const sumObj = (obj: object): number =>
  Object.values(obj).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);

export const totalF = (f: FixedCosts): number =>
  sumObj(f.f1) + sumObj(f.f2) + sumObj(f.f3) + sumObj(f.f4) + sumObj(f.f5);

// ── 旧データ（number型）→ 新データ（object型）マイグレーション ──
export function migrateFixedCosts(raw: unknown): FixedCosts {
  if (!raw || typeof raw !== "object") return defaultFixedCosts();
  const f = raw as Record<string, unknown>;
  if (typeof f.f1 === "object" && f.f1 !== null) return raw as FixedCosts;
  // 旧形式: {f1:人件費, f2:経費, f3:金利, f4:戦略費, f5:償却費}
  // → 新形式: f3=戦略費, f4=金利 (入れ替え)
  const old1 = Number(f.f1) || 0; // 旧 人件費 → 新 F1
  const old2 = Number(f.f2) || 0; // 旧 経費   → 新 F2
  const old3 = Number(f.f3) || 0; // 旧 金利   → 新 F4.interest
  const old4 = Number(f.f4) || 0; // 旧 戦略費 → 新 F3.other
  const old5 = Number(f.f5) || 0; // 旧 償却費 → 新 F5.insurance
  return {
    f1: { exec:old1, salary:0, bonus:0, social:0, welfare:0 },
    f2: { rent:old2, repair:0, fuel:0 },
    f3: { adWeb:0, adFlyer:0, adPortal:0, adSign:0, adYoutube:0, system:0, telecom:0, travel:0, training:0, supplies:0, other:old4 },
    f4: { interest:old3 },
    f5: { insurance:old5, advisor:0, membership:0, misc:0 },
  };
}

export function migrateMF(raw: unknown): MonthlyFixed {
  if (!raw || typeof raw !== "object") return DEMO_MF;
  const result: MonthlyFixed = {};
  for (let i = 0; i < 12; i++) {
    const entry = (raw as Record<string, unknown>)[String(i)];
    result[i] = migrateFixedCosts(entry ?? {});
  }
  return result;
}

export function migrateAB(raw: unknown): AnnualBudget {
  if (!raw || typeof raw !== "object") return DEFAULT_AB;
  const f = raw as Record<string, unknown>;
  if (typeof f.f1 === "object" && f.f1 !== null) return raw as AnnualBudget;
  const old1 = Number(f.f1) || 0;
  const old2 = Number(f.f2) || 0;
  const old3 = Number(f.f3) || 0;
  const old4 = Number(f.f4) || 0;
  const old5 = Number(f.f5) || 0;
  return {
    f1: { exec:old1, salary:0, bonus:0, social:0, welfare:0 },
    f2: { rent:old2, repair:0, fuel:0 },
    f3: { adWeb:0, adFlyer:0, adPortal:0, adSign:0, adYoutube:0, system:0, telecom:0, travel:0, training:0, supplies:0, other:old4 },
    f4: { interest:old3 },
    f5: { insurance:old5, advisor:0, membership:0, misc:0 },
  };
}

// ── デモデータ ──────────────────────────────────────────────
export const DEMO_PROJECTS: Project[] = [
  {id:1,name:"田中邸 外壁塗装",month:4,p:210,v:{scaffold:25,paint:45,sub:10,material:15,fee:3,fixRoy:4,varRoy:3,other:0},status:"完了"},
  {id:2,name:"佐藤邸 屋根外壁",month:4,p:280,v:{scaffold:35,paint:55,sub:15,material:22,fee:4,fixRoy:4,varRoy:5,other:0},status:"完了"},
  {id:3,name:"山田邸 外壁塗装",month:5,p:180,v:{scaffold:22,paint:38,sub:8,material:14,fee:3,fixRoy:4,varRoy:3,other:3},status:"完了"},
  {id:4,name:"鈴木邸 屋根塗装",month:5,p:150,v:{scaffold:18,paint:30,sub:6,material:12,fee:2,fixRoy:4,varRoy:2,other:4},status:"完了"},
  {id:5,name:"高橋邸 外壁塗装",month:5,p:195,v:{scaffold:24,paint:42,sub:9,material:15,fee:3,fixRoy:4,varRoy:3,other:0},status:"完了"},
  {id:6,name:"伊藤邸 シーリング",month:6,p:220,v:{scaffold:28,paint:46,sub:12,material:16,fee:3,fixRoy:4,varRoy:4,other:0},status:"完了"},
  {id:7,name:"渡辺邸 屋根外壁",month:6,p:310,v:{scaffold:40,paint:60,sub:18,material:25,fee:5,fixRoy:4,varRoy:5,other:0},status:"完了"},
  {id:8,name:"中村邸 外壁塗装",month:7,p:190,v:{scaffold:23,paint:40,sub:9,material:15,fee:3,fixRoy:4,varRoy:3,other:1},status:"完了"},
  {id:9,name:"小林邸 屋根塗装",month:7,p:170,v:{scaffold:20,paint:36,sub:7,material:13,fee:2,fixRoy:4,varRoy:3,other:3},status:"完了"},
  {id:10,name:"加藤邸 外壁塗装",month:7,p:200,v:{scaffold:24,paint:42,sub:10,material:15,fee:3,fixRoy:4,varRoy:3,other:1},status:"完了"},
  {id:11,name:"吉田邸 大規模改修",month:8,p:350,v:{scaffold:45,paint:70,sub:22,material:28,fee:6,fixRoy:4,varRoy:6,other:0},status:"完了"},
  {id:12,name:"松本邸 外壁塗装",month:8,p:185,v:{scaffold:22,paint:40,sub:8,material:14,fee:3,fixRoy:4,varRoy:3,other:1},status:"完了"},
  {id:13,name:"井上邸 屋根外壁",month:9,p:240,v:{scaffold:30,paint:50,sub:13,material:18,fee:4,fixRoy:4,varRoy:4,other:2},status:"完了"},
  {id:14,name:"木村邸 外壁塗装",month:9,p:195,v:{scaffold:24,paint:42,sub:9,material:15,fee:3,fixRoy:4,varRoy:3,other:0},status:"施工中"},
  {id:15,name:"林邸 シーリング",month:10,p:175,v:{scaffold:20,paint:38,sub:8,material:13,fee:2,fixRoy:4,varRoy:3,other:2},status:"施工中"},
  {id:16,name:"清水邸 屋根塗装",month:10,p:160,v:{scaffold:18,paint:34,sub:7,material:12,fee:2,fixRoy:4,varRoy:3,other:2},status:"契約済"},
  {id:17,name:"山口邸 外壁塗装",month:11,p:205,v:{scaffold:25,paint:44,sub:10,material:16,fee:3,fixRoy:4,varRoy:3,other:0},status:"契約済"},
  {id:18,name:"藤原邸 外壁塗装",month:0,p:165,v:{scaffold:20,paint:35,sub:7,material:12,fee:2,fixRoy:4,varRoy:2,other:2},status:"完了"},
  {id:19,name:"岡田邸 屋根補修",month:1,p:120,v:{scaffold:14,paint:25,sub:5,material:9,fee:2,fixRoy:4,varRoy:2,other:1},status:"完了"},
];

export const DEMO_MF: MonthlyFixed = (() => {
  const m: MonthlyFixed = {};
  for (let i = 0; i < 12; i++) m[i] = {
    f1: { exec:50, salary:40, bonus:10, social:15, welfare:5 },          // 計120万
    f2: { rent:30, repair:10, fuel:5 },                                  // 計45万
    f3: { adWeb:8, adFlyer:5, adPortal:10, adSign:3, adYoutube:2,        // 計35万
          system:3, telecom:1, travel:1, training:1, supplies:1, other:0 },
    f4: { interest:8 },                                                   // 計8万
    f5: { insurance:5, advisor:4, membership:2, misc:1 },                 // 計12万
  };
  return m;
})();

export const DEFAULT_AB: AnnualBudget = {
  f1: { exec:600, salary:480, bonus:120, social:180, welfare:60 },        // 計1440万
  f2: { rent:360, repair:120, fuel:60 },                                  // 計540万
  f3: { adWeb:96, adFlyer:60, adPortal:120, adSign:36, adYoutube:24,      // 計420万
        system:36, telecom:12, travel:12, training:12, supplies:12, other:0 },
  f4: { interest:96 },                                                    // 計96万
  f5: { insurance:60, advisor:48, membership:24, misc:12 },               // 計144万
};

export const DEFAULT_TARGETS: Targets = {pq:12000, mq:5760, g:1500, q:80, avgP:190, mRate:48};

export const DEFAULT_BS: BSData = {
  cash:800, receivable:350, inventory:50, fixedAsset:400, otherAsset:100,
  payable:200, shortLoan:300, longLoan:700, otherDebt:50
};

export const PREV: PrevPeriod = {pq:8500, vq:4420, mq:4080, f:2640, g:1440, q:48, avgP:177};
export const PREV2: PrevPeriod = {pq:6200, vq:3350, mq:2850, f:2200, g:650, q:38, avgP:163};

// 山梨県全市町村 戸建て数データ（出典: ポスティング日本 / 住宅・土地統計調査）
export const YAMANASHI_MUNICIPALITIES: Municipality[] = [
  // 市
  { id: "kofu",           name: "甲府市",       homes: 48977 },
  { id: "fujiyoshida",    name: "富士吉田市",    homes: 13379 },
  { id: "tsuru",          name: "都留市",        homes:  8285 },
  { id: "yamanashi",      name: "山梨市",        homes: 10666 },
  { id: "otsuki",         name: "大月市",        homes:  7885 },
  { id: "nirasaki",       name: "韮崎市",        homes:  8565 },
  { id: "minami-alps",    name: "南アルプス市",  homes: 21312 },
  { id: "hokuto",         name: "北杜市",        homes: 16136 },
  { id: "kai",            name: "甲斐市",        homes: 21854 },
  { id: "fuefuki",        name: "笛吹市",        homes: 19908 },
  { id: "uenohara",       name: "上野原市",      homes:  7775 },
  { id: "koshu",          name: "甲州市",        homes:  9601 },
  { id: "chuo",           name: "中央市",        homes:  8768 },
  // 町
  { id: "ichikawamisato", name: "市川三郷町",    homes:  5099 },
  { id: "hayakawa",       name: "早川町",        homes:   410 },
  { id: "minobu",         name: "身延町",        homes:  3983 },
  { id: "nanbu",          name: "南部町",        homes:  2576 },
  { id: "fujikawa",       name: "富士川町",      homes:  4494 },
  { id: "showa",          name: "昭和町",        homes:  4732 },
  { id: "nishikatsura",   name: "西桂町",        homes:  1269 },
  { id: "fujikawaguchiko",name: "富士河口湖町",  homes:  7350 },
  // 村
  { id: "doushi",         name: "道志村",        homes:   565 },
  { id: "oshino",         name: "忍野村",        homes:  1800 },
  { id: "yamanakako",     name: "山中湖村",      homes:  1527 },
  { id: "narusawa",       name: "鳴沢村",        homes:   988 },
  { id: "kosuge",         name: "小菅村",        homes:   298 },
  { id: "tabayama",       name: "丹波山村",      homes:   223 },
];

export const DEFAULT_SHARE_RATE: ShareRateState = {
  favorites: ["fujiyoshida", "fujikawaguchiko", "tsuru"],
};

export const defaultMF = (base?: Partial<MonthlyFixed>): MonthlyFixed => {
  const m: MonthlyFixed = {};
  for (let i = 0; i < 12; i++) m[i] = base?.[i] ?? defaultFixedCosts();
  return m;
};

// ── 販促計画デフォルト値 ───────────────────────────────────────
export const defaultPromoBudgetItem = (): PromoBudgetItem => ({
  adWeb: 0, adFlyer: 0, adPortal: 0, adSign: 0, adYoutube: 0, event: 0, other: 0,
});

export const DEFAULT_PROMO_PLAN: PromoPlanData = {
  monthly: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i, defaultPromoBudgetItem()])
  ),
  annualTarget: 0,
};
