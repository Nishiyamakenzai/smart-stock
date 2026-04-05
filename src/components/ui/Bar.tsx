interface BarProps {
  value: number;
  max: number;
  color?: string;
  h?: number;
  showLabel?: boolean;
  label?: string;
  valueLabel?: string;
}

export default function Bar({ value, max, color = "#3b82f6", h = 8, showLabel, label, valueLabel }: BarProps) {
  const pct = max > 0 ? Math.min(value / max * 100, 100) : 0;
  const isOver = value > max && max > 0;

  return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
          <span style={{ color:"#475569", fontWeight:500 }}>{label}</span>
          <span style={{ color:isOver ? "#10b981" : "#0f172a", fontWeight:700 }}>
            {valueLabel || value.toLocaleString()}
          </span>
        </div>
      )}
      <div style={{
        height:h,
        background:"#f1f5f9",
        borderRadius:h,
        overflow:"hidden",
        position:"relative",
      }}>
        <div style={{
          width:pct+"%",
          height:"100%",
          borderRadius:h,
          background:color,
          transition:"width .8s cubic-bezier(.16,1,.3,1)",
          boxShadow:`0 0 6px ${color}55`,
        }}/>
      </div>
    </div>
  );
}
