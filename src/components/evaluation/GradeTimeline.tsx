import type { Evaluation } from "@/lib/evaluation-types";
import GradeBadge from "./GradeBadge";
import { getGradeInfo } from "@/lib/grades";

// 評価履歴（古い順）から等級の推移を時系列で表示
export default function GradeTimeline({ evaluationsAsc }: { evaluationsAsc: Evaluation[] }) {
  if (evaluationsAsc.length === 0) {
    return <div style={{ fontSize: 12, color: "#94a3b8" }}>評価履歴がまだありません</div>;
  }
  return (
    <div style={{ display: "flex", overflowX: "auto", gap: 0, paddingBottom: 6 }}>
      {evaluationsAsc.map((e, i) => {
        const g = getGradeInfo(e.grade_at_evaluation);
        const prev = i > 0 ? evaluationsAsc[i - 1].grade_at_evaluation : e.grade_at_evaluation;
        const changed = prev !== e.grade_at_evaluation;
        return (
          <div key={e.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {i > 0 && <div style={{ width: 28, height: 2, background: "#e2e8f0" }} />}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 88 }}>
              <GradeBadge grade={g.grade} name={g.name} size="sm" />
              <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>{e.period_label}</span>
              {changed && <span style={{ fontSize: 9, fontWeight: 700, color: "#059669" }}>↑昇格</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
