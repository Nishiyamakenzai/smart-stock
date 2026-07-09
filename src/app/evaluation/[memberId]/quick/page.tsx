"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { EmployeeWithProfile } from "@/lib/evaluation-types";
import { resolveGrade } from "@/lib/evaluation-data";
import { getCriteriaForJobType } from "@/lib/evaluation-constants";
import { getQuickItemGroupsForJobType, QUICK_SCALE_ABILITY, QUICK_SCALE_RULE, type QuickItemCategory } from "@/lib/quick-items";
import { DEFAULT_JOB_TYPE } from "@/lib/job-types";
import type { QuickDraft } from "@/app/api/evaluation/quick-draft/[memberId]/route";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid #e2e8f0",
  fontSize: 13, boxSizing: "border-box",
};

function defaultQuarter(): { label: string; start: string; end: string } {
  const now = new Date();
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const start = new Date(now.getFullYear(), qStartMonth, 1);
  const end = new Date(now.getFullYear(), qStartMonth + 3, 0);
  const label = `${start.getFullYear()}年 ${start.getMonth() + 1}〜${end.getMonth() + 1}月期`;
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { label, start: toISO(start), end: toISO(end) };
}

function QuickItemRow({
  label,
  value,
  onChange,
  scale,
  comment,
  onCommentChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  scale: "ability" | "rule";
  comment: string;
  onCommentChange: (text: string) => void;
}) {
  const options = scale === "ability" ? QUICK_SCALE_ABILITY : QUICK_SCALE_RULE;
  const [showComment, setShowComment] = useState(!!comment);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 12.5, color: "#334155" }}>{label}</div>
        <button
          type="button"
          onClick={() => setShowComment((s) => !s)}
          style={{ flexShrink: 0, fontSize: 10.5, color: comment ? "#2563eb" : "#94a3b8", background: "none", border: "none", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}
        >
          {showComment ? "閉じる" : comment ? "✎ コメントあり" : "＋コメント"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? null : opt.value)}
            style={{
              padding: "5px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
              border: `1.5px solid ${value === opt.value ? "#2563eb" : "#e2e8f0"}`,
              background: value === opt.value ? "#2563eb" : "#fff",
              color: value === opt.value ? "#fff" : "#64748b",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {showComment && (
        <input
          style={{ width: "100%", padding: "7px 9px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxSizing: "border-box" }}
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="この質問について気づいた点があれば（任意）"
        />
      )}
    </div>
  );
}

export default function QuickEvaluatePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftLoadedAt, setDraftLoadedAt] = useState<string | null>(null);

  const q = useMemo(defaultQuarter, []);
  const [periodLabel, setPeriodLabel] = useState(q.label);
  const [periodStart, setPeriodStart] = useState(q.start);
  const [periodEnd, setPeriodEnd] = useState(q.end);
  const [evaluator, setEvaluator] = useState("");
  const [freeText, setFreeText] = useState("");
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [itemComments, setItemComments] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/evaluation/profiles").then((r) => r.json()).then((list: EmployeeWithProfile[]) => {
      setEmployee(list.find((e) => e.id === memberId) ?? null);
      setLoading(false);
    });
    fetch(`/api/evaluation/quick-draft/${memberId}`).then((r) => r.json()).then((draft: QuickDraft | null) => {
      if (!draft) return;
      if (draft.period_label) setPeriodLabel(draft.period_label);
      if (draft.period_start) setPeriodStart(draft.period_start);
      if (draft.period_end) setPeriodEnd(draft.period_end);
      setEvaluator(draft.evaluator ?? "");
      setFreeText(draft.free_text ?? "");
      setAnswers(draft.answers ?? {});
      setItemComments(draft.item_comments ?? {});
      setDraftLoadedAt(draft.updated_at ?? null);
    });
  }, [memberId]);

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch(`/api/evaluation/quick-draft/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_label: periodLabel,
          period_start: periodStart,
          period_end: periodEnd,
          evaluator,
          answers,
          item_comments: itemComments,
          free_text: freeText,
        }),
      });
      if (!res.ok) {
        alert("下書きの保存に失敗しました");
        return;
      }
      setDraftLoadedAt(new Date().toISOString());
      alert("回答内容を下書き保存しました。続きは後でこの画面を開くと復元されます。");
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (!confirm("保存済みの下書きを削除して最初からやり直しますか？")) return;
    await fetch(`/api/evaluation/quick-draft/${memberId}`, { method: "DELETE" });
    setAnswers({});
    setItemComments({});
    setFreeText("");
    setEvaluator("");
    setDraftLoadedAt(null);
  };

  if (loading) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>;
  if (!employee) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>メンバーが見つかりません</div>;

  const jobType = employee.profile?.job_type ?? DEFAULT_JOB_TYPE;
  const grade = resolveGrade(employee.profile);
  const criteria = getCriteriaForJobType(jobType);
  const groups = getQuickItemGroupsForJobType(jobType);
  const labelOf = (cat: QuickItemCategory) => (cat === "score_attitude" ? "姿勢のルール（できて当たり前・減点方式）" : criteria.find((c) => c.key === cat)?.label ?? cat);

  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const totalCount = groups.reduce((s, g) => s + g.items.length, 0);

  const setAnswer = (id: string, v: number | null) => setAnswers((a) => ({ ...a, [id]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/evaluation/ai-quick-evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberId,
          period_label: periodLabel,
          period_start: periodStart,
          period_end: periodEnd,
          evaluator: evaluator || null,
          answers,
          item_comments: itemComments,
          free_text: freeText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("評価の作成に失敗しました: " + (data.error ?? "unknown error"));
        return;
      }
      if (data.warning) alert(data.warning);
      await fetch(`/api/evaluation/quick-draft/${memberId}`, { method: "DELETE" });
      router.push(`/evaluation/${memberId}/new?draftId=${data.id}`);
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>{employee.name} さんのかんたん評価アンケート</h1>
        <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0" }}>
          約{totalCount}個の質問にボタンをタップして答えるだけで、AIが評価スコアとコメントの下書きを作成します。わからない項目は空欄のままでOKです。最後に内容を確認・修正してから保存できます。
        </p>
        {draftLoadedAt && (
          <div style={{ marginTop: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, color: "#92400e" }}>回答の下書きを読み込みました（保存日時: {new Date(draftLoadedAt).toLocaleString("ja-JP")}）</span>
            <button type="button" onClick={handleDiscardDraft} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>
              下書きを削除して最初から
            </button>
          </div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          等級: <b style={{ color: "#1e293b" }}>{grade ? `等級${grade.grade}・${grade.name}` : "未設定"}</b>
        </div>
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
      </div>

      {groups.map((g) => (
        <div key={g.category} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>{labelOf(g.category)}</div>
          {g.items.map((item) => (
            <QuickItemRow
              key={item.id}
              label={item.label}
              value={answers[item.id] ?? null}
              onChange={(v) => setAnswer(item.id, v)}
              scale={g.scale}
              comment={itemComments[item.id] ?? ""}
              onCommentChange={(text) => setItemComments((c) => ({ ...c, [item.id]: text }))}
            />
          ))}
        </div>
      ))}

      <div>
        <label style={{ fontSize: 11, color: "#64748b" }}>その他伝えたいことがあれば（任意・箇条書きでOK）</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="例: 訪販は言わないとやらない、少しできると聞かなくなる、など気になっていることを簡単なメモでOK"
        />
      </div>

      <div style={{ position: "sticky", bottom: 12, background: "#1e3a5f", borderRadius: 14, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
        <span style={{ color: "#cbd5e1", fontSize: 12 }}>{answeredCount} / {totalCount} 項目に回答済み</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSaveDraft}
            disabled={submitting || savingDraft}
            style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #475569", background: "transparent", color: "#e2e8f0", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: savingDraft ? 0.6 : 1, whiteSpace: "nowrap" }}
          >
            {savingDraft ? "保存中..." : "回答を下書き保存"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || savingDraft}
            style={{ padding: "12px 18px", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: submitting ? 0.6 : 1, whiteSpace: "nowrap" }}
          >
            {submitting ? "AIが作成中..." : "🤖 AIに評価を作ってもらう"}
          </button>
        </div>
      </div>
    </div>
  );
}
