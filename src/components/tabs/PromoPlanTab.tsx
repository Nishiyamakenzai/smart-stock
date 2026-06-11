"use client";
import React, { useState, useMemo, useRef, type CSSProperties } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { C, MS } from "@/lib/constants";
import { fmt1 } from "@/lib/utils";
import { defaultPromoBudgetItem } from "@/lib/data";
import type { MonthlyFixed, PromoPlanData, PromoBudgetItem } from "@/lib/types";

// ── カテゴリ定義 ─────────────────────────────────────────────
// f3Key は MonthlyFixed[m].f3 の対応キー（実績取得用）
const CATS = [
  { key: "adWeb",     label: "ウェブ広告",    shortLabel: "WEB",    color: "#3b82f6", f3Key: "adWeb"     },
  { key: "adFlyer",   label: "チラシ・DM",    shortLabel: "チラシ", color: "#10b981", f3Key: "adFlyer"   },
  { key: "adPortal",  label: "ポータルサイト", shortLabel: "ポータル", color: "#8b5cf6", f3Key: "adPortal"  },
  { key: "adSign",    label: "看板・広報",    shortLabel: "看板",   color: "#f59e0b", f3Key: "adSign"    },
  { key: "adYoutube", label: "YouTube・SNS",  shortLabel: "動画",   color: "#ef4444", f3Key: "adYoutube" },
  { key: "event",     label: "イベント・展示", shortLabel: "イベント", color: "#06b6d4", f3Key: null        },
  { key: "other",     label: "その他販促",    shortLabel: "その他", color: "#94a3b8", f3Key: "other"     },
] as const;

type CatKey = typeof CATS[number]["key"];
type ViewMode = "grid" | "chart";
type InputMode = "monthly" | "annual";

interface Props {
  plan: PromoPlanData;
  mf: MonthlyFixed;
  onChange: (plan: PromoPlanData) => void;
}

const cellStyle = (budg: number, actual: number): CSSProperties => {
  if (actual <= 0 && budg <= 0) return {};
  if (actual > budg && budg > 0) return { background: "#fef2f2" };
  if (actual > 0 && actual <= budg) return { background: "#f0fdf4" };
  return {};
};

