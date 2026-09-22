"use client";
import { useState } from "react";
import type { Project, Source } from "@/lib/project-types";

interface Props {
  project: Project;
  sources: Source[];
  onConfirm: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 };
const fieldWrap: React.CSSProperties = { marginBottom: 14 };

/** 案件の基本情報を修正するモーダル（間違って登録した内容を直したいとき用） */
export default function ProjectEditModal({ project, sources, onConfirm, onClose }: Props) {
  const [name, setName] = useState(project.name);
  const [customerName, setCustomerName] = useState(project.customer_name ?? "");
  const [occurredAt, setOccurredAt] = useState(project.occurred_at ?? "");
  const [sourceId, setSourceId] = useState(project.source_id ?? "");
  const [address, setAddress] = useState(project.address ?? "");
  const [buildingAge, setBuildingAge] = useState(project.building_age ?? "");
  const [customerAgeRange, setCustomerAgeRange] = useState(project.customer_age_range ?? "");
  const [workContent, setWorkContent] = useState(project.work_content ?? "");
  const [constructionPeriod, setConstructionPeriod] = useState(project.construction_period ?? "");
  const [err, setErr] = useState("");

  const confirm = () => {
    if (!name.trim()) { setErr("案件名を入力してください"); return; }
    onConfirm({
      name: name.trim(), customer_name: customerName, occurred_at: occurredAt || null, source_id: sourceId || null,
      address, building_age: buildingAge, customer_age_range: customerAgeRange,
      work_content: workContent, construction_period: constructionPeriod,
    });
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 18px calc(20px + env(safe-area-inset-bottom))", maxHeight: "85vh", overflowY: "auto", animation: "slideUp .25s ease" }}>
        <div style={{ width: 36, height: 4, background: "#e2e8f0", borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>案件情報を編集</div>

        <div style={fieldWrap}>
          <label style={labelStyle}>案件名 *</label>
          <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>お客様名</label>
          <input className="input-base" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>発生日</label>
            <input type="date" className="input-base" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>発生源</label>
            <select className="input-base" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="">選択してください</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>住所</label>
          <input className="input-base" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>築年数</label>
            <input className="input-base" value={buildingAge} onChange={(e) => setBuildingAge(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>お客様年齢・年代</label>
            <input className="input-base" value={customerAgeRange} onChange={(e) => setCustomerAgeRange(e.target.value)} />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>工事内容</label>
          <input className="input-base" value={workContent} onChange={(e) => setWorkContent(e.target.value)} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>工期</label>
          <input className="input-base" value={constructionPeriod} onChange={(e) => setConstructionPeriod(e.target.value)} />
        </div>

        {err && <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 10 }}>⚠ {err}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>キャンセル</button>
          <button onClick={confirm} className="btn-primary" style={{ flex: 2 }}>保存する</button>
        </div>
      </div>
    </div>
  );
}
