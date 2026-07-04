export interface RadarPoint { label: string; value: number }

// -2〜2 の8軸レーダーチャート（能力評価3 + 態度評価5）
export default function RadarChart({ points, size = 260, color = "#2563eb" }: { points: RadarPoint[]; size?: number; color?: string }) {
  const n = points.length;
  if (n === 0) return null;
  const cx = size / 2, cy = size / 2;
  const R = size / 2 - 42;
  const MIN = -2, MAX = 2;

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const radiusOf = (v: number) => ((v - MIN) / (MAX - MIN)) * R;
  const pointOf = (i: number, v: number) => {
    const a = angleOf(i);
    const r = radiusOf(v);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const rings = [-2, -1, 0, 1, 2];
  const polygon = points.map((p, i) => pointOf(i, p.value).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size, height: "auto", display: "block", margin: "0 auto" }}>
      {rings.map((r) => {
        const ringPts = points.map((_, i) => pointOf(i, r).join(",")).join(" ");
        return (
          <polygon key={r} points={ringPts} fill="none"
            stroke={r === 0 ? "#cbd5e1" : "#f1f5f9"} strokeWidth={r === 0 ? 1.3 : 1} />
        );
      })}
      {points.map((p, i) => {
        const [x, y] = pointOf(i, MAX);
        return <line key={p.label} x1={cx} y1={cy} x2={x} y2={y} stroke="#f1f5f9" strokeWidth={1} />;
      })}
      <polygon points={polygon} fill={color + "33"} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => {
        const [x, y] = pointOf(i, p.value);
        return <circle key={p.label + "_d"} cx={x} cy={y} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />;
      })}
      {points.map((p, i) => {
        const a = angleOf(i);
        const lx = cx + (R + 26) * Math.cos(a);
        const ly = cy + (R + 26) * Math.sin(a);
        return (
          <text key={p.label + "_l"} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontWeight={700} fill="#475569" fontFamily="sans-serif">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}
