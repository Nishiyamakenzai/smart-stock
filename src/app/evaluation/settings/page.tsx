"use client";
import { useEffect, useState } from "react";
import type { EvaluationSettings } from "@/lib/evaluation-types";
import { DEFAULT_EVALUATION_SETTINGS, MAX_SCORE, CRITERIA } from "@/lib/evaluation-constants";

export default function EvaluationSettingsPage() {
  const [settings, setSettings] = useState<EvaluationSettings>(DEFAULT_EVALUATION_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evaluation/settings").then((r) => r.json()).then((d) => { setSettings(d); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaved(false);
    const res = await fetch("/api/evaluation/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) setSaved(true);
  };

  if (loading) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>;

  const inconsistent = settings.perPeriodMin * 2 > settings.halfYearMin;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>昇給・昇格 判定基準</h1>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7, marginBottom: 14 }}>
          評価項目は{CRITERIA.length}項目（品質・スピード・知識・規律性・協調性・責任感・積極性・信頼性）＋姿勢のルール（減点のみ）。
          1回の評価の満点は <b>{MAX_SCORE}点</b>（全項目S評価の場合）、基準となる「普通(B)」を全項目で取ると <b>0点</b> です。
        </div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
          1回の評価で必要な最低点
        </label>
        <input
          type="number"
          value={settings.perPeriodMin}
          onChange={(e) => setSettings((s) => ({ ...s, perPeriodMin: Number(e.target.value) }))}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, marginBottom: 14, boxSizing: "border-box" }}
        />

        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
          半年（評価2回分）の合計で必要な最低点
        </label>
        <input
          type="number"
          value={settings.halfYearMin}
          onChange={(e) => setSettings((s) => ({ ...s, halfYearMin: Number(e.target.value) }))}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
        />

        {inconsistent && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#d97706", background: "#fffbeb", padding: 10, borderRadius: 10, lineHeight: 1.6 }}>
            ⚠️ 1回の最低点×2（{settings.perPeriodMin * 2}点）が半年基準（{settings.halfYearMin}点）を上回っています。
            この場合、毎回ちょうど最低点を取り続けても半年基準は満たせてしまい、「1回ごとの最低点」の意味が薄れます。
            意図的な設計であれば問題ありませんが、両基準の整合を取りたい場合は調整してください。
          </div>
        )}

        <button onClick={handleSave} style={{ marginTop: 14, padding: "10px 20px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          保存する
        </button>
        {saved && <span style={{ marginLeft: 10, fontSize: 12, color: "#059669", fontWeight: 700 }}>保存しました ✓</span>}
      </div>

      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: 16, fontSize: 12, color: "#7c2d12", lineHeight: 1.8 }}>
        <b>設計時のアドバイス：</b><br />
        当初案「1回12点以上・半年25点以上」は、満点16点中12点＝平均1.5点/項目を毎回求める水準で、
        S評価（極めて優秀）が本当に稀であるという前提だと、8項目中ほぼ半分をSにしないと届かない計算になり、
        実質的に「昇給できる人がほぼ出ない」基準になりがちです。またちょうど12点を2回取ると合計24点となり半年基準の25点に届かない、
        という整合性の問題もありました。「B(普通)を基準に、A(優秀)を積み重ねれば十分届く」水準（例：1回8点前後・半年16〜18点）から
        始めて、実際の評価運用を数サイクル回してから厳しさを調整していくことをおすすめします。
      </div>
    </div>
  );
}
