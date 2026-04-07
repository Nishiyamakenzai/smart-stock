"use client";
import { useState } from "react";
import Modal from "./Modal";
import NumberInput from "../ui/NumberInput";
import { C, MS, FL1, FL2, FL3, FL4, FL5 } from "@/lib/constants";
import { defaultFixedCosts, migrateMF, migrateAB } from "@/lib/data";
import { fmt1 } from "@/lib/utils";
import type { MonthlyFixed, AnnualBudget, FixedCosts, F1Items, F2Items, F3Items, F4Items, F5Items } from "@/lib/types";

type FKey = "f1" | "f2" | "f3" | "f4" | "f5";

const SECTIONS: Array<{
  key: FKey;
  label: string;
  color: string;
  bg: string;
  items: Record<string, string>;
}> = [
  { key:"f1", label:"F1 人件費",      color:C.blue,   bg:C.blueLight,   items:FL1 },
  { key:"f2", label:"F2 経費",        color:C.green,  bg:C.greenLight,  items:FL2 },
  { key:"f3", label:"F3 戦略費",      color:C.purple, bg:C.purpleLight, items:FL3 },
  { key:"f4", label:"F4 金利",        color:C.red,    bg:C.redLight,    items:FL4 },
  { key:"f5", label:"F5 保険・顧問等", color:C.orange, bg:C.orangeLight, items:FL5 },
];

const sumSection = (obj: Record<string, number>): number =>
  Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);

const div12 = (obj: object): Record<string, number> =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Math.round((Number(v) || 0) / 12)]));

interface Props {
  mfData: MonthlyFixed;
  abData: AnnualBudget;
  onSave: (mf: MonthlyFixed, ab: AnnualBudget) => void;
  onClose: () => void;
}

