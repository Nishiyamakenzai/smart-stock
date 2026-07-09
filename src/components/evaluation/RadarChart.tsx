export interface RadarPoint { label: string; value: number }
export interface RadarCompareSeries { label: string; color: string; values: number[] }

// -2〜2 の多軸レーダーチャート（能力評価3 + 態度評価5、compareSeries指定時は前回評価との比較を重ねて表示）
export default function RadarChart({
  points, size = 260, color = "#2563eb", label = "今回", compareSeries,
}: {
  points: RadarPoint[]; size?: number; color?: string; label?: string; compareSeries?: RadarCompareSeries;
}) {
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
  const comparePolygon = compareSeries
    ? compareSeries.values.map((v, i) => pointOf(i, v ?? 0).join(",")).join(" ")
    : null;

  return (
    <div>
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
        {comparePolygon && (
          <polygon points={comparePolygon} fill="none" stroke={compareSeries!.color} strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round" />
        )}
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
      {compareSeries && (
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4, fontSize: 11, color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 14, height: 0, borderTop: `2px solid ${color}` }} />{label}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 14, height: 0, borderTop: `1.5px dashed ${compareSeries.color}` }} />{compareSeries.label}
          </span>
        </div>
      )}
    </div>
  );
}
