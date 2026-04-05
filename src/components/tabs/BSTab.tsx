"use client";
import Badge from "../ui/Badge";
import { C } from "@/lib/constants";
import type { BSData } from "@/lib/types";

interface BSTabProps {
  bs: BSData;
  onEdit: () => void;
}

export default function BSTab({ bs, onEdit }: BSTabProps) {
  const bTA = (bs.cash||0)+(bs.receivable||0)+(bs.inventory||0)+(bs.fixedAsset||0)+(bs.otherAsset||0);
  const bTD = (bs.payable||0)+(bs.shortLoan||0)+(bs.longLoan||0)+(bs.otherDebt||0);
  const bEQ = bTA - bTD;
  const bEQR = bTA > 0 ? bEQ / bTA * 100 : 0;

  const assets = [
    {l:"現金・預金", v:bs.cash||0, icon:"💴"},
    {l:"売掛金",     v:bs.receivable||0, icon:"📄"},
    {l:"棚卸資産",   v:bs.inventory||0, icon:"📦"},
    {l:"固定資産",   v:bs.fixedAsset||0, icon:"🏢"},
    {l:"その他資産", v:bs.otherAsset||0, icon:"📎"},
  ];
  const debts = [
    {l:"買掛金",   v:bs.payable||0, icon:"🧾"},
    {l:"短期借入", v:bs.shortLoan||0, icon:"📋"},
    {l:"長期借入", v:bs.longLoan||0, icon:"🏦"},
    {l:"その他負債",v:bs.otherDebt||0, icon:"📎"},
  ];

  return (
    <>
      <div style={{ fontSize:18, fontWeight:800, color:C.t1, marginBottom:14 }}>貸借対照表（B/S）</div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
        {[
          { l:"総資産", v:bTA, grad:C.gradBlue, icon:"📊" },
          { l:"負債合計", v:bTD, grad:C.gradRed, icon:"📉" },
          { l:"純資産", v:bEQ, grad:bEQ>=0?C.gradGreen:C.gradRed, icon:"💎" },
        ].map(it => (
          <div key={it.l} style={{ padding:"16px 14px", borderRadius:14, background:it.grad, color:"#fff", textAlign:"center", boxShadow:"0 4px 12px rgba(0,0,0,.1)" }}>
            <div style={{ fontSize:16, marginBottom:4 }}>{it.icon}</div>
            <div style={{ fontSize:9, opacity:.8, marginBottom:4, fontWeight:600 }}>{it.l}</div>
            <div style={{ fontSize:18, fontWeight:900 }}>{it.v.toLocaleString()}<span style={{ fontSize:9, opacity:.7, marginLeft:2 }}>万</span></div>
          </div>
        ))}
      </div>

      <div className="card stagger-item">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:11, color:C.t2, fontWeight:600, marginBottom:4 }}>自己資本比率</div>
            <div style={{ fontSize:36, fontWeight:900, color:bEQR>=40?C.green:C.yellow, lineHeight:1 }}>
              {bEQR.toFixed(1)}<span style={{ fontSize:16, fontWeight:600 }}>%</span>
            </div>
          </div>
          <div style={{
            width:80, height:80, borderRadius:"50%",
            background:`conic-gradient(${bEQR>=40?C.green:C.yellow} ${bEQR}%, #f1f5f9 0%)`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{ width:58, height:58, borderRadius:"50%", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:20 }}>{bEQR>=50?"💪":bEQR>=30?"👍":"⚠️"}</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop:12 }}>
          <Badge type={bEQR>=50?"good":bEQR>=30?"warn":"bad"}
            text={bEQR>=50?"自己資本比率50%超 — 非常に健全":bEQR>=30?"30〜50% — 平均的な水準":"30%未満 — 借入比率が高め。利益蓄積を推奨"}/>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div className="card stagger-item">
          <div style={{ fontSize:13, fontWeight:700, color:C.blue, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ padding:"3px 10px", background:C.blueLight, borderRadius:99, fontSize:11 }}>資産</span>
            <span style={{ fontSize:16, fontWeight:900, color:C.blue }}>{bTA.toLocaleString()}万</span>
          </div>
          {assets.map(a => (
            <div key={a.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid "+C.bdr }}>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ fontSize:13 }}>{a.icon}</span>
                <span style={{ fontSize:11, color:C.t2 }}>{a.l}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>{a.v.toLocaleString()}万</span>
            </div>
          ))}
        </div>

        <div className="card stagger-item">
          <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ padding:"3px 10px", background:C.redLight, borderRadius:99, fontSize:11 }}>負債</span>
            <span style={{ fontSize:16, fontWeight:900, color:C.red }}>{bTD.toLocaleString()}万</span>
          </div>
          {debts.map(a => (
            <div key={a.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid "+C.bdr }}>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ fontSize:13 }}>{a.icon}</span>
                <span style={{ fontSize:11, color:C.t2 }}>{a.l}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:C.red }}>{a.v.toLocaleString()}万</span>
            </div>
          ))}
          <div style={{ marginTop:10, padding:"10px 12px", background:C.greenLight, borderRadius:10, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:C.greenDark, fontWeight:600 }}>💎 純資産</span>
            <span style={{ fontSize:16, fontWeight:900, color:C.greenDark }}>{bEQ.toLocaleString()}万</span>
          </div>
        </div>
      </div>

      <button onClick={onEdit} className="btn-outline" style={{ width:"100%", padding:"13px", marginTop:4, borderRadius:12, fontSize:13 }}>
        B/S を編集する
      </button>
    </>
  );
}
