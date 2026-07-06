"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { EmployeeWithProfile, Evaluation, EvaluationSettings, WageType } from "@/lib/evaluation-types";
import { resolveGrade, monthlyEquivalentYen, buildHalfYearGroups, fmtYen } from "@/lib/evaluation-data";
import { DEFAULT_EVALUATION_SETTINGS, CRITERIA } from "@/lib/evaluation-constants";
import { GRADES } from "@/lib/grades";
import GradeBadge from "@/components/evaluation/GradeBadge";
import RadarChart from "@/components/evaluation/RadarChart";
import EligibilityCard from "@/components/evaluation/EligibilityCard";
import GradeTimeline from "@/components/evaluation/GradeTimeline";
import SimpleChart from "@/components/ui/SimpleChart";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid #e2e8f0",
  fontSize: 13, boxSizing: "border-box",
};

export default function EmployeeDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeWithProfile | null>(null);
  const [evals, setEvals] = useState<Evaluation[]>([]); // 降順
  const [settings, setSettings] = useState<EvaluationSettings>(DEFAULT_EVALUATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  const [wageType, setWageType] = useState<WageType>("monthly");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [dailyWage, setDailyWage] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [gradeOverride, setGradeOverride] = useState("");
  const [fullName, setFullName] = useState("");
  const [excluded, setExcluded] = useState(false);

  const load = useCallback(async () => {
    const [profiles, evalRes, settingsRes] = await Promise.all([
      fetch("/api/evaluation/profiles").then((r) => r.json()) as Promise<EmployeeWithProfile[]>,
      fetch(`/api/evaluation/evaluations?member_id=${memberId}`).then((r) => r.json()) as Promise<Evaluation[]>,
      fetch("/api/evaluation/settings").then((r) => r.json()) as Promise<EvaluationSettings>,
    ]);
    const emp = profiles.find((p) => p.id === memberId) ?? null;
    setEmployee(emp);
    setEvals(evalRes.slice().sort((a, b) => b.period_start.localeCompare(a.period_start)));
    setSettings(settingsRes);
    if (emp?.profile) {
      setWageType(emp.profile.wage_type);
      setMonthlySalary(emp.profile.monthly_salary?.toString() ?? "");
      setDailyWage(emp.profile.daily_wage?.toString() ?? "");
      setJoinDate(emp.profile.join_date ?? "");
      setGradeOverride(emp.profile.grade_override?.toString() ?? "");
      setFullName(emp.profile.full_name ?? "");
      setExcluded(emp.profile.excluded ?? false);
    }
    setLoading(false);
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveProfile = async () => {
    const res = await fetch(`/api/evaluation/profiles/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wage_type: wageType,
        monthly_salary: wageType === "monthly" && monthlySalary ? Number(monthlySalary) : null,
        daily_wage: wageType === "daily" && dailyWage ? Number(dailyWage) : null,
        join_date: joinDate || null,
        grade_override: gradeOverride ? Number(gradeOverride) : null,
        full_name: fullName.trim() || null,
        excluded,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("保存に失敗しました: " + (err.error ?? `HTTP ${res.status}`));
      return;
    }
    const saved = await res.json().catch(() => null);
    if (saved?.warning) alert(saved.warning);
    setEditingProfile(false);
    load();
  };

  const handleDeleteEval = async (id: string) => {
    if (!confirm("この評価を削除しますか？")) return;
    await fetch(`/api/evaluation/evaluations/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>;
  if (!employee) return <div style={{ padding: 20, color: "#94a3b8", fontSize: 13 }}>メンバーが見つかりません</div>;

  const grade = resolveGrade(employee.profile);
  const monthly = monthlyEquivalentYen(employee.profile);
  const halfYearGroups = buildHalfYearGroups(evals, settings);
  const evalsAsc = evals.slice().reverse();
  const latest = evals[0];
  const displayName = employee.profile?.full_name || employee.name;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", background: employee.color + "22",
          border: `2px solid ${employee.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: employee.color }}>{displayName[0]}</span>
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#1e293b" }}>{displayName}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{employee.role}</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          {grade && <GradeBadge grade={grade.grade} name={grade.name} size="lg" />}
        </div>
      </div>

      {/* プロフィール（給与→等級 自動判定） */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>給与・等級プロフィール</div>
          <button onClick={() => setEditingProfile((v) => !v)} style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
            {editingProfile ? "閉じる" : "編集"}
          </button>
        </div>

        {!editingProfile ? (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11 }}>氏名（印刷用フルネーム）</div>
              <div style={{ fontWeight: 700, color: "#1e293b" }}>{employee.profile?.full_name || <span style={{ color: "#cbd5e1", fontWeight: 400 }}>未設定（{employee.name}を使用）</span>}</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11 }}>給与形態</div>
              <div style={{ fontWeight: 700, color: "#1e293b" }}>
                {employee.profile?.wage_type === "daily" ? `日給月給（日給 ${fmtYen(employee.profile?.daily_wage)}）` : `月給（${fmtYen(employee.profile?.monthly_salary)}）`}
              </div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11 }}>月給換算</div>
              <div style={{ fontWeight: 700, color: "#1e293b" }}>{monthly ? fmtYen(monthly) : "未設定"}</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: 11 }}>入社年月</div>
              <div style={{ fontWeight: 700, color: "#1e293b" }}>{employee.profile?.join_date ?? "未設定"}</div>
            </div>
            {employee.profile?.excluded && (
              <div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>状態</div>
                <div style={{ fontWeight: 700, color: "#dc2626" }}>評価対象から除外中</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b" }}>氏名（印刷用フルネーム・未入力ならメンバー名を使用）</label>
              <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="例: 西山 敦紀" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setWageType("monthly")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${wageType === "monthly" ? "#2563eb" : "#e2e8f0"}`, background: wageType === "monthly" ? "#eff6ff" : "#fff", color: wageType === "monthly" ? "#2563eb" : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>月給制</button>
              <button onClick={() => setWageType("daily")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${wageType === "daily" ? "#2563eb" : "#e2e8f0"}`, background: wageType === "daily" ? "#eff6ff" : "#fff", color: wageType === "daily" ? "#2563eb" : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>日給月給制（×25日換算）</button>
            </div>
            {wageType === "monthly" ? (
              <div>
                <label style={{ fontSize: 11, color: "#64748b" }}>月給（円）</label>
                <input style={inputStyle} type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} placeholder="例: 275000" />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 11, color: "#64748b" }}>日給（円）</label>
                <input style={inputStyle} type="number" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} placeholder="例: 11000" />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: "#64748b" }}>入社年月日</label>
              <input style={inputStyle} type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b" }}>等級 手動上書き（通常は空欄で自動判定）</label>
              <select style={inputStyle} value={gradeOverride} onChange={(e) => setGradeOverride(e.target.value)}>
                <option value="">自動判定（給与から算出）</option>
                {GRADES.map((g) => <option key={g.grade} value={g.grade}>等級{g.grade}・{g.name}</option>)}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#334155", cursor: "pointer" }}>
              <input type="checkbox" checked={excluded} onChange={(e) => setExcluded(e.target.checked)} />
              評価対象から除外する（役員など評価制度の対象外にしたい場合）
            </label>
            <button onClick={handleSaveProfile} style={{ padding: "9px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>保存</button>
          </div>
        )}
      </div>

      {/* 等級推移 */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>等級の推移</div>
        <GradeTimeline evaluationsAsc={evalsAsc} />
      </div>

      {/* 成長グラフ */}
      {evals.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>評価点の推移</div>
          <SimpleChart
            labels={evalsAsc.map((e) => e.period_label)}
            series={[{ name: "合計得点", data: evalsAsc.map((e) => e.total_score), color: "#2563eb", bold: true }]}
            height={180}
          />
        </div>
      )}

      {/* 直近評価のレーダーチャート */}
      {latest && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>直近評価（{latest.period_label}）の項目別スコア</div>
          <RadarChart points={CRITERIA.map((c) => ({ label: c.label, value: latest[c.key] }))} />
        </div>
      )}

      {/* 昇給・昇格判定 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>昇給・昇格判定（半年ごと）</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {halfYearGroups.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>評価履歴がありません</div>}
          {halfYearGroups.map((g, i) => <EligibilityCard key={i} group={g} settings={settings} />)}
        </div>
      </div>

      {/* 評価履歴 */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>評価履歴</div>
          <button onClick={() => router.push(`/evaluation/${memberId}/new`)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            ＋ 新規評価を入力
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {evals.map((e) => (
            <div key={e.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{e.period_label}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>等級{e.grade_at_evaluation} ・ {e.evaluator ? `評価者: ${e.evaluator}` : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: e.total_score >= settings.perPeriodMin ? "#059669" : "#dc2626" }}>{e.total_score}点</span>
                <Link href={`/evaluation/${memberId}/print/${e.id}`} style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>🖨 印刷</Link>
                <button onClick={() => handleDeleteEval(e.id)} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>削除</button>
              </div>
            </div>
          ))}
          {evals.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8" }}>まだ評価がありません</div>}
        </div>
      </div>

      <Link href="/evaluation" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← 一覧に戻る</Link>
    </div>
  );
}