export default function FixedModal({ mfData, abData, onSave, onClose }: Props) {
  // 防御的マイグレーション: 旧形式データ(number)を新形式(object)に変換
  const [mf2, setMf2] = useState<MonthlyFixed>(() => migrateMF(JSON.parse(JSON.stringify(mfData))));
  const [ab2, setAb2] = useState<AnnualBudget>(() => migrateAB(JSON.parse(JSON.stringify(abData))));
  const [mode, setMode] = useState<"monthly" | "annual">("monthly");
  const [em, setEm] = useState(0);
  const [open, setOpen] = useState<FKey | null>("f1");

  const handleSave = () => {
    if (mode === "annual") {
      const monthly: FixedCosts = {
        f1: div12(ab2.f1) as unknown as F1Items,
        f2: div12(ab2.f2) as unknown as F2Items,
        f3: div12(ab2.f3) as unknown as F3Items,
        f4: div12(ab2.f4) as unknown as F4Items,
        f5: div12(ab2.f5) as unknown as F5Items,
      };
      const nm: MonthlyFixed = {};
      for (let i = 0; i < 12; i++) nm[i] = JSON.parse(JSON.stringify(monthly));
      onSave(nm, ab2);
    } else {
      onSave(mf2, ab2);
    }
    onClose();
  };

  const updateMonthly = (fkey: FKey, subkey: string, val: number) => {
    setMf2(prev => {
      const n: MonthlyFixed = JSON.parse(JSON.stringify(prev));
      if (!n[em]) n[em] = defaultFixedCosts();
      (n[em][fkey] as unknown as Record<string, number>)[subkey] = val;
      return n;
    });
  };

  const updateAnnual = (fkey: FKey, subkey: string, val: number) => {
    setAb2(prev => {
      const n: AnnualBudget = JSON.parse(JSON.stringify(prev));
      (n[fkey] as unknown as Record<string, number>)[subkey] = val;
      return n;
    });
  };

  const currentMonth = mf2[em] || defaultFixedCosts();

  return (
    <Modal title="固定費 F1〜F5 設定" onClose={onClose}>
      {/* モード切替 */}
      <div style={{ display:"flex", gap:4, marginBottom:16, background:C.card3, borderRadius:10, padding:4 }}>
        {(["monthly","annual"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, padding:"7px", border:"none", borderRadius:8,
            fontSize:12, fontWeight:700,
            background: mode===m ? "#fff" : "transparent",
            color: mode===m ? C.blue : C.t2,
            cursor:"pointer",
            boxShadow: mode===m ? "0 1px 4px rgba(0,0,0,.08)" : "none",
            transition:"all .15s",
          }}>{m==="monthly" ? "月次入力" : "年間→按分"}</button>
        ))}
      </div>

      {/* 月選択（月次モードのみ） */}
      {mode === "monthly" && (
        <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:14 }}>
          {MS.map((m, i) => (
            <button key={i} onClick={() => setEm(i)} style={{
              padding:"4px 10px", border:"1px solid", borderRadius:99,
              fontSize:11, fontWeight:600, cursor:"pointer",
              borderColor: em===i ? C.blue : C.bdr,
              background:  em===i ? C.blueLight : "#fff",
              color:       em===i ? C.blue : C.t2,
              transition:"all .15s",
            }}>{m}</button>
          ))}
        </div>
      )}

      {/* アコーディオン */}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {SECTIONS.map(sec => {
          const isOpen = open === sec.key;
          const data = (mode === "monthly" ? currentMonth[sec.key] : ab2[sec.key]) as unknown as Record<string, number>;
          const total = sumSection(data);

          return (
            <div key={sec.key} style={{
              border: `1.5px solid ${isOpen ? sec.color + "50" : C.bdr}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "border-color .2s",
            }}>
              {/* ヘッダー（クリックで開閉） */}
              <button
                onClick={() => setOpen(isOpen ? null : sec.key)}
                style={{
                  width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"11px 14px",
                  background: isOpen ? sec.bg : "#fff",
                  border:"none", cursor:"pointer",
                  transition:"background .2s",
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{
                    padding:"2px 10px", borderRadius:99,
                    background: sec.color, color:"#fff",
                    fontSize:11, fontWeight:700, flexShrink:0,
                  }}>{sec.label}</span>
                  <span style={{ fontSize:14, fontWeight:800, color: sec.color }}>
                    {fmt1(total)}万
                  </span>
                  {mode === "annual" && total > 0 && (
                    <span style={{ fontSize:11, color:C.t3 }}>
                      → {fmt1(Math.round(total / 12))}万/月
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize:11, color:C.t3,
                  display:"inline-block",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition:"transform .2s",
                }}>▼</span>
              </button>

              {/* 本体（展開時） */}
              {isOpen && (
                <div style={{
                  padding:"12px 14px",
                  borderTop:`1px solid ${sec.color}20`,
                  background:"#fafafa",
                }}>
                  {Object.entries(sec.items).map(([subkey, sublabel]) => (
                    <div key={subkey} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <span style={{
                        fontSize:12, color:C.t2, fontWeight:500,
                        flex:"0 0 150px", lineHeight:1.3,
                      }}>{sublabel}</span>
                      <NumberInput
                        value={data[subkey] || 0}
                        onChange={v => mode === "monthly"
                          ? updateMonthly(sec.key, subkey, v)
                          : updateAnnual(sec.key, subkey, v)
                        }
                        sx={{ flex:1 }}
                      />
                      <span style={{ fontSize:12, color:C.t3, flexShrink:0, minWidth:28 }}>
                        {mode === "annual" ? "万/年" : "万"}
                      </span>
                      {mode === "annual" && (
                        <span style={{
                          fontSize:11, color:C.blue, fontWeight:600,
                          flexShrink:0, minWidth:42, textAlign:"right",
                        }}>
                          →{Math.round((data[subkey] || 0) / 12)}/月
                        </span>
                      )}
                    </div>
                  ))}
                  {/* セクション小計 */}
                  <div style={{
                    marginTop:8, paddingTop:8,
                    borderTop:`1px dashed ${C.bdr}`,
                    display:"flex", justifyContent:"flex-end", gap:12,
                    fontSize:12, fontWeight:700, color:sec.color,
                  }}>
                    <span>小計: {fmt1(total)}万{mode === "annual" ? "/年" : "/月"}</span>
                    {mode === "annual" && <span>（{fmt1(Math.round(total / 12))}万/月）</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={handleSave} className="btn-primary" style={{ width:"100%", marginTop:16, borderRadius:10 }}>
        {mode === "annual" ? "按分して全月に適用" : "保存する"}
      </button>
    </Modal>
  );
}
