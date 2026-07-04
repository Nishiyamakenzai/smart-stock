import type { HalfYearGroup } from "@/lib/evaluation-data";
import type { EvaluationSettings } from "@/lib/evaluation-types";

export default function EligibilityCard({ group, settings }: { group: HalfYearGroup; settings: EvaluationSettings }) {
  const complete = group.evaluations.length === 2;
  const statusColor = !complete ? "#94a3b8" : group.eligible ? "#059669" : "#dc2626";
  const statusBg = !complete ? "#f1f5f9" : group.eligible ? "#ecfdf5" : "#fef2f2";
  const statusLabel = !complete ? "評価継続中（あと1回で判定）" : group.eligible ? "昇給・昇格 対象" : "見送り";

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{group.label}</div>
        <span style={{ fontSize: 11, fontWeight: 800, color: statusColor, background: statusBg, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
          {statusLabel}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 900, color: statusColor }}>{group.totalScore}</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>点 / 半年基準 {settings.halfYearMin}点以上</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {group.evaluations.map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
            <span>{e.period_label}</span>
            <span style={{ fontWeight: 700, color: e.total_score >= settings.perPeriodMin ? "#059669" : "#dc2626" }}>
              {e.total_score}点 {e.total_score >= settings.perPeriodMin ? "✓" : `(基準${settings.perPeriodMin}点未満)`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
