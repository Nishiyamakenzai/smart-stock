"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Source, LostReason } from "@/lib/project-types";

function MasterList<T extends { id: string; name: string; is_active: boolean; display_order: number }>({
  title, items, apiBase, onChange,
}: {
  title: string;
  items: T[];
  apiBase: string;
  onChange: (id: string, body: Record<string, unknown>) => void;
}) {
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setSaving(false);
    onChange("", {}); // trigger reload from parent
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="section-title">{title}</div>
      {items.sort((a, b) => a.display_order - b.display_order).map((it) => (
        <div key={it.id} className="card-flat" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, opacity: it.is_active ? 1 : 0.5 }}>
          <input
            defaultValue={it.name}
            onBlur={(e) => onChange(it.id, { name: e.target.value })}
            className="input-base"
            style={{ flex: 1, padding: "7px 10px" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={it.is_active} onChange={(e) => onChange(it.id, { is_active: e.target.checked })} />
            表示
          </label>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input className="input-base" placeholder="新しい選択肢を追加" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="btn-primary" onClick={add} disabled={saving} style={{ flexShrink: 0 }}>追加</button>
      </div>
    </div>
  );
}

export default function MastersPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [lostReasons, setLostReasons] = useState<LostReason[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    Promise.all([
      fetch("/api/project-sources").then((r) => r.json()),
      fetch("/api/project-lost-reasons").then((r) => r.json()),
    ]).then(([s, l]) => {
      setSources(Array.isArray(s) ? s : []);
      setLostReasons(Array.isArray(l) ? l : []);
    }).finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const patchSource = async (id: string, body: Record<string, unknown>) => {
    if (id) await fetch(`/api/project-sources/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    reload();
  };
  const patchLostReason = async (id: string, body: Record<string, unknown>) => {
    if (id) await fetch(`/api/project-lost-reasons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    reload();
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>読み込み中...</div>;

  return (
    <div style={{ padding: "16px 14px 40px" }}>
      <Link href="/projects/settings" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← 設定</Link>
      <div style={{ marginTop: 12 }}>
        <MasterList title="発生源" items={sources} apiBase="/api/project-sources" onChange={patchSource} />
        <MasterList title="失注理由" items={lostReasons} apiBase="/api/project-lost-reasons" onChange={patchLostReason} />
      </div>
    </div>
  );
}
