"use client";
import React, { useState, useMemo, useRef, type CSSProperties } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { C, MS } from "@/lib/constants";
import { fmt1, fmtPct } from "@/lib/utils";
import { defaultPromoBudgetItem } from "@/lib/data";
import type { MonthlyFixed, PromoPlanData, PromoBudgetItem, Targets } from "@/lib/types";

// ── カテゴリ定義（F3との対応キー付き） ───────────────────────
const CATS = [
  { key: "adWeb",     label: "ウェブ広告",     shortLabel: "WEB",     color: "#3b82f6", f3Key: "adWeb"     },
  { key: "adFlyer",   label: "チラシ・DM",     shortLabel: "チラシ",  color: "#10b981", f3Key: "adFlyer"   },
  { key: "adPortal",  label: "ポータルサイト",  shortLabel: "ポータル",color: "#8b5cf6", f3Key: "adPortal"  },
  { key: "adSign",    label: "看板・広報",      shortLabel: "看板",    color: "#f59e0b", f3Key: "adSign"    },
  { key: "adYoutube", label: "YouTube・SNS",   shortLabel: "動画",    color: "#ef4444", f3Key: "adYoutube" },
  { key: "event",     label: "イベント・展示",  shortLabel: "イベント",color: "#06b6d4", f3Key: null        },
  { key: "other",     label: "その他販促",      shortLabel: "その他",  color: "#94a3b8", f3Key: "other"     },
] as const;

type CatKey = typeof CATS[number]["key"];
type ViewMode = "grid" | "chart";
type InputMode = "monthly" | "annual";

interface Props {
  plan: PromoPlanData;
  mf: MonthlyFixed;
  targets: Targets;
  onChange: (plan: PromoPlanData) => void;
}

// ── ユーティリティ ────────────────────────────────────────────
const pct = (v: number): string => fmtPct(v);

const BudgetBar = ({ value, max, color, label, sublabel, editable, onEdit }: {
  value: number; max: number; color: string; label: string;
  sublabel?: string; editable?: boolean; onEdit?: () => void;
}) => {
  const w = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {sublabel && <span style={{ fontSize: 10, color: C.t3 }}>{sublabel}</span>}
          <span style={{ fontSize: 14, fontWeight: 800, color }}>
            {fmt1(value)}<span style={{ fontSize: 11, fontWeight: 600 }}>万</span>
          </span>
          {editable && (
            <button onClick={onEdit} style={{
              background: "none", border: `1px solid ${C.bdr2}`, borderRadius: 5,
              padding: "1px 6px", fontSize: 10, color: C.blue, cursor: "pointer", fontWeight: 600,
            }}>編集</button>
          )}
        </div>
      </div>
      <div style={{ height: 12, borderRadius: 99, background: C.bdr, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99, width: `${w}%`,
          background: color, transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 10, color: C.t3, marginTop: 2 }}>
        {max > 0 ? pct(w) : "—"}%
      </div>
    </div>
  );
};

