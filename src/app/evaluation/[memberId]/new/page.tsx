"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { EmployeeWithProfile, Evaluation, ScoredCriterionKey } from "@/lib/evaluation-types";
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

function CommentField({
  value,
  onChange,
  criterionLabel,
}: {
  value: string;
  onChange: (text: string) => void;
  criterionLabel: string;
}) {
  const [rewriting, setRewriting] = useState(false);

  const handleAiRewrite = async () => {
    if (!value.trim()) {
      alert("先にメモを入力してください（簡単な箇条書きでOK）");
      return;
    }
    setRewriting(true);
    try {
      const res = await fetch("/api/evaluation/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, criterionLabel }),
      });
      const data = await res.json();
      if (res.ok) {
        onChange(data.text);
      } else {
        alert(data.error ?? "AI変換に失敗しました");
      }
    } catch {
      alert("AI変換に失敗しました（通信エラー）");
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "flex-start" }}>
      <input
        style={inputStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="コメント・評価理由（任意・簡単なメモでOK）"
      />
      <button
        type="button"
        onClick={handleAiRewrite}
        disabled={rewriting}
        style={{
          flexShrink: 0, padding: "9px 10px", borderRadius: 10, border: "1px solid #c7d2fe",
          background: rewriting ? "#e0e7ff" : "#eef2ff", color: "#4338ca", fontSize: 12, fontWeight: 700,
          cursor: rewriting ? "default" : "pointer", whiteSpace: "nowrap",
        }}
      >
        {rewriting ? "整えています..." : "✨ AIで整える"}
      </button>
    </div>
  );
}

export default function NewEvaluationPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [employee, setEmployee] = useState<EmployeeWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

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

  useEffect(() => {
    if (!draftId) return;
    fetch(`/api/evaluation/evaluations/${draftId}`).then((r) => r.json()).then((ev: Evaluation) => {
      if (!ev || (ev as unknown as { error?: string }).error) return;
      setPeriodLabel(ev.period_label);
      setPeriodStart(ev.period_start);
      setPeriodEnd(ev.period_end);
      setEvaluator(ev.evaluator ?? "");
      setNote(ev.note ?? "");
      setAttitude(ev.score_attitude);
      setCriteriaNotes(ev.criteria_notes ?? {});
      setScores(
        Object.fromEntries(CRITERIA.map((c) => [c.key, ev[c.key] ?? 0])) as Record<ScoredCriterionKey, number>
      );
    });
  }, [draftId]);

  if (loading) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>;
  if (!employee) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>メンバーが見つかりません</div>;

  const grade = resolveGrade(employee.profile);
  const total = computeTotal(scores, attitude);
  const criteria = getCriteriaForJobType(employee.profile?.job_type);

  const setNoteFor = (key: string, text: string) => setCriteriaNotes((n) => ({ ...n, [key]: text }));

  const handleSubmit = async (isDraft: boolean) => {
    if (!isDraft && !grade) {
      alert("先に給与を登録して等級を確定してください（プロフィール編集画面から設定できます）");
      return;
    }
    isDraft ? setSavingDraft(true) : setSaving(true);
    const payload = {
      member_id: memberId,
      period_label: periodLabel,
      period_start: periodStart,
      period_end: periodEnd,
      grade_at_evaluation: grade ? grade.grade : 0,
      ...scores,
      score_attitude: attitude,
      evaluator: evaluator || null,
      note: note || null,
      criteria_notes: criteriaNotes,
      is_draft: isDraft,
    };
    const res = draftId
      ? await fetch(`/api/evaluation/evaluations/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/evaluation/evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    isDraft ? setSavingDraft(false) : setSaving(false);
    if (res.ok) {
      router.push(`/evaluation/${memberId}`);
    } else {
      const err = await res.json();
      alert("保存に失敗しました: " + (err.error ?? "unknown error"));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>
        {employee.name} さんの{draftId ? "評価（下書き編集）" : "新規評価"}
      </h1>

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
            <CommentField
              value={criteriaNotes[c.key] ?? ""}
              onChange={(text) => setNoteFor(c.key, text)}
              criterionLabel={c.label}
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
            <CommentField
              value={criteriaNotes[c.key] ?? ""}
              onChange={(text) => setNoteFor(c.key, text)}
              criterionLabel={c.label}
            />
          </div>
        ))}

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 2 }}>9. 姿勢のルール <span style={{ fontWeight: 400, color: "#94a3b8" }}>（できて当たり前＝0〜-2点のみ、加点なし）</span></div>
          <ScorePicker value={attitude} onChange={setAttitude} attitudeOnly />
          <CommentField
            value={criteriaNotes.score_attitude ?? ""}
            onChange={(text) => setNoteFor("score_attitude", text)}
            criterionLabel="姿勢のルール"
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

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => handleSubmit(true)}
          disabled={saving || savingDraft}
          style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: savingDraft ? 0.6 : 1 }}
        >
          {savingDraft ? "保存中..." : "下書き保存"}
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={saving || savingDraft}
          style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "保存中..." : "評価を確定して保存する"}
        </button>
      </div>
    </div>
  );
}
