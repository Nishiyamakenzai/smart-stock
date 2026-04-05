"use client";
import { useState } from "react";
import Modal from "./Modal";
import NumberInput from "../ui/NumberInput";
import { C } from "@/lib/constants";
import type { BSData } from "@/lib/types";

export default function BSModal({ bs, onSave, onClose }: { bs:BSData; onSave:(b:BSData)=>void; onClose:()=>void }) {
  const [b, setB] = useState<BSData>({...bs});
  const ta=(b.cash||0)+(b.receivable||0)+(b.inventory||0)+(b.fixedAsset||0)+(b.otherAsset||0);
  const td=(b.payable||0)+(b.shortLoan||0)+(b.longLoan||0)+(b.otherDebt||0);
  const eq=ta-td;

  const assets: [string, keyof BSData][] = [["現金","cash"],["売掛金","receivable"],["棚卸","inventory"],["固定資産","fixedAsset"],["その他","otherAsset"]];
  const debts: [string, keyof BSData][] = [["買掛金","payable"],["短期借入","shortLoan"],["長期借入","longLoan"],["その他","otherDebt"]];

  return (
    <Modal title="B/S 貸借対照表を編集" onClose={onClose}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:C.blue, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ padding:"2px 10px", background:C.blueLight, borderRadius:99 }}>資産</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {assets.map(([l,k]) => <NumberInput key={k} label={l} value={b[k]||0} onChange={v=>setB({...b,[k]:v})} unit="万"/>)}
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:C.red, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ padding:"2px 10px", background:C.redLight, borderRadius:99 }}>負債</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {debts.map(([l,k]) => <NumberInput key={k} label={l} value={b[k]||0} onChange={v=>setB({...b,[k]:v})} unit="万"/>)}
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[{l:"総資産",v:ta,c:C.blue,bg:C.blueLight},{l:"負債",v:td,c:C.red,bg:C.redLight},{l:"純資産",v:eq,c:C.greenDark,bg:C.greenLight}].map(k => (
          <div key={k.l} style={{ textAlign:"center", padding:"10px 8px", background:k.bg, borderRadius:12 }}>
            <div style={{ fontSize:10, color:k.c, marginBottom:4, fontWeight:600 }}>{k.l}</div>
            <div style={{ fontSize:16, fontWeight:800, color:k.c }}>{k.v.toLocaleString()}万</div>
          </div>
        ))}
      </div>
      <button onClick={() => { onSave(b); onClose(); }} className="btn-primary" style={{ width:"100%", borderRadius:10 }}>
        保存する
      </button>
    </Modal>
  );
}