export default function PromoPlanTab({ plan, targets, onChange }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [inputMode, setInputMode] = useState<InputMode>("monthly");
  const [annualDraft, setAnnualDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(CATS.map(c => [c.key, ""]))
  );
  const [editCell, setEditCell] = useState<{ month: number; cat: CatKey } | null>(null);
  const [editVal, setEditVal] = useState("");
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  // ── ヘルパー ─────────────────────────────────────────────────
  const getBudget = (month: number, cat: CatKey): number =>
    plan.monthly[month]?.[cat as keyof PromoBudgetItem] ?? 0;

  const updatePlan = (patch: Partial<PromoPlanData>) =>
    onChange({ ...plan, ...patch });

  const updateBudget = (month: number, cat: CatKey, val: number) =>
    updatePlan({
      monthly: {
        ...plan.monthly,
        [month]: { ...(plan.monthly[month] ?? defaultPromoBudgetItem()), [cat]: val },
      },
    });

  // 一括按分
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
    updatePlan({ monthly: newMonthly });
  };

  // ── 集計 ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const catTotal: Record<string, number> = {};
    const monthlyTotal: number[] = Array(12).fill(0);
    CATS.forEach(c => { catTotal[c.key] = 0; });
    for (let m = 0; m < 12; m++) {
      CATS.forEach(c => {
        const b = getBudget(m, c.key as CatKey);
        catTotal[c.key] += b;
        monthlyTotal[m] += b;
      });
    }
    const total = Object.values(catTotal).reduce((a, b) => a + b, 0);
    return { catTotal, monthlyTotal, total };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // ── 適正予算計算 ─────────────────────────────────────────────
  const recommended = Math.round(targets.pq * 0.08);        // 売上目標の8%
  const annualTarget = plan.annualTarget ?? 0;               // ユーザー設定
  const currentTotal = stats.total;                          // 現在の計画
  const budgetMax = Math.max(recommended, annualTarget, currentTotal, 1);

  // 評価メッセージ
  const evalRate = recommended > 0 ? (currentTotal / recommended) * 100 : 0;
  const evalMsg = evalRate >= 90
    ? { text: `推奨予算の${pct(evalRate)}% — 適正範囲内です`, color: C.green, bg: C.greenLight }
    : evalRate >= 50
    ? { text: `推奨予算の${pct(evalRate)}% — あと${fmt1(recommended - currentTotal)}万の増額を検討`, color: C.yellow, bg: C.yellowLight }
    : recommended === 0
    ? { text: "売上目標を設定すると推奨予算が表示されます", color: C.t3, bg: C.card2 }
    : { text: `推奨予算の${pct(evalRate)}% — 販促予算が大幅に不足しています`, color: C.red, bg: C.redLight };

  // ── グラフ用データ ────────────────────────────────────────────
  const chartMonthly = MS.map((label, i) => ({
    name: label.replace("月", ""),
    計画: stats.monthlyTotal[i],
  }));
  const chartCat = CATS
    .filter(c => stats.catTotal[c.key] > 0)
    .map(c => ({ name: c.shortLabel, value: stats.catTotal[c.key], color: c.color }));
  const recommendedPerMonth = recommended > 0 ? Math.round(recommended / 12) : 0;

  // ── インライン編集 ────────────────────────────────────────────
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

  // ── 年間目標予算の編集 ────────────────────────────────────────
  const startTargetEdit = () => {
    setTargetDraft(String(annualTarget || ""));
    setEditingTarget(true);
    setTimeout(() => targetInputRef.current?.select(), 30);
  };
  const commitTargetEdit = () => {
    updatePlan({ annualTarget: parseFloat(targetDraft) || 0 });
    setEditingTarget(false);
  };

  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── F3連動バナー ─────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px", marginBottom: 14, borderRadius: 10,
        background: "#ecfdf5", border: `1px solid #6ee7b7`,
      }}>
        <span style={{ fontSize: 16 }}>🔗</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46" }}>
            F3 戦略費と自動連動中
          </div>
          <div style={{ fontSize: 10, color: "#059669" }}>
            ここで入力した広告費は固定費F3（戦略費）にリアルタイムで反映されます
          </div>
        </div>
      </div>

      {/* ── 適正予算ガイド ───────────────────────────── */}
      <div style={{
        background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`,
        padding: "16px", marginBottom: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>適正予算ガイド</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>売上目標 PQ</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>
              {fmt1(targets.pq)}<span style={{ fontSize: 11 }}>万</span>
            </div>
          </div>
        </div>

        <BudgetBar
          label="推奨予算（売上目標の8%）"
          sublabel="= PQ × 8%"
          value={recommended}
          max={budgetMax}
          color={C.green}
        />
        <BudgetBar
          label="年間目標予算"
          sublabel="自由設定"
          value={annualTarget}
          max={budgetMax}
          color={C.blue}
          editable
          onEdit={startTargetEdit}
        />
        {editingTarget && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -6, marginBottom: 10 }}>
            <input
              ref={targetInputRef}
              type="text"
              inputMode="decimal"
              value={targetDraft}
              autoFocus
              placeholder="例: 600"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetDraft(e.target.value)}
              onBlur={commitTargetEdit}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") commitTargetEdit();
                if (e.key === "Escape") setEditingTarget(false);
              }}
              className="input-base"
              style={{ flex: 1, fontSize: 15, fontWeight: 700, textAlign: "right" }}
            />
            <span style={{ fontSize: 12, color: C.t3, fontWeight: 600 }}>万/年</span>
            <button
              onClick={commitTargetEdit}
              style={{
                padding: "6px 14px", background: C.blue, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >確定</button>
          </div>
        )}
        <BudgetBar
          label="現在の計画合計"
          sublabel="月次入力の合計"
          value={currentTotal}
          max={budgetMax}
          color={C.purple}
        />

        {/* 評価メッセージ */}
        <div style={{
          marginTop: 12, padding: "9px 12px", borderRadius: 9,
          background: evalMsg.bg, fontSize: 12, fontWeight: 700,
          color: evalMsg.color, display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>{evalRate >= 90 ? "✅" : evalRate >= 50 ? "⚠️" : recommended === 0 ? "ℹ️" : "🔴"}</span>
          <span>{evalMsg.text}</span>
        </div>
      </div>

      {/* ── モード切替バー ───────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
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
              {m === "monthly" ? "月次個別入力" : "年間→12ヶ月按分"}
            </button>
          ))}
        </div>
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

      {/* ── 年間按分入力モード ───────────────────────── */}
      {inputMode === "annual" && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.blueLight }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>年間予算を入力 → 12ヶ月に均等按分</div>
            <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>
              「按分適用」でグリッドの全月に反映 → F3にも即時連動
            </div>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {CATS.map(c => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, flex: "0 0 130px" }}>{c.label}</span>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="text" inputMode="decimal"
                    value={annualDraft[c.key]}
                    placeholder={stats.catTotal[c.key] > 0 ? String(stats.catTotal[c.key]) : "例: 120"}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAnnualDraft((prev: Record<string, string>) => ({ ...prev, [c.key]: e.target.value }))
                    }
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
            {/* 合計プレビュー */}
            {(() => {
              const draftTotal = CATS.reduce((s, c) => {
                const v = parseFloat(annualDraft[c.key]);
                return s + (isNaN(v) ? 0 : v);
              }, 0);
              return draftTotal > 0 ? (
                <div style={{
                  marginBottom: 10, padding: "8px 12px", borderRadius: 8,
                  background: C.blueLight, fontSize: 12, color: C.blue, fontWeight: 600,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span>合計</span>
                  <span>{fmt1(draftTotal)}万/年 → {fmt1(Math.round(draftTotal / 12))}万/月</span>
                </div>
              ) : null;
            })()}
            <button onClick={applyAnnual} style={{
              width: "100%", marginTop: 4, padding: "11px", border: "none",
              borderRadius: 10, background: C.blue, color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              全月に均等按分して適用（F3にも反映）
            </button>
          </div>
        </div>
      )}

      {/* ── グリッドビュー ────────────────────────────── */}
      {viewMode === "grid" && inputMode === "monthly" && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.bdr}`, background: C.card2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>月別販促予算グリッド</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>数字をタップして編集 — 入力値は即座にF3へ反映</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.t3 }}>年間合計</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>{fmt1(currentTotal)}万</div>
            </div>
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ borderCollapse: "collapse", minWidth: 820, width: "100%" }}>
              <thead>
                <tr style={{ background: C.card3 }}>
                  <th style={{
                    position: "sticky", left: 0, zIndex: 10, background: C.card3,
                    padding: "8px 12px", fontSize: 11, fontWeight: 700, color: C.t2,
                    textAlign: "left", whiteSpace: "nowrap",
                    borderRight: `2px solid ${C.bdr2}`, minWidth: 115,
                  }}>カテゴリ</th>
                  {MS.map((m, i) => (
                    <th key={i} style={{
                      padding: "8px 4px", fontSize: 11, fontWeight: 700, color: C.t2,
                      textAlign: "center", whiteSpace: "nowrap", minWidth: 58,
                      borderRight: `1px solid ${C.bdr}`,
                    }}>{m}</th>
                  ))}
                  <th style={{
                    padding: "8px 10px", fontSize: 11, fontWeight: 700, color: C.blue,
                    textAlign: "right", whiteSpace: "nowrap", minWidth: 70,
                    borderLeft: `2px solid ${C.bdr2}`, background: C.blueLight,
                  }}>年間計</th>
                </tr>
              </thead>
              <tbody>
                {CATS.map((cat, ri) => (
                  <tr key={cat.key} style={{ borderTop: `1px solid ${C.bdr}` }}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 9,
                      background: ri % 2 === 0 ? "#fff" : C.card2,
                      padding: "6px 12px", borderRight: `2px solid ${C.bdr2}`, whiteSpace: "nowrap",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{cat.label}</span>
                      </div>
                    </td>
                    {Array.from({ length: 12 }, (_, mi) => {
                      const v = getBudget(mi, cat.key as CatKey);
                      const isEditing = editCell?.month === mi && editCell?.cat === cat.key;
                      return (
                        <td key={mi} style={{
                          padding: "4px 3px", textAlign: "center",
                          borderRight: `1px solid ${C.bdr}`,
                          background: ri % 2 === 0 ? "#fff" : C.card2,
                        }}>
                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type="text" inputMode="decimal"
                              value={editVal} autoFocus
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditVal(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === "Enter") commitEdit();
                                if (e.key === "Escape") setEditCell(null);
                              }}
                              style={{
                                width: 48, fontSize: 12, fontWeight: 700, textAlign: "center",
                                border: `1.5px solid ${cat.color}`, borderRadius: 5,
                                padding: "2px 3px", outline: "none", background: "#fff", color: C.t1,
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(mi, cat.key as CatKey)}
                              style={{ display: "block", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 2px" }}
                            >
                              <span style={{ fontSize: 13, fontWeight: v > 0 ? 700 : 400, color: v > 0 ? C.t1 : C.t4 }}>
                                {v > 0 ? fmt1(v) : "—"}
                              </span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td style={{
                      padding: "6px 10px", background: C.blueLight,
                      borderLeft: `2px solid ${C.bdr2}`, textAlign: "right",
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.blue }}>
                        {fmt1(stats.catTotal[cat.key])}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* 月計フッター */}
                <tr style={{ background: C.card3, borderTop: `2px solid ${C.bdr2}` }}>
                  <td style={{
                    position: "sticky", left: 0, zIndex: 9, background: C.card3,
                    padding: "8px 12px", fontSize: 11, fontWeight: 700, color: C.t2,
                    borderRight: `2px solid ${C.bdr2}`,
                  }}>月 計</td>
                  {stats.monthlyTotal.map((v, mi) => {
                    const overTarget = annualTarget > 0 && v > Math.round(annualTarget / 12) * 1.2;
                    return (
                      <td key={mi} style={{ padding: "6px 3px", textAlign: "center", borderRight: `1px solid ${C.bdr}` }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: overTarget ? C.red : C.t1 }}>
                          {fmt1(v)}
                        </span>
                      </td>
                    );
                  })}
                  <td style={{ padding: "8px 10px", textAlign: "right", background: "#dbeafe", borderLeft: `2px solid ${C.bdr2}` }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.blueDark }}>{fmt1(currentTotal)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── グラフビュー ─────────────────────────────── */}
      {viewMode === "chart" && (
        <>
          {/* 月次計画 + 推奨月額ライン */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, padding: "16px 12px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>月次計画（万円）</div>
              {recommendedPerMonth > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.green }}>
                  <div style={{ width: 20, height: 2, background: C.green, borderTop: "2px dashed" }} />
                  <span>推奨月額 {fmt1(recommendedPerMonth)}万</span>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartMonthly} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.bdr} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.t2 }} />
                <YAxis tick={{ fontSize: 10, fill: C.t2 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${C.bdr}` }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${fmt1(Number(v ?? 0))}万`, "計画"]}
                />
                <Bar dataKey="計画" fill={C.purple} radius={[4, 4, 0, 0]} />
                {recommendedPerMonth > 0 && (
                  <ReferenceLine
                    y={recommendedPerMonth}
                    stroke={C.green}
                    strokeDasharray="5 3"
                    strokeWidth={2}
                    label={{ value: `推奨${fmt1(recommendedPerMonth)}万`, fill: C.green, fontSize: 9, position: "insideTopRight" }}
                  />
                )}
                {annualTarget > 0 && Math.round(annualTarget / 12) !== recommendedPerMonth && (
                  <ReferenceLine
                    y={Math.round(annualTarget / 12)}
                    stroke={C.blue}
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{ value: `目標${fmt1(Math.round(annualTarget / 12))}万`, fill: C.blue, fontSize: 9, position: "insideTopLeft" }}
                  />
                )}
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
                    data={chartCat} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={2} dataKey="value" nameKey="name"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={({ name, percent }: any) => name && percent != null ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                    labelLine={false}
                  >
                    {chartCat.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${C.bdr}` }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${fmt1(Number(v ?? 0))}万`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* カテゴリ別 推奨比率 */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.bdr}`, padding: "16px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 4 }}>カテゴリ別 年間計画</div>
            <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>
              推奨合計 {fmt1(recommended)}万に対する各カテゴリの比率
            </div>
            {CATS.map(c => {
              const v = stats.catTotal[c.key];
              const recShare = recommended > 0 ? (v / recommended) * 100 : 0;
              if (v === 0) return null;
              return (
                <div key={c.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{c.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.t2 }}>{fmt1(v)}万</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: C.bdr, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      width: `${Math.min(recShare, 100)}%`,
                      background: c.color, transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Coatex連携メモ ───────────────────────────── */}
      <div style={{
        padding: "10px 14px", borderRadius: 10,
        background: "#fffbeb", border: `1px dashed ${C.yellow}`,
        fontSize: 11, color: "#92400e",
      }}>
        <span style={{ fontWeight: 700 }}>将来の連携予定：</span>
        Coatex（コアテックス）の固定費→販促費と自動連動させる予定です。
        連携後は販促実績がリアルタイムで反映され、さらに正確な管理が可能になります。
      </div>
    </div>
  );
}
