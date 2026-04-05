import type { CSSProperties } from "react";

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  sx?: CSSProperties;
}

export default function NumberInput({ label, value, onChange, unit, sx }: NumberInputProps) {
  return (
    <div style={sx || {}}>
      {label && (
        <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:4 }}>{label}</div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="input-base"
        />
        {unit && (
          <span style={{
            fontSize:12, color:"#94a3b8", fontWeight:600,
            flexShrink:0, minWidth:20
          }}>{unit}</span>
        )}
      </div>
    </div>
  );
}
