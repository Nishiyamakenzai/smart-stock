"use client";
import { useState } from "react";
import Modal from "./Modal";
import Badge from "../ui/Badge";
import NumberInput from "../ui/NumberInput";
import { C, VK, VL, MS, STC, STCBG } from "@/lib/constants";
import { newV, totalV } from "@/lib/data";
import { aiProject, fmt1, fmtPct } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface ProjectModalProps {
  project: Project | null;
  onSave: (p: Project) => void;
  onClose: () => void;
  onDelete?: (id: number) => void;
}

export default function ProjectModal({ project, onSave, onClose, onDelete }: ProjectModalProps) {
  const [f, setF] = useState<Project>(project || {id:0, name:"", month:4, p:190, v:newV(), status:"契約済"});
  const tv = totalV(f.v), m = f.p - tv;
  const mr = f.p > 0 ? m / f.p * 100 : 0;
  const hints = f.name ? aiProject(f) : [];

  const selectStyle = {
    width:"100%", padding:"9px 12px",
    background:"#f8fafc", border:"1.5px solid #e2e8f0",
    borderRadius:10, fontSize:13, color:C.t1,
    outline:"none", cursor:"pointer",
  };

  return (
    <Modal title={project ? "案件編集" : "新規案件"} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:C.t2, fontWeight:600, display:"block", marginBottom:5 }}>案件名</label>
          <input type="text" value={f.name}
            onChange={e => setF({...f, name:e.target.value})}
            placeholder="例：田中邸 外壁塗装"
            className="input-base" style={{ fontSize:14 }}
          />
        </div>

        <div className="modal-3col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <div>
            <label style={{ fontSize:12, color:C.t2, fontWeight:600, display:"block", marginBottom:5 }}>施工月</label>
            <select value={f.month} onChange={e => setF({...f, month:+e.target.value})} style={selectStyle as React.CSSProperties}>
              {MS.map((m2,i) => <option key={i} value={i}>{m2}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:C.t2, fontWeight:600, display:"block", marginBottom:5 }}>ステータス</label>
            <select value={f.status} onChange={e => setF({...f, status:e.target.value})} style={selectStyle as React.CSSProperties}>
              {Object.keys(STC).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <NumberInput label="P（売上）" value={f.p} onChange={v => setF({...f, p:v})} unit="万"/>
        </div>

        <div style={{ background:C.card3, borderRadius:14, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:10 }}>V（原価）内訳</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {VK.map(k => (
              <NumberInput key={k} label={VL[k]}
                value={f.v[k as keyof typeof f.v]||0}
                onChange={val => setF({...f, v:{...f.v,[k]:val}})} unit="万"/>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:14 }}>
            {[
              { l:"V合計", v:`${fmt1(tv)}万`, c:C.t1, bg:C.card },
              { l:"M粗利", v:`${fmt1(m)}万`, c:m>=0?C.greenDark:C.red, bg:m>=0?C.greenLight:C.redLight },
              { l:"粗利率", v:`${fmtPct(mr)}%`, c:mr>=48?C.greenDark:mr>=40?"#92400e":C.red, bg:mr>=48?C.greenLight:mr>=40?C.yellowLight:C.redLight },
            ].map(k => (
              <div key={k.l} style={{ textAlign:"center", padding:"10px 8px", background:k.bg, borderRadius:10 }}>
                <div style={{ fontSize:10, color:C.t2, marginBottom:4 }}>{k.l}</div>
                <div style={{ fontSize:18, fontWeight:800, color:k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>

        {hints.length > 0 && (
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:C.blue, marginBottom:6 }}>AI分析</div>
            {hints.map((h,i) => <Badge key={i} type={h.t} text={h.s}/>)}
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {project && onDelete && (
            <button onClick={() => { onDelete(project.id); onClose(); }}
              style={{ padding:"10px 16px", background:C.redLight, color:C.red, border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              削除
            </button>
          )}
          <button onClick={() => { onSave(f); onClose(); }} className="btn-primary" style={{ flex:1, borderRadius:10 }}>
            {project ? "更新する" : "案件を追加"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
