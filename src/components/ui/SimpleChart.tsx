"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

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

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"#ffffff",
      border:"1px solid #e2e8f0",
      borderRadius:12,
      padding:"10px 14px",
      boxShadow:"0 4px 16px rgba(0,0,0,.1)",
      fontSize:12,
    }}>
      <div style={{ fontWeight:700, color:"#0f172a", marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:p.color }}/>
          <span style={{ color:"#475569" }}>{p.name}:</span>
          <span style={{ fontWeight:700, color:"#0f172a" }}>{p.value.toLocaleString()}万</span>
        </div>
      ))}
    </div>
  );
};

export default function SimpleChart({ series, labels, height = 200, showBreakeven }: SimpleChartProps) {
  if (!series?.length || !labels?.length) return null;

  const data = labels.map((label, i) => {
    const row: Record<string, string | number | null> = { label };
    series.forEach(s => { row[s.name] = s.data[i] ?? null; });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top:5, right:5, left:-20, bottom:0 }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.name} id={`grad_${s.name}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={s.color} stopOpacity={0.18}/>
              <stop offset="95%" stopColor={s.color} stopOpacity={0.02}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3"/>
        <XAxis
          dataKey="label"
          tick={{ fontSize:11, fill:"#94a3b8" }}
          axisLine={{ stroke:"#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize:10, fill:"#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
        />
        <Tooltip content={<CustomTooltip/>}/>
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize:12, paddingTop:8 }}
        />
        {series.map(s => (
          <Area
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={s.bold ? 2.5 : 1.8}
            fill={`url(#grad_${s.name})`}
            dot={false}
            activeDot={{ r:5, stroke:"#fff", strokeWidth:2 }}
            connectNulls={false}
          />
        ))}
        {showBreakeven && (
          <ReferenceLine
            y={0}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value:"BEP", fill:"#ef4444", fontSize:10 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
