"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { EmployeeWithProfile, Evaluation } from "@/lib/evaluation-types";
import { CRITERIA, valueToLetter, SCORE_LABELS } from "@/lib/evaluation-constants";
import { getGradeInfo } from "@/lib/grades";

export default function PrintEvaluationPage() {
  const { memberId, evalId } = useParams<{ memberId: string; evalId: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeWithProfile | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profiles, ev] = await Promise.all([
        fetch("/api/evaluation/profiles").then((r) => r.json()) as Promise<EmployeeWithProfile[]>,
        fetch(`/api/evaluation/evaluations/${evalId}`).then((r) => r.json()) as Promise<Evaluation>,
      ]);
      setEmployee(profiles.find((p) => p.id === memberId) ?? null);
      setEvaluation(ev && !("error" in ev) ? ev : null);
      setLoading(false);
    })();
  }, [memberId, evalId]);

  if (loading) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>;
  if (!employee || !evaluation) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>データが見つかりません</div>;

  const displayName = employee.profile?.full_name || employee.name;
  const grade = getGradeInfo(evaluation.grade_at_evaluation);
  const abilityCriteria = CRITERIA.filter((c) => c.group === "ability");
  const attitudeCriteria = CRITERIA.filter((c) => c.group === "attitude");

  const cellStyle: React.CSSProperties = { border: "1px solid #cbd5e1", padding: "8px 10px", fontSize: 12, verticalAlign: "top" };
  const headCellStyle: React.CSSProperties = { ...cellStyle, background: "#f1f5f9", fontWeight: 700, whiteSpace: "nowrap" };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{ fontSize: 13, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>← 戻る</button>
        <button onClick={() => window.print()} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          🖨 印刷する
        </button>
      </div>

      <div className="print-sheet" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 28 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>人事評価シート</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{evaluation.period_label}</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
          <tbody>
            <tr>
              <td style={headCellStyle}>氏名</td>
              <td style={cellStyle}>{displayName}</td>
              <td style={headCellStyle}>入社年月</td>
              <td style={cellStyle}>{employee.profile?.join_date ?? "—"}</td>
            </tr>
            <tr>
              <td style={headCellStyle}>役職</td>
              <td style={cellStyle}>{employee.role}</td>
              <td style={headCellStyle}>等級</td>
              <td style={cellStyle}>等級{grade.grade}・{grade.name}</td>
            </tr>
            <tr>
              <td style={headCellStyle}>仕事内容・責任範囲</td>
              <td style={cellStyle} colSpan={3}>{grade.jobContent}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: 11, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
          【評価基準】 S：極めて優秀（+2点） ／ A：優秀（+1点） ／ B：普通（0点） ／ C：やや不十分（-1点） ／ D：かなり不十分（-2点）
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "10px 0 6px" }}>【能力評価】</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
          <tbody>
            {abilityCriteria.map((c) => {
              const v = evaluation[c.key];
              const letter = valueToLetter(v);
              return (
                <tr key={c.key}>
                  <td style={{ ...headCellStyle, width: 110 }}>{c.no}. {c.label}</td>
                  <td style={cellStyle}>{letter}（{SCORE_LABELS[letter]}）</td>
                  <td style={{ ...cellStyle, width: 60, textAlign: "center", fontWeight: 800 }}>{v > 0 ? `+${v}` : v}点</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "10px 0 6px" }}>【態度評価】（チームワーク・マナー・態度・顧客対応等）</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
          <tbody>
            {attitudeCriteria.map((c) => {
              const v = evaluation[c.key];
              const letter = valueToLetter(v);
              return (
                <tr key={c.key}>
                  <td style={{ ...headCellStyle, width: 110 }}>{c.no}. {c.label}</td>
                  <td style={cellStyle}>{letter}（{SCORE_LABELS[letter]}）</td>
                  <td style={{ ...cellStyle, width: 60, textAlign: "center", fontWeight: 800 }}>{v > 0 ? `+${v}` : v}点</td>
                </tr>
              );
            })}
            <tr>
              <td style={{ ...headCellStyle, width: 110 }}>9. 姿勢のルール</td>
              <td style={cellStyle}>できて当たり前（減点のみ）</td>
              <td style={{ ...cellStyle, width: 60, textAlign: "center", fontWeight: 800 }}>{evaluation.score_attitude}点</td>
            </tr>
          </tbody>
        </table>

        {evaluation.note && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>コメント・特記事項</div>
            <div style={{ fontSize: 12, color: "#334155", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, whiteSpace: "pre-wrap" }}>{evaluation.note}</div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid #0f172a", paddingTop: 14, marginTop: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            評価者：{evaluation.evaluator ?? "—"} ／ 発行日：{new Date().toLocaleDateString("ja-JP")}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>総合評価</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#0f172a" }}>{evaluation.total_score}点</div>
          </div>
        </div>
      </div>
    </div>
  );
}
