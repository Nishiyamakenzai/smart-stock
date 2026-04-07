"use client";
import { useState } from "react";

interface Series {
  name: string;
  data: (number | null)[];
  color: string;
  bold?: boolean;
}

interface SimpleChartProps {
  series: Series[];
  labels?: string[];
  height?: number;
  showBreakeven?: boolean;
}

export default function SimpleChart({ series, labels, height = 200, showBreakeven }: SimpleChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!series?.length || !labels?.length) return null;

  const W = 460, H = height;
  const ml = 36, mr = 10, mt = 8, mb = 40;
  const cw = W - ml - mr;
  const ch = H - mt - mb;
  const n = labels.length;

  const allVals = series.flatMap(s => s.data.filter(v => v !== null) as number[]);
  if (!allVals.length) return null;

  let yMin = Math.min(...allVals);
  let yMax = Math.max(...allVals);
  if (yMin === yMax) { yMin = yMin - 1; yMax = yMax + 1; }
  const span = yMax - yMin;
  yMin = yMin - span * 0.08;
  yMax = yMax + span * 0.05;

  const xOf = (i: number) => n <= 1 ? ml + cw / 2 : ml + (i / (n - 1)) * cw;
  const yOf = (v: number) => mt + (1 - (v - yMin) / (yMax - yMin)) * ch;

  const fmtY = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return Math.round(v).toString();
  };

  const ticks = [0, 1, 2, 3, 4].map(i => yMin + (yMax - yMin) * i / 4);

  const buildArea = (data: (number | null)[]): string => {
    let path = "";
    let segStart = -1;
    let lastI = -1;
    let pts = "";
    const bottom = mt + ch;
    const flush = () => {
      if (segStart < 0 || !pts) return;
      path += `M ${xOf(segStart).toFixed(1)} ${bottom.toFixed(1)} ${pts}L ${xOf(lastI).toFixed(1)} ${bottom.toFixed(1)} Z `;
      segStart = -1; lastI = -1; pts = "";
    };
    data.forEach((v, i) => {
      if (v !== null) {
        if (segStart < 0) segStart = i;
        lastI = i;
        pts += `L ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)} `;
      } else {
        flush();
      }
    });
    flush();
    return path;
  };

  const buildLine = (data: (number | null)[]): string => {
    let path = "";
    let gap = true;
    data.forEach((v, i) => {
      if (v !== null) {
        const x = xOf(i).toFixed(1), y = yOf(v).toFixed(1);
        path += gap ? `M ${x} ${y} ` : `L ${x} ${y} `;
        gap = false;
      } else {
        gap = true;
      }
    });
    return path;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / rect.width * W;
    const idx = Math.round((svgX - ml) / cw * (n - 1));
    setHoverIdx(idx >= 0 && idx < n ? idx : null);
  };

  const legendItemW = Math.min(110, cw / series.length);

  return (
    <div style={{ position: "relative", width: "100%", fontSize: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          {series.map(s => {
            const id = `ag_${s.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
            return (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Grid */}
        {ticks.map((v, i) => (
          <line key={i}
            x1={ml} x2={W - mr} y1={yOf(v)} y2={yOf(v)}
            stroke="#f1f5f9" strokeWidth="1" strokeDasharray={i > 0 ? "3 3" : ""}
          />
        ))}

        {/* Y labels */}
        {ticks.map((v, i) => (
          <text key={i} x={ml - 4} y={yOf(v) + 3.5}
            textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
            {fmtY(v)}
          </text>
        ))}

        {/* X labels */}
        {labels.map((l, i) => {
          if (n > 8 && i % 2 !== 0) return null;
          return (
            <text key={i} x={xOf(i)} y={mt + ch + 14}
              textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
              {l}
            </text>
          );
        })}

        {/* Axes */}
        <line x1={ml} x2={ml} y1={mt} y2={mt + ch} stroke="#e2e8f0" strokeWidth="1" />
        <line x1={ml} x2={W - mr} y1={mt + ch} y2={mt + ch} stroke="#e2e8f0" strokeWidth="1" />

        {/* BEP line */}
        {showBreakeven && yMin <= 0 && yMax >= 0 && (
          <>
            <line x1={ml} x2={W - mr} y1={yOf(0)} y2={yOf(0)}
              stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x={W - mr + 2} y={yOf(0) + 4} fontSize="8" fill="#ef4444" fontFamily="sans-serif">BEP</text>
          </>
        )}

        {/* Areas */}
        {series.map(s => {
          const id = `ag_${s.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
          return <path key={s.name + "_a"} d={buildArea(s.data)} fill={`url(#${id})`} />;
        })}

        {/* Lines */}
        {series.map(s => (
          <path key={s.name + "_l"} d={buildLine(s.data)}
            fill="none" stroke={s.color}
            strokeWidth={s.bold ? 2.5 : 1.8}
            strokeLinejoin="round" strokeLinecap="round"
          />
        ))}

        {/* Hover line */}
        {hoverIdx !== null && (
          <line
            x1={xOf(hoverIdx)} x2={xOf(hoverIdx)} y1={mt} y2={mt + ch}
            stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3"
          />
        )}

        {/* Hover dots */}
        {hoverIdx !== null && series.map(s => {
          const v = s.data[hoverIdx];
          if (v === null || v === undefined) return null;
          return (
            <circle key={s.name + "_d"}
              cx={xOf(hoverIdx)} cy={yOf(v)} r="4.5"
              fill={s.color} stroke="#fff" strokeWidth="2"
            />
          );
        })}

        {/* Legend */}
        {series.map((s, i) => (
          <g key={s.name + "_leg"} transform={`translate(${ml + i * legendItemW}, ${H - 8})`}>
            <circle cx="4" cy="-1" r="4" fill={s.color} />
            <text x="11" y="3" fontSize="9" fill="#64748b" fontFamily="sans-serif">{s.name}</text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && (() => {
        const vals = series
          .map(s => ({ name: s.name, v: s.data[hoverIdx], color: s.color }))
          .filter(x => x.v !== null && x.v !== undefined);
        if (!vals.length) return null;
        const leftPct = xOf(hoverIdx) / W * 100;
        const toRight = leftPct < 50;
        return (
          <div style={{
            position: "absolute",
            left: leftPct + "%",
            top: "4px",
            transform: toRight ? "translateX(8px)" : "translateX(calc(-100% - 8px))",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "8px 12px",
            boxShadow: "0 4px 16px rgba(0,0,0,.1)",
            fontSize: 11,
            pointerEvents: "none",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{labels[hoverIdx]}</div>
            {vals.map(x => (
              <div key={x.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: x.color }} />
                <span style={{ color: "#475569" }}>{x.name}:</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {(Math.round((x.v as number) * 10) / 10).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}万
                </span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
