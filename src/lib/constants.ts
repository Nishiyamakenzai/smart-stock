// 期首12月〜決算11月の月配列
export const MS = ["12月","1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月"];

// 変動費キー・ラベル
export const VK = ["scaffold","paint","sub","material","fee","fixRoy","varRoy","other"] as const;
export type VKey = typeof VK[number];
export const VL: Record<string, string> = {
  scaffold:"足場代", paint:"塗装工事", sub:"その他外注", material:"材料代",
  fee:"手数料", fixRoy:"固定ロイ", varRoy:"変動ロイ", other:"その他"
};

// 固定費キー・ラベル
export const FK = ["f1","f2","f3","f4","f5"] as const;
export type FKey = typeof FK[number];
export const FL: Record<string, string> = {
  f1:"F1 人件費", f2:"F2 経費", f3:"F3 金利", f4:"F4 戦略費", f5:"F5 償却費"
};

// ステータスカラー（ライトテーマ）
export const STC: Record<string, string> = {
  "見積中":"#64748b", "契約済":"#3b82f6", "施工中":"#f59e0b", "完了":"#10b981"
};
export const STCBG: Record<string, string> = {
  "見積中":"#f1f5f9", "契約済":"#eff6ff", "施工中":"#fffbeb", "完了":"#ecfdf5"
};

// ライトテーマ カラーパレット
export const C = {
  bg:          "#f0f4f8",
  card:        "#ffffff",
  card2:       "#f8fafc",
  card3:       "#f1f5f9",
  bdr:         "#e2e8f0",
  bdr2:        "#cbd5e1",

  blue:        "#3b82f6",
  blueDark:    "#1d4ed8",
  blueLight:   "#eff6ff",
  purple:      "#8b5cf6",
  purpleLight: "#f5f3ff",
  green:       "#10b981",
  greenDark:   "#059669",
  greenLight:  "#ecfdf5",
  red:         "#ef4444",
  redLight:    "#fef2f2",
  yellow:      "#f59e0b",
  yellowLight: "#fffbeb",
  cyan:        "#06b6d4",
  cyanLight:   "#ecfeff",
  orange:      "#f97316",
  orangeLight: "#fff7ed",

  t1: "#0f172a",
  t2: "#475569",
  t3: "#94a3b8",
  t4: "#cbd5e1",
  wh: "#ffffff",

  gradBlue:   "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  gradPurple: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  gradGreen:  "linear-gradient(135deg, #10b981, #059669)",
  gradAmber:  "linear-gradient(135deg, #f59e0b, #d97706)",
  gradRed:    "linear-gradient(135deg, #ef4444, #dc2626)",
  gradHeader: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
} as const;

export const CHART_COLORS = {
  pq:    "#3b82f6",
  mq:    "#10b981",
  f:     "#f59e0b",
  g:     "#8b5cf6",
  vq:    "#ef4444",
  cumMQ: "#3b82f6",
  cumF:  "#ef4444",
};

export const VK_COLORS: Record<string, string> = {
  scaffold: "#3b82f6", paint: "#10b981", sub: "#8b5cf6",
  material: "#f59e0b", fee:  "#ef4444", fixRoy: "#06b6d4",
  varRoy:   "#f97316", other: "#94a3b8",
};
