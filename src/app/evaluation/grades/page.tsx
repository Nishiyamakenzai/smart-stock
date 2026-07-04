"use client";
import { GRADES } from "@/lib/grades";
import GradeBadge from "@/components/evaluation/GradeBadge";

export default function GradesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>等級制度（等級1〜10）</h1>
      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
        想定月給のレンジは日給月給の場合「日給 × 25日」で月換算した金額と比較します。
      </p>
      {GRADES.map((g) => (
        <div key={g.grade} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
            <GradeBadge grade={g.grade} name={g.name} size="lg" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", whiteSpace: "nowrap" }}>{g.salaryMin}〜{g.salaryMax}万円/月</span>
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginBottom: 10 }}>{g.catchphrase}</div>
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>仕事内容・責任範囲</div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{g.jobContent}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>権限・裁量範囲</div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{g.authority}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 2 }}>次の昇格の基本条件</div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{g.promotionCondition}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
