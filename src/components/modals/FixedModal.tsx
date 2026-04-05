"use client";
import { useState } from "react";
import Modal from "./Modal";
import { C, MS, FK, FL } from "@/lib/constants";
import type { MonthlyFixed, AnnualBudget } from "@/lib/types";

interface FixedModalProps {
  mfData: MonthlyFixed;
  abData: AnnualBudget;
  onSave: (mf: MonthlyFixed, ab: AnnualBudget) => void;
  onClose: () => void;
}

export default function FixedModal({ mfData, abData, onSave, onClose }: FixedModalProps) {
  const [mf2, setMf2] = useState<MonthlyFixed>(JSON.parse(JSON.stringify(mfData)));
  const [ab2, setAb2] = useState<AnnualBudget>({...abData});
  const [mode, setMode] = useState<"monthly"|"annual">("monthly");
  const [em, setEm] = useState(0);

  const handleSave = () => {
    if (mode === "annual") {
      const nm: MonthlyFixed = {};
      for (let i = 0; i < 12; i++) nm[i] = { f1:Math.round((ab2.f1||0)/12), f2:Math.round((ab2.f2||0)/12), f3:Math.round((ab2.f3||0)/12), f4:Math.round((ab2.f4||0)/12), f5:Math.round((ab2.f5||0)/12) };
      onSave(nm, ab2);
    } else { onSave(mf2, ab2); }
    onClose();
  };

  return (
    <Modal title="固定費 F1〜F5 設定" onClose={onClose}>
      <div style={{ display:"flex", gap:4, marginBottom:16, background:C.card3, borderRadius:10, padding:4 }}>
        {(["monthly","annual"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, padding:"7px", border:"none", borderRadius:8,
            fontSize:12, fontWeight:700,
            background:mode===m?"#fff":undefined,
            color:mode===m?C.blue:C.t2,
            cursor:"pointer",
            boxShadow:mode===m?"0 1px 4px rgba(0,0,0,.08)":undefined,
            transition:"all .15s",
          }}>{m==="monthly"?"月次入力":"年間→按分"}</button>
        ))}
      </div>

      {mode==="monthly" ? (
        <div>
          <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:12 }}>
            {MS.map((m,i) => (
              <button key={i} onClick={() => setEm(i)} style={{
                padding:"4px 10px", border:"1px solid", borderRadius:99,
                fontSize:11, fontWeight:600, cursor:"pointer",
                borderColor:em===i?C.blue:C.bdr,
                background:em===i?C.blueLight:"#fff",
                color:em===i?C.blue:C.t2,
                transition:"all .15s",
              }}>{m}</button>
            ))}
          </div>
          {FK.map(k => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:12, color:C.t2, width:100, flexShrink:0, fontWeight:500 }}>{FL[k]}</span>
              <input type="number" value={mf2[em]?.[k]||0}
                onChange={e => {
                  const n: MonthlyFixed = JSON.parse(JSON.stringify(mf2));
                  if (!n[em]) n[em] = {f1:0,f2:0,f3:0,f4:0,f5:0};
                  (n[em] as unknown as Record<string,number>)[k] = parseFloat(e.target.value)||0;
                  setMf2(n);
                }}
                className="input-base" style={{ maxWidth:100, textAlign:"right" }}/>
              <span style={{ fontSize:12, color:C.t3 }}>万</span>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {FK.map(k => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:12, color:C.t2, width:100, flexShrink:0, fontWeight:500 }}>{FL[k]}</span>
              <input type="number" value={ab2[k]||0}
                onChange={e => setAb2({...ab2,[k]:parseFloat(e.target.value)||0})}
                className="input-base" style={{ maxWidth:100, textAlign:"right" }}/>
              <span style={{ fontSize:12, color:C.t3 }}>万/年</span>
              <span style={{ fontSize:11, color:C.blue, fontWeight:600 }}>
                → {((ab2[k]||0)/12).toFixed(0)}/月
              </span>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSave} className="btn-primary" style={{ width:"100%", marginTop:16, borderRadius:10 }}>
        保存する
      </button>
    </Modal>
  );
}
