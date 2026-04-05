type Rank = { label: string; rank: string; color: string; bg: string };

function getRank(ratio: number): Rank {
  if (ratio <= 59)  return { label:"超優良", rank:"S", color:"#1d4ed8", bg:"#eff6ff" };
  if (ratio <= 79)  return { label:"優良",   rank:"A", color:"#059669", bg:"#ecfdf5" };
  if (ratio <= 89)  return { label:"普通",   rank:"B", color:"#3b82f6", bg:"#eff6ff" };
  if (ratio <= 99)  return { label:"危険",   rank:"C", color:"#d97706", bg:"#fffbeb" };
  if (ratio <= 199) return { label:"赤字",   rank:"D", color:"#dc2626", bg:"#fef2f2" };
  return { label:"倒産路線", rank:"DD", color:"#7f1d1d", bg:"#fff1f2" };
}

export default function Gauge({ ratio }: { ratio: number }) {
  const pct = Math.min(ratio / 200, 1);
  const { label, rank, color, bg } = getRank(ratio);
  const a = (pct * 180 - 180) * Math.PI / 180;
  const needleX = 60 + 34 * Math.cos(a);
  const needleY = 60 + 34 * Math.sin(a);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
      <div style={{ flex:"0 0 auto" }}>
        <svg viewBox="0 0 130 78" style={{ width:200, maxWidth:"100%" }}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" x2="100%">
              <stop offset="0%"   stopColor="#3b82f6"/>
              <stop offset="30%"  stopColor="#10b981"/>
              <stop offset="55%"  stopColor="#f59e0b"/>
              <stop offset="80%"  stopColor="#ef4444"/>
              <stop offset="100%" stopColor="#7f1d1d"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <path d="M 12 62 A 53 53 0 0 1 118 62"
            fill="none" stroke="#f1f5f9" strokeWidth="10" strokeLinecap="round"/>
          {/* Filled arc */}
          <path d="M 12 62 A 53 53 0 0 1 118 62"
            fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(pct * 166).toFixed(1)} 999`}
            style={{ transition:"stroke-dasharray 1s cubic-bezier(.16,1,.3,1)" }}/>
          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const ta = (t * 180 - 180) * Math.PI / 180;
            return (
              <line key={i}
                x1={65 + 48 * Math.cos(ta)} y1={62 + 48 * Math.sin(ta)}
                x2={65 + 42 * Math.cos(ta)} y2={62 + 42 * Math.sin(ta)}
                stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
            );
          })}
          {/* Needle */}
          <line x1="65" y1="62" x2={needleX+5} y2={needleY+2}
            stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
          <line x1="65" y1="62" x2={needleX} y2={needleY}
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            filter="url(#glow)"
            style={{ transition:"x2 1s cubic-bezier(.16,1,.3,1), y2 1s cubic-bezier(.16,1,.3,1)" }}/>
          <circle cx="65" cy="62" r="5" fill={color}/>
          <circle cx="65" cy="62" r="3" fill="white"/>
          {/* Labels */}
          <text x="8"  y="74" fontSize="7" fill="#94a3b8" fontWeight="600">0%</text>
          <text x="65" y="11" fontSize="7" fill="#94a3b8" fontWeight="600" textAnchor="middle">100%</text>
          <text x="122" y="74" fontSize="7" fill="#94a3b8" fontWeight="600" textAnchor="end">200%</text>
        </svg>
      </div>

      <div style={{ flex:1, minWidth:120 }}>
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"6px 14px",
          background:bg,
          borderRadius:10,
          marginBottom:8,
        }}>
          <span style={{
            fontSize:22, fontWeight:900, color, lineHeight:1,
            fontVariantNumeric:"tabular-nums",
          }}>{rank}</span>
          <span style={{ fontSize:13, fontWeight:700, color }}>{label}</span>
        </div>
        <div style={{ fontSize:32, fontWeight:900, color, lineHeight:1, letterSpacing:"-0.5px" }}>
          {ratio.toFixed(1)}<span style={{ fontSize:16, fontWeight:600 }}>%</span>
        </div>
        <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>f/m比率（固定費÷粗利）</div>
      </div>
    </div>
  );
}
