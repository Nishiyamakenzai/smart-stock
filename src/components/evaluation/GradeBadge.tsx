import type { GradeInfo } from "@/lib/grades";

const TIER_COLORS = [
  { from: 1, to: 2, color: "#64748b", bg: "#f1f5f9" },
  { from: 3, to: 4, color: "#2563eb", bg: "#eff6ff" },
  { from: 5, to: 6, color: "#059669", bg: "#ecfdf5" },
  { from: 7, to: 8, color: "#d97706", bg: "#fffbeb" },
  { from: 9, to: 10, color: "#7c3aed", bg: "#f5f3ff" },
];

export function gradeColor(grade: number) {
  return TIER_COLORS.find((t) => grade >= t.from && grade <= t.to) ?? TIER_COLORS[0];
}

export default function GradeBadge({ grade, name, size = "md" }: { grade: number; name?: string; size?: "sm" | "md" | "lg" }) {
  const { color, bg } = gradeColor(grade);
  const dims = size === "sm" ? { pad: "3px 8px", fs: 11, num: 12 } : size === "lg" ? { pad: "8px 16px", fs: 15, num: 20 } : { pad: "5px 12px", fs: 12, num: 15 };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: dims.pad, borderRadius: 999, background: bg,
      border: `1px solid ${color}33`, whiteSpace: "nowrap",
    }}>
      <span style={{ fontWeight: 900, color, fontSize: dims.num }}>{grade}</span>
      <span style={{ fontWeight: 700, color, fontSize: dims.fs }}>{name}</span>
    </span>
  );
}

export function gradeInfoLabel(g: GradeInfo | null) {
  if (!g) return "未設定";
  return `等級${g.grade}・${g.name}`;
}
