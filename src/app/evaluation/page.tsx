"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { EmployeeWithProfile, Evaluation, EvaluationSettings } from "@/lib/evaluation-types";
import { resolveGrade, monthlyEquivalentYen, buildHalfYearGroups, fmtYen } from "@/lib/evaluation-data";
import { DEFAULT_EVALUATION_SETTINGS } from "@/lib/evaluation-constants";
import GradeBadge from "@/components/evaluation/GradeBadge";

export default function EvaluationListPage() {
  const [employees, setEmployees] = useState<EmployeeWithProfile[]>([]);
  const [evalsByMember, setEvalsByMember] = useState<Record<string, Evaluation[]>>({});
  const [settings, setSettings] = useState<EvaluationSettings>(DEFAULT_EVALUATION_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [empRes, settingsRes] = await Promise.all([
        fetch("/api/evaluation/profiles").then((r) => r.json()),
        fetch("/api/evaluation/settings").then((r) => r.json()),
      ]);
      setEmployees(empRes);
      setSettings(settingsRes);
      const allEvals = await fetch("/api/evaluation/evaluations").then((r) => r.json());
      const grouped: Record<string, Evaluation[]> = {};
      for (const e of allEvals as Evaluation[]) {
        (grouped[e.member_id] ??= []).push(e);
      }
      setEvalsByMember(grouped);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>職人一覧</h1>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{employees.length}名</span>
      </div>

      {employees.map((emp) => {
        const grade = resolveGrade(emp.profile);
        const monthly = monthlyEquivalentYen(emp.profile);
        const evals = (evalsByMember[emp.id] ?? []).slice().sort((a, b) => b.period_start.localeCompare(a.period_start));
        const groups = buildHalfYearGroups(evals, settings);
        const latestGroup = groups[0];
        const latestEval = evals[0];

        return (
          <Link key={emp.id} href={`/evaluation/${emp.id}`} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
              padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", background: emp.color + "22",
                  border: `2px solid ${emp.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: emp.color }}>{emp.name[0]}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{emp.role} ・ {monthly ? fmtYen(monthly) + "/月" : "給与未設定"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {grade ? <GradeBadge grade={grade.grade} name={grade.name} size="sm" /> : <span style={{ fontSize: 11, color: "#cbd5e1" }}>等級未設定</span>}
                {latestEval ? (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: latestEval.total_score >= settings.perPeriodMin ? "#059669" : "#dc2626" }}>
                      {latestEval.total_score}点
                    </div>
                    {latestGroup?.evaluations.length === 2 && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: latestGroup.eligible ? "#059669" : "#dc2626" }}>
                        {latestGroup.eligible ? "昇給対象" : "見送り"}
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: "#cbd5e1" }}>評価なし</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}

      {employees.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>
          メンバーが登録されていません。「タスク管理」の設定からメンバーを追加してください。
        </div>
      )}
    </div>
  );
}
