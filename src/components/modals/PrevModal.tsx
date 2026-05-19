"use client";
import { useState } from "react";
import Modal from "./Modal";
import { C } from "@/lib/constants";
import type { PrevPeriod } from "@/lib/types";

const FIELDS: [keyof PrevPeriod, string, string][] = [
  ["pq",   "PQ 売上",   "万"],
  ["vq",   "VQ 変動費", "万"],
  ["mq",   "MQ 粗利",   "万"],
  ["f",    "F 固定費",  "万"],
  ["g",    "G 利益",    "万"],
  ["q",    "Q 件数",    "件"],
  ["avgP", "平均単価P", "万"],
];

function PeriodForm({
  label, value, onChange,
}: { label: string; value: PrevPeriod; onChange: (v: PrevPeriod) => void }) {
  const [strs, setStrs] = useState<Record<string, string>>(
    () => Object.fromEntries(FIELDS.map(([k]) => [k, String(value[k])])),
  );

  const handleChange = (k: keyof PrevPeriod, s: string) => {
    if (s !== "" && !/^-?\d*\.?\d*$/.test(s)) return;
    setStrs(prev => ({ ...prev, [k]: s }));
    const n = parseFloat(s);
    if (!isNaN(n)) onChange({ ...value, [k]: n });
  };

  const handleBlur = (k: keyof PrevPeriod) => {
    const n = parseFloat(strs[k]);
    const final = isNaN(n) ? 0 : n;
    setStrs(prev => ({ ...prev, [k]: String(final) }));
    onChange({ ...value, [k]: final });
  };

  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 12, fontWeight: 800, color: C.t1, marginBottom: 10,
        padding: "6px 12px", background: C.card3, borderRadius: 8, textAlign: "center",
      }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {FIELDS.map(([k, label2, unit]) => (
          <div key={k} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: C.card2, borderRadius: 8, padding: "8px 10px",
          }}>
            <span style={{ fontSize: 11, color: C.t2, fontWeight: 600, flexShrink: 0 }}>{label2}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="text"
                inputMode="decimal"
                value={strs[k]}
                onChange={e => handleChange(k, e.target.value)}
                onBlur={() => handleBlur(k)}
                style={{
                  width: 72, padding: "5px 8px",
                  border: `1.5px solid ${C.bdr}`, borderRadius: 7,
                  fontSize: 14, fontWeight: 700, color: C.t1,
                  background: C.card, outline: "none", textAlign: "right",
                }}
              />
              <span style={{ fontSize: 11, color: C.t3, flexShrink: 0 }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  prev: PrevPeriod;
  prev2: PrevPeriod;
  onSave: (prev: PrevPeriod, prev2: PrevPeriod) => void;
  onClose: () => void;
}

export default function PrevModal({ prev, prev2, onSave, onClose }: Props) {
  const [p1, setP1] = useState<PrevPeriod>({ ...prev });
  const [p2, setP2] = useState<PrevPeriod>({ ...prev2 });

  return (
    <Modal title="前期・前々期データ入力" onClose={onClose}>
      <p style={{ fontSize: 12, color: C.t2, marginBottom: 14, lineHeight: 1.6 }}>
        期別比較グラフに使用する前期・前々期の実績値を入力してください。
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <PeriodForm label="前期" value={p1} onChange={setP1} />
        <PeriodForm label="前々期" value={p2} onChange={setP2} />
      </div>
      <button
        onClick={() => { onSave(p1, p2); onClose(); }}
        className="btn-primary"
        style={{ width: "100%", marginTop: 16, borderRadius: 10 }}
      >
        保存する
      </button>
    </Modal>
  );
}