export default function PromoPlanTab({ plan, mf, onChange }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [inputMode, setInputMode] = useState<InputMode>("monthly");
  // 年間一括入力用の一時ステート
  const [annualDraft, setAnnualDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(CATS.map(c => [c.key, ""]))
  );
  // グリッド内インライン編集
  const [editCell, setEditCell] = useState<{ month: number; cat: CatKey } | null>(null);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ── ヘルパー ────────────────────────────────────────────────
  const getBudget = (month: number, cat: CatKey): number =>
    plan.monthly[month]?.[cat as keyof PromoBudgetItem] ?? 0;

  const getActual = (month: number, cat: CatKey): number => {
    const c = CATS.find(x => x.key === cat);
    if (!c?.f3Key) return 0;
    return ((mf[month]?.f3 ?? {}) as unknown as Record<string, number>)[c.f3Key] ?? 0;
  };

  const updateBudget = (month: number, cat: CatKey, val: number) => {
    onChange({
      monthly: {
        ...plan.monthly,
        [month]: {
          ...(plan.monthly[month] ?? defaultPromoBudgetItem()),
          [cat]: val,
        },
      },
    });
  };

  // 一括按分：年間入力値を12等分して全月に適用
  const applyAnnual = () => {
    const newMonthly: PromoPlanData["monthly"] = {};
    for (let i = 0; i < 12; i++) {
      const base = plan.monthly[i] ?? defaultPromoBudgetItem();
      const updated = { ...base };
      CATS.forEach(c => {
        const v = parseFloat(annualDraft[c.key]);
        if (!isNaN(v)) (updated as Record<string, number>)[c.key] = Math.round(v / 12);
      });
      newMonthly[i] = updated as PromoBudgetItem;
    }
    onChange({ monthly: newMonthly });
  };

  // ── 集計 ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalBudget = 0, totalActual = 0;
    const catBudget: Record<string, number> = {};
    const catActual: Record<string, number> = {};
    const monthlyBudget: number[] = Array(12).fill(0);
    const monthlyActual: number[] = Array(12).fill(0);

    CATS.forEach(c => { catBudget[c.key] = 0; catActual[c.key] = 0; });

    for (let m = 0; m < 12; m++) {
      CATS.forEach(c => {
        const b = getBudget(m, c.key as CatKey);
        const a = getActual(m, c.key as CatKey);
        catBudget[c.key] += b;
        catActual[c.key] += a;
        monthlyBudget[m] += b;
        monthlyActual[m] += a;
        totalBudget += b;
        totalActual += a;
      });
    }

    return { totalBudget, totalActual, catBudget, catActual, monthlyBudget, monthlyActual };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, mf]);

  const remaining = stats.totalBudget - stats.totalActual;
  const achieveRate = stats.totalBudget > 0 ? (stats.totalActual / stats.totalBudget) * 100 : 0;

  const chartMonthly = MS.map((label, i) => ({
    name: label.replace("月", ""),
    予算: stats.monthlyBudget[i],
    実績: stats.monthlyActual[i],
  }));

  const chartCat = CATS
    .filter(c => stats.catBudget[c.key] > 0)
    .map(c => ({ name: c.shortLabel, value: stats.catBudget[c.key], color: c.color }));

  // ── インライン編集ハンドラ ────────────────────────────────────
  const startEdit = (month: number, cat: CatKey) => {
    setEditCell({ month, cat });
    setEditVal(String(getBudget(month, cat) || ""));
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const commitEdit = () => {
    if (!editCell) return;
    updateBudget(editCell.month, editCell.cat, parseFloat(editVal) || 0);
    setEditCell(null);
  };

  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── 年間サマリーカード ──────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "年間予算合計",   value: stats.totalBudget, unit: "万",  color: C.blue,   bg: C.blueLight   },
          { label: "年間実績合計",   value: stats.totalActual, unit: "万",  color: C.purple, bg: C.purpleLight },
          { label: "残予算",        value: remaining,           unit: "万",  color: remaining >= 0 ? C.green : C.red, bg: remaining >= 0 ? C.greenLight : C.redLight },
          { label: "実績率",        value: achieveRate,         unit: "%",   color: achieveRate > 100 ? C.red : C.yellow, bg: C.yellowLight },
        ].map(card => (
          <div key={card.label} style={{
            padding: "14px 16px", borderRadius: 14,
            background: card.bg, border: `1.5px solid ${card.color}30`,
          }}>
            <div style={{ fontSize: 11, color: C.t2, fontWeight: 600, marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>
              {card.unit === "%" ? fmtPct(card.value) : fmt1(card.value)}
              <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 2 }}>{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 年間予算に対する実績の進捗バー */}
      {stats.totalBudget > 0 && (
        <div style={{ marginBottom: 18, padding: "12px 16px", background: C.card, borderRadius: 12, border: `1px solid ${C.bdr}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: C.t2, fontWeight: 600 }}>
            <span>年間進捗</span>
            <span style={{ color: achieveRate > 100 ? C.red : C.blue, fontWeight: 700 }}>
              {fmtPct(achieveRate)}%
            </span>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: C.bdr, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${Math.min(achieveRate, 100)}%`,
              background: achieveRate > 100 ? C.red : achieveRate > 80 ? C.yellow : C.blue,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: C.t3 }}>
            <span>0万</span>
            <span>予算 {fmt1(stats.totalBudget)}万</span>
          </div>
        </div>
      )}

      {/* ── モード切替バー ──────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {/* 入力モード */}
        <div style={{ display: "flex", background: C.card3, borderRadius: 10, padding: 3, flex: 1 }}>
          {(["monthly", "annual"] as InputMode[]).map(m => (
            <button key={m} onClick={() => setInputMode(m)} style={{
              flex: 1, padding: "6px 4px", border: "none", borderRadius: 7,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              background: inputMode === m ? "#fff" : "transparent",
              color: inputMode === m ? C.blue : C.t2,
              boxShadow: inputMode === m ? "0 1px 4px rgba(0,0,0,.08)" : "none",
              transition: "all .15s",
            }}>
              {m === "monthly" ? "月次個別" : "年間→按分"}
            </button>
          ))}
        </div>
        {/* ビューモード */}
        <div style={{ display: "flex", background: C.card3, borderRadius: 10, padding: 3, flex: 1 }}>
          {(["grid", "chart"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              flex: 1, padding: "6px 4px", border: "none", borderRadius: 7,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              background: viewMode === v ? "#fff" : "transparent",
              color: viewMode === v ? C.purple : C.t2,
              boxShadow: viewMode === v ? "0 1px 4px rgba(0,0,0,.08)" : "none",
              transition: "all .15s",
            }}>
              {v === "grid" ? "グリッド" : "グラフ"}
            </button>
          ))}
        </div>
      </div>

      {/* ── 年間按分入力モード ───────────────────────────────── */}
      {inputMode === "annual" && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.blueLight }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>年間予算を入力して12ヶ月に均等按分</div>
            <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>入力後「按分適用」で全月に反映されます</div>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {CATS.map(c => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, flex: "0 0 130px" }}>{c.label}</span>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={annualDraft[c.key]}
                    placeholder={String(CATS.find(x => x.key === c.key) ? (stats.catBudget[c.key] * 12 > 0 ? stats.catBudget[c.key] : "") : "")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnualDraft((prev: Record<string, string>) => ({ ...prev, [c.key]: e.target.value }))}
                    className="input-base"
                    style={{ flex: 1, fontSize: 13, padding: "6px 10px", textAlign: "right" }}
                  />
                  <span style={{ fontSize: 11, color: C.t3, flexShrink: 0 }}>万/年</span>
                </div>
                {annualDraft[c.key] && !isNaN(parseFloat(annualDraft[c.key])) && (
                  <span style={{ fontSize: 10, color: C.blue, fontWeight: 600, flexShrink: 0, minWidth: 60, textAlign: "right" }}>
                    →{Math.round(parseFloat(annualDraft[c.key]) / 12)}万/月
                  </span>
                )}
              </div>
            ))}
            <button
              onClick={applyAnnual}
              style={{
                width: "100%", marginTop: 8, padding: "10px", border: "none",
                borderRadius: 10, background: C.blue, color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              全月に均等按分して適用
            </button>
          </div>
        </div>
      )}

      {/* ── グリッドビュー ───────────────────────────────────── */}
      {viewMode === "grid" && inputMode === "monthly" && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, overflow: "hidden", marginBottom: 14 }}>
          {/* グリッドヘッダー */}
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.card2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>月別販促予算グリッド</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
              数字をタップして編集 ／ 下段（グレー）は月次固定費F3の実績
            </div>
          </div>

          {/* スクロールテーブル */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 820, width: "100%" }}>
              <thead>
                <tr style={{ background: C.card3 }}>
                  {/* 固定列：カテゴリ */}
                  <th style={{
                    position: "sticky", left: 0, zIndex: 10,
                    background: C.card3, padding: "8px 12px",
                    fontSize: 11, fontWeight: 700, color: C.t2,
                    textAlign: "left", whiteSpace: "nowrap",
                    borderRight: `2px solid ${C.bdr2}`,
                    minWidth: 110,
                  }}>カテゴリ</th>
                  {/* 月 */}
                  {MS.map((m, i) => (
                    <th key={i} style={{
                      padding: "8px 6px", fontSize: 11, fontWeight: 700, color: C.t2,
                      textAlign: "center", whiteSpace: "nowrap", minWidth: 62,
                      borderRight: `1px solid ${C.bdr}`,
                    }}>{m}</th>
                  ))}
                  {/* 年間合計 */}
                  <th style={{
                    padding: "8px 10px", fontSize: 11, fontWeight: 700, color: C.blue,
                    textAlign: "right", whiteSpace: "nowrap", minWidth: 72,
                    borderLeft: `2px solid ${C.bdr2}`, background: C.blueLight,
                  }}>年間計</th>
                </tr>
              </thead>
              <tbody>
                {CATS.map((cat, ri) => {
                  const annualB = stats.catBudget[cat.key];
                  const annualA = stats.catActual[cat.key];
                  return (
                    <tr key={cat.key} style={{ borderTop: `1px solid ${C.bdr}` }}>
                      {/* カテゴリ名（固定列） */}
                      <td style={{
                        position: "sticky", left: 0, zIndex: 9,
                        background: ri % 2 === 0 ? "#fff" : C.card2,
                        padding: "6px 12px",
                        borderRight: `2px solid ${C.bdr2}`,
                        whiteSpace: "nowrap",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{cat.label}</span>
                        </div>
                      </td>
                      {/* 月次セル */}
                      {Array.from({ length: 12 }, (_, mi) => {
                        const budg = getBudget(mi, cat.key as CatKey);
                        const actual = getActual(mi, cat.key as CatKey);
                        const isEditing = editCell?.month === mi && editCell?.cat === cat.key;
                        const cs = cellStyle(budg, actual);
                        return (
                          <td key={mi} style={{
                            padding: "4px 4px",
                            textAlign: "center",
                            borderRight: `1px solid ${C.bdr}`,
                            background: ri % 2 === 0 ? (cs.background ?? "#fff") : (cs.background ?? C.card2),
                            verticalAlign: "top",
                          }}>
                            {isEditing ? (
                              <input
                                ref={inputRef}
                                type="text"
                                inputMode="decimal"
                                value={editVal}
                                autoFocus
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditVal(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditCell(null); }}
                                style={{
                                  width: 50, fontSize: 12, fontWeight: 700,
                                  textAlign: "center", border: `1.5px solid ${cat.color}`,
                                  borderRadius: 5, padding: "2px 4px",
                                  outline: "none", background: "#fff",
                                  color: C.t1,
                                }}
                              />
                            ) : (
                              <button
                                onClick={() => startEdit(mi, cat.key as CatKey)}
                                style={{
                                  display: "block", width: "100%",
                                  background: "none", border: "none",
                                  cursor: "pointer", padding: "3px 2px",
                                }}
                              >
                                <span style={{
                                  display: "block", fontSize: 13, fontWeight: 700,
                                  color: budg > 0 ? C.t1 : C.t4,
                                }}>
                                  {budg > 0 ? fmt1(budg) : "—"}
                                </span>
                              </button>
                            )}
                            {/* 実績（グレー小文字） */}
                            {actual > 0 && (
                              <span style={{
                                display: "block", fontSize: 9, color: actual > budg && budg > 0 ? C.red : C.t3,
                                fontWeight: 600, paddingBottom: 2,
                              }}>
                                実{fmt1(actual)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {/* 年間合計列 */}
                      <td style={{
                        padding: "6px 10px",
                        background: C.blueLight,
                        borderLeft: `2px solid ${C.bdr2}`,
                        textAlign: "right",
                        verticalAlign: "top",
                      }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.blue }}>
                          {fmt1(annualB)}
                        </span>
                        {annualA > 0 && (
                          <span style={{
                            display: "block", fontSize: 9,
                            color: annualA > annualB && annualB > 0 ? C.red : C.t3,
                            fontWeight: 600,
                          }}>
                            実{fmt1(annualA)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* 月計フッター行 */}
                <tr style={{ background: C.card3, borderTop: `2px solid ${C.bdr2}` }}>
                  <td style={{
                    position: "sticky", left: 0, zIndex: 9,
                    background: C.card3, padding: "8px 12px",
                    fontSize: 11, fontWeight: 700, color: C.t2,
                    borderRight: `2px solid ${C.bdr2}`,
                  }}>月 計</td>
                  {Array.from({ length: 12 }, (_, mi) => (
                    <td key={mi} style={{
                      padding: "6px 4px", textAlign: "center",
                      borderRight: `1px solid ${C.bdr}`,
                    }}>
                      <span style={{ display: "block", fontSize: 12, fontWeight: 800, color: C.t1 }}>
                        {fmt1(stats.monthlyBudget[mi])}
                      </span>
                      {stats.monthlyActual[mi] > 0 && (
                        <span style={{
                          display: "block", fontSize: 9,
                          color: stats.monthlyActual[mi] > stats.monthlyBudget[mi] && stats.monthlyBudget[mi] > 0
                            ? C.red : C.t3,
                          fontWeight: 600,
                        }}>
                          実{fmt1(stats.monthlyActual[mi])}
                        </span>
                      )}
                    </td>
                  ))}
                  <td style={{
                    padding: "8px 10px", textAlign: "right",
                    background: "#dbeafe", borderLeft: `2px solid ${C.bdr2}`,
                  }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: C.blueDark }}>
                      {fmt1(stats.totalBudget)}
                    </span>
                    {stats.totalActual > 0 && (
                      <span style={{ display: "block", fontSize: 9, color: C.t3, fontWeight: 600 }}>
                        実{fmt1(stats.totalActual)}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── グラフビュー ─────────────────────────────────────── */}
      {viewMode === "chart" && (
        <>
          {/* 月次棒グラフ */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, padding: "16px 12px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 14 }}>月次予算 vs 実績（万円）</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartMonthly} margin={{ top: 0, right: 4, left: -24, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bdr} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.t2 }} />
                <YAxis tick={{ fontSize: 10, fill: C.t2 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${C.bdr}` }}
                  formatter={(v: number) => [`${fmt1(v)}万`, ""]}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="予算" fill={C.blue} radius={[3, 3, 0, 0]} barSize={12} />
                <Bar dataKey="実績" fill={C.purple} radius={[3, 3, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* カテゴリ別ドーナツ */}
          {chartCat.length > 0 && (
            <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, padding: "16px 12px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 14 }}>年間予算カテゴリ内訳</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartCat}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartCat.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${C.bdr}` }}
                    formatter={(v: number) => [`${fmt1(v)}万`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* カテゴリ別進捗バー */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 14 }}>カテゴリ別 年間予算消化率</div>
            {CATS.map(c => {
              const b = stats.catBudget[c.key];
              const a = stats.catActual[c.key];
              if (b === 0 && a === 0) return null;
              const rate = b > 0 ? Math.min((a / b) * 100, 100) : 0;
              const over = b > 0 && a > b;
              return (
                <div key={c.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{c.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.t2, textAlign: "right" }}>
                      {a > 0 && <span style={{ color: over ? C.red : C.t2 }}>実績 {fmt1(a)}万 / </span>}
                      予算 {fmt1(b)}万
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: C.bdr, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      width: `${rate}%`,
                      background: over ? C.red : c.color,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  {over && (
                    <div style={{ fontSize: 10, color: C.red, fontWeight: 600, marginTop: 2 }}>
                      予算超過 +{fmt1(a - b)}万
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Coatex連携メモ ──────────────────────────────────── */}
      <div style={{
        padding: "10px 14px", borderRadius: 10,
        background: "#fffbeb", border: `1px dashed ${C.yellow}`,
        fontSize: 11, color: "#92400e",
      }}>
        <span style={{ fontWeight: 700 }}>将来の連携予定：</span>
        Coatex（コアテックス）の固定費→販促費と自動連動させる予定です。
        連携後は販促実績がリアルタイムで反映されます。
      </div>
    </div>
  );
}

// ── ユーティリティ ────────────────────────────────────────────
function fmtPct(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1);
}
