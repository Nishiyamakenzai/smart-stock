"use client";
import { useState, useEffect, type CSSProperties } from "react";

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  sx?: CSSProperties;
}

export default function NumberInput({ label, value, onChange, unit, sx }: NumberInputProps) {
  const [str, setStr] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setStr(String(value));
  }, [value, focused]);

  return (
    <div style={sx || {}}>
      {label && (
        <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:4 }}>{label}</div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <input
          type="text"
          inputMode="decimal"
          value={str}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            const n = parseFloat(str);
            const final = isNaN(n) ? 0 : n;
            setStr(String(final));
            onChange(final);
          }}
          onChange={e => {
            const s = e.target.value;
            if (s !== "" && !/^-?\d*\.?\d*$/.test(s)) return;
            setStr(s);
            const n = parseFloat(s);
            if (!isNaN(n)) onChange(n);
          }}
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
