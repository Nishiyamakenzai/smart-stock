"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Source } from "@/lib/project-types";
import { useCurrentMember } from "@/lib/useCurrentMember";
import MemberPickerModal from "@/components/projects/MemberPickerModal";

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 };
const fieldWrap: React.CSSProperties = { marginBottom: 14 };

export default function NewProjectPage() {
  const router = useRouter();
  const { members, currentId, setCurrentId, currentMember } = useCurrentMember();
  const [sources, setSources] = useState<Source[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [sourceId, setSourceId] = useState("");
  const [address, setAddress] = useState("");
  const [buildingAge, setBuildingAge] = useState("");
  const [customerAgeRange, setCustomerAgeRange] = useState("");
  const [workContent, setWorkContent] = useState("");
  const [constructionPeriod, setConstructionPeriod] = useState("契約後入力");

  useEffect(() => {
    fetch("/api/project-sources")
      .then((r) => r.json())
      .then((data) => setSources(Array.isArray(data) ? data.filter((s: Source) => s.is_active) : []));
  }, []);

  const submit = async () => {
    if (!name.trim()) { setErr("案件名を入力してください"); return; }
    if (!currentId) { setShowPicker(true); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, customer_name: customerName, occurred_at: occurredAt, source_id: sourceId || null,
          address, building_age: buildingAge, customer_age_range: customerAgeRange,
          work_content: workContent, construction_period: constructionPeriod, created_by: currentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "登録に失敗しました"); return; }
      router.push(`/projects/${data.id}`);
    } catch {
      setErr("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <div className="section-title">案件登録</div>

      {!currentMember && (
        <div style={{ padding: "10px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, fontSize: 12, color: "#c2410c", marginBottom: 14 }}>
          登録者を記録するため、送信時に「あなたは誰ですか」を選択してもらいます
        </div>
      )}

      <div className="card">
        <div style={fieldWrap}>
          <label style={labelStyle}>案件名 *</label>
          <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="例：渡辺様邸" />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>お客様名</label>
          <input className="input-base" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="例：渡辺隆" />
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
          <input className="input-base" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="例：富士吉田市〇〇" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>築年数</label>
            <input className="input-base" value={buildingAge} onChange={(e) => setBuildingAge(e.target.value)} placeholder="例：築18年" />
          </div>
          <div>
            <label style={labelStyle}>お客様年齢・年代</label>
            <input className="input-base" value={customerAgeRange} onChange={(e) => setCustomerAgeRange(e.target.value)} placeholder="例：55歳くらい" />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>工事内容</label>
          <input className="input-base" value={workContent} onChange={(e) => setWorkContent(e.target.value)} placeholder="例：外壁・屋根塗装・雨漏り" />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>工期</label>
          <input className="input-base" value={constructionPeriod} onChange={(e) => setConstructionPeriod(e.target.value)} placeholder="契約後入力" />
        </div>

        {err && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>
            ⚠ {err}
          </div>
        )}

        <button className="btn-primary" onClick={submit} disabled={saving} style={{ width: "100%", padding: 13, fontSize: 14 }}>
          {saving ? "登録中..." : "この内容で登録する"}
        </button>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 10, textAlign: "center" }}>
          登録すると、営業・契約〜完工・アフターまでの標準工程が自動で作成されます
        </p>
      </div>

      {showPicker && (
        <MemberPickerModal
          members={members}
          onSelect={(id) => { setCurrentId(id); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
