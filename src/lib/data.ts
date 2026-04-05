import type { Project, MonthlyFixed, AnnualBudget, Targets, BSData, PrevPeriod } from "./types";
import { FK } from "./constants";

export const newV = () => ({
  scaffold:0, paint:0, sub:0, material:0, fee:0, fixRoy:0, varRoy:0, other:0
});

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
  for (let i = 0; i < 12; i++) m[i] = {f1:120,f2:45,f3:8,f4:35,f5:12};
  return m;
})();

export const DEFAULT_AB: AnnualBudget = {f1:1440, f2:540, f3:96, f4:420, f5:144};

export const DEFAULT_TARGETS: Targets = {pq:12000, mq:5760, g:1500, q:80, avgP:190, mRate:48};

export const DEFAULT_BS: BSData = {
  cash:800, receivable:350, inventory:50, fixedAsset:400, otherAsset:100,
  payable:200, shortLoan:300, longLoan:700, otherDebt:50
};

export const PREV: PrevPeriod = {pq:8500, vq:4420, mq:4080, f:2640, g:1440, q:48, avgP:177};
export const PREV2: PrevPeriod = {pq:6200, vq:3350, mq:2850, f:2200, g:650, q:38, avgP:163};

export const defaultMF = (base?: Partial<MonthlyFixed>): MonthlyFixed => {
  const m: MonthlyFixed = {};
  for (let i = 0; i < 12; i++) {
    m[i] = base?.[i] ?? {f1:0,f2:0,f3:0,f4:0,f5:0};
  }
  return m;
};

import type { VBreak, FixedCosts } from "./types";

export const totalV = (v: VBreak): number =>
  v.scaffold + v.paint + v.sub + v.material + v.fee + v.fixRoy + v.varRoy + v.other;

export const totalF = (f: FixedCosts): number =>
  f.f1 + f.f2 + f.f3 + f.f4 + f.f5;
