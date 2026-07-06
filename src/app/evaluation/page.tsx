"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { EmployeeWithProfile, Evaluation, EvaluationSettings } from "@/lib/evaluation-types";
import { resolveGrade, monthlyEquivalentYen, buildHalfYearGroups, fmtYen } from "@/lib/evaluation-data";
import { DEFAULT_EVALUATION_SETTINGS } from "@/lib/evaluation-constants";
import GradeBadge from "@/components/evaluation/GradeBadge";

const PRESET_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2', '#4F46E5', '#DC2626', '#0D9488', '#9333EA'];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid #e2e8f0",
  fontSize: 13, boxSizing: "border-box",
};

export default function EvaluationListPage() {
  const [employees, setEmployees] = useState<EmployeeWithProfile[]>([]);
  const [evalsByMember, setEvalsByMember] = useState<Record<string, Evaluation[]>>({});
  const [settings, setSettings] = useState<EvaluationSettings>(DEFAULT_EVALUATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showExcluded, setShowExcluded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (memberId: string) => {
    await fetch(`/api/evaluation/profiles/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excluded: false }),
    });
    load();
  };

  const handleAddMember = async () => {
    if (!newName.trim() || !newRole.trim()) return;
    setAdding(true);
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        role: newRole.trim(),
        color: newColor,
        display_order: employees.length + 1,
      }),
    });
    setAdding(false);
    if (res.ok) {
      setNewName(""); setNewRole(""); setNewColor(PRESET_COLORS[0]); setShowAddForm(false);
      load();
    } else {
      alert("追加に失敗しました");
    }
  };

  const handleExclude = async (e: React.MouseEvent, memberId: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`${name} を評価対象から除外しますか？（一覧から非表示になります。後でいつでも戻せます）`)) return;
    await fetch(`/api/evaluation/profiles/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excluded: true }),
    });
    load();
  };

  if (loading) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>;

  const activeEmployees = employees.filter((e) => !e.profile?.excluded);
  const excludedEmployees = employees.filter((e) => e.profile?.excluded);

  const renderRow = (emp: EmployeeWithProfile) => {
    const grade = resolveGrade(emp.profile);
    const monthly = monthlyEquivalentYen(emp.profile);
    const displayName = emp.profile?.full_name || emp.name;
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
              <span style={{ fontSize: 15, fontWeight: 800, color: emp.color }}>{displayName[0]}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{displayName}</div>
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
            <button
              onClick={(e) => handleExclude(e, emp.id, displayName)}
              title="評価対象から除外する"
              style={{ fontSize: 11, color: "#cbd5e1", background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              ✕
            </button>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>スタッフ一覧</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{activeEmployees.length}名</span>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
          >
            ＋ スタッフを追加
          </button>
        </div>
      </div>

      {showAddForm && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: "#64748b" }}>氏名（フルネームで入力すると、そのまま評価・印刷に使われます）</label>
            <input style={inputStyle} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例: 白鳥 龍希" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#64748b" }}>役職・役割</label>
            <input style={inputStyle} value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="例: 職人" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>バッジの色</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer",
                    border: newColor === c ? "3px solid #1e293b" : "1px solid #e2e8f0",
                  }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleAddMember}
            disabled={adding || !newName.trim() || !newRole.trim()}
            style={{ padding: "9px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: adding ? 0.6 : 1 }}
          >
            {adding ? "追加中..." : "追加する"}
          </button>
        </div>
      )}

      {activeEmployees.map(renderRow)}

      {activeEmployees.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>
          メンバーが登録されていません。上の「＋ スタッフを追加」から登録してください。
        </div>
      )}

      {excludedEmployees.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowExcluded((v) => !v)}
            style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
          >
            {showExcluded ? "▲ " : "▼ "}評価対象から除外中のメンバー（{excludedEmployees.length}名）
          </button>
          {showExcluded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {excludedEmployees.map((emp) => (
                <div key={emp.id} style={{
                  background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1",
                  padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{emp.profile?.full_name || emp.name}（{emp.role}）</span>
                  <button
                    onClick={() => handleRestore(emp.id)}
                    style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                  >
                    評価対象に戻す
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
