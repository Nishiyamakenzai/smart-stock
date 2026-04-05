"use client";
import { useState } from "react";
import Modal from "./Modal";
import NumberInput from "../ui/NumberInput";
import { C } from "@/lib/constants";
import type { Targets } from "@/lib/types";

const FIELDS: [string, keyof Targets, string, string][] = [
  ["PQ 売上目標", "pq", "万", "💰"],
  ["MQ 粗利目標", "mq", "万", "📊"],
  ["G 利益目標",  "g",  "万", "🎯"],
  ["Q 件数目標",  "q",  "件", "🔢"],
  ["平均単価P",   "avgP","万", "💎"],
  ["目標粗利率",  "mRate","%","📈"],
];

export default function TargetModal({ targets, onSave, onClose }: { targets:Targets; onSave:(t:Targets)=>void; onClose:()=>void }) {
  const [t, setT] = useState<Targets>({...targets});
  const [strs, setStrs] = useState<Record<string,string>>(
    () => Object.fromEntries(FIELDS.map(([,k]) => [k, String(targets[k])])));

  return (
    <Modal title="年間目標設定" onClose={onClose}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {FIELDS.map(([l, k, u, icon]) => (
          <div key={k} style={{ padding:"12px 14px", background:C.card3, borderRadius:12 }}>
            <div style={{ fontSize:11, color:C.t2, fontWeight:600, marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
              <span>{icon}</span>{l}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <input
                type="text"
                inputMode="decimal"
                value={strs[k]}
                onChange={e => {
                  const s = e.target.value;
                  if (s !== "" && !/^-?\d*\.?\d*$/.test(s)) return;
                  setStrs({...strs, [k]: s});
                  const n = parseFloat(s);
                  if (!isNaN(n)) setT({...t, [k]: n});
                }}
                onBlur={() => {
                  const n = parseFloat(strs[k]);
                  const final = isNaN(n) ? 0 : n;
                  setStrs({...strs, [k]: String(final)});
                  setT({...t, [k]: final});
                }}
                className="input-base" style={{ fontWeight:700, fontSize:16 }}/>
              <span style={{ fontSize:12, color:C.t3, flexShrink:0 }}>{u}</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { onSave(t); onClose(); }} className="btn-primary" style={{ width:"100%", marginTop:16, borderRadius:10 }}>
        目標を保存
      </button>
    </Modal>
  );
}
