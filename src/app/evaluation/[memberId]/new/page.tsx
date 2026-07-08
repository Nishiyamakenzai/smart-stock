"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { EmployeeWithProfile, ScoredCriterionKey } from "@/lib/evaluation-types";
import { resolveGrade } from "@/lib/evaluation-data";
import { CRITERIA, computeTotal, getCriteriaForJobType } from "@/lib/evaluation-constants";
import ScorePicker from "@/components/evaluation/ScorePicker";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid #e2e8f0",
  fontSize: 13, boxSizing: "border-box",
};

function defaultQuarter(): { label: string; start: string; end: string } {
  const now = new Date();
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3; // 0,3,6,9
  const start = new Date(now.getFullYear(), qStartMonth, 1);
  const end = new Date(now.getFullYear(), qStartMonth + 3, 0);
  const label = `${start.getFullYear()}年 ${start.getMonth() + 1}〜${end.getMonth() + 1}月期`;
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { label, start: toISO(start), end: toISO(end) };
}

export default function NewEvaluationPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const q = useMemo(defaultQuarter, []);
  const [periodLabel, setPeriodLabel] = useState(q.label);
  const [periodStart, setPeriodStart] = useState(q.start);
  const [periodEnd, setPeriodEnd] = useState(q.end);
  const [evaluator, setEvaluator] = useState("");
  const [note, setNote] = useState("");
  const [scores, setScores] = useState<Record<ScoredCriterionKey, number>>(
    () => Object.fromEntries(CRITERIA.map((c) => [c.key, 0])) as Record<ScoredCriterionKey, number>
  );
  const [attitude, setAttitude] = useState(0);
  const [criteriaNotes, setCriteriaNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/evaluation/profiles").then((r) => r.json()).then((list: EmployeeWithProfile[]) => {
      setEmployee(list.find((e) => e.id === memberId) ?? null);
      setLoading(false);
    });
  }, [memberId]);

  if (loading) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>;
  if (!employee) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>メンバーが見つかりません</div>;

  const grade = resolveGrade(employee.profile);
  const total = computeTotal(scores, attitude);
  const criteria = getCriteriaForJobType(employee.profile?.job_type);

  const setNoteFor = (key: string, text: string) => setCriteriaNotes((n) => ({ ...n, [key]: text }));

  const handleSubmit = async () => {
    if (!grade) {
      alert("先に給与を登録して等級を確定してください（プロフィール編集画面から設定できます）");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/evaluation/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: memberId,
        period_label: periodLabel,
        period_start: periodStart,
        period_end: periodEnd,
        grade_at_evaluation: grade.grade,
        ...scores,
        score_attitude: attitude,
        evaluator: evaluator || null,
        note: note || null,
        criteria_notes: criteriaNotes,
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.push(`/evaluation/${memberId}`);
    } else {
      const err = await res.json();
      alert("保存に失敗しました: " + (err.error ?? "unknown error"));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>{employee.name} さんの新規評価</h1>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: "#64748b" }}>評価期間ラベル</label>
          <input style={inputStyle} value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#64748b" }}>開始日</label>
            <input style={inputStyle} type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#64748b" }}>終了日</label>
            <input style={inputStyle} type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748b" }}>評価者</label>
          <input style={inputStyle} value={evaluator} onChange={(e) => setEvaluator(e.target.value)} placeholder="評価者名" />
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          評価時点の等級: <b style={{ color: "#1e293b" }}>{grade ? `等級${grade.grade}・${grade.name}` : "未設定"}</b>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>【能力評価】</div>
        {criteria.filter((c) => c.group === "ability").map((c) => (
          <div key={c.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 2 }}>{c.no}. {c.label}</div>
            <ul style={{ margin: "0 0 8px", paddingLeft: 18, fontSize: 11, color: "#94a3b8" }}>
              {c.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <ScorePicker value={scores[c.key]} onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />
            <input
              style={{ ...inputStyle, marginTop: 6 }}
              value={criteriaNotes[c.key] ?? ""}
              onChange={(e) => setNoteFor(c.key, e.target.value)}
              placeholder="コメント・評価理由（任意）"
            />
          </div>
        ))}

        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "18px 0 4px" }}>【態度評価】（チームワーク・マナー・態度・顧客対応等）</div>
        {criteria.filter((c) => c.group === "attitude").map((c) => (
          <div key={c.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 2 }}>{c.no}. {c.label}</div>
            <ul style={{ margin: "0 0 8px", paddingLeft: 18, fontSize: 11, color: "#94a3b8" }}>
              {c.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <ScorePicker value={scores[c.key]} onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />
            <input
              style={{ ...inputStyle, marginTop: 6 }}
              value={criteriaNotes[c.key] ?? ""}
              onChange={(e) => setNoteFor(c.key, e.target.value)}
              placeholder="コメント・評価理由（任意）"
            />
          </div>
        ))}

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 2 }}>9. 姿勢のルール <span style={{ fontWeight: 400, color: "#94a3b8" }}>（できて当たり前＝0〜-2点のみ、加点なし）</span></div>
          <ScorePicker value={attitude} onChange={setAttitude} attitudeOnly />
          <input
            style={{ ...inputStyle, marginTop: 6 }}
            value={criteriaNotes.score_attitude ?? ""}
            onChange={(e) => setNoteFor("score_attitude", e.target.value)}
            placeholder="コメント・評価理由（任意）"
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, color: "#64748b" }}>コメント・特記事項</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div style={{ background: "#1e3a5f", borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}>今回の合計得点</span>
        <span style={{ color: "#fff", fontSize: 26, fontWeight: 900 }}>{total}点</span>
      </div>

      <button onClick={handleSubmit} disabled={saving} style={{ padding: "12px", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
        {saving ? "保存中..." : "評価を保存する"}
      </button>
    </div>
  );
}
