"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProcessTemplate } from "@/lib/project-types";

export default function ProcessTemplatesPage() {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = () => {
    fetch("/api/process-templates").then((r) => r.json()).then((d) => setTemplates(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const patch = async (id: string, body: Record<string, unknown>) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...body } as ProcessTemplate : t)));
    await fetch(`/api/process-templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const addTemplate = async () => {
    if (!newName.trim() || !newCategory.trim()) return;
    setSaving(true);
    const res = await fetch("/api/process-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), category: newCategory.trim() }),
    });
    if (res.ok) { setNewName(""); reload(); }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>読み込み中...</div>;

  return (
    <div style={{ padding: "16px 14px 40px" }}>
      <Link href="/projects/settings" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← 設定</Link>
      <div className="section-title" style={{ marginTop: 12 }}>工程マスター</div>
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
        ここで追加・編集した工程は、以降「新規登録」する案件から自動で反映されます（既存案件には影響しません）。
      </p>

      {categories.map((cat) => (
        <div key={cat} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#3b82f6", marginBottom: 8 }}>{cat}</div>
          {templates.filter((t) => t.category === cat).sort((a, b) => a.sort_order - b.sort_order).map((t) => (
            <div key={t.id} className="card-flat" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, opacity: t.is_active ? 1 : 0.5 }}>
              <input
                type="number"
                defaultValue={t.sort_order}
                onBlur={(e) => patch(t.id, { sort_order: Number(e.target.value) })}
                style={{ width: 44, fontSize: 12, padding: "6px 4px", border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "center" }}
              />
              <input
                defaultValue={t.name}
                onBlur={(e) => patch(t.id, { name: e.target.value })}
                className="input-base"
                style={{ flex: 1, padding: "7px 10px" }}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={t.is_active} onChange={(e) => patch(t.id, { is_active: e.target.checked })} />
                表示
              </label>
            </div>
          ))}
        </div>
      ))}

      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>新しい工程を追加</div>
        <input className="input-base" placeholder="工程名" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ marginBottom: 8 }} />
        <input className="input-base" placeholder="カテゴリ（例：営業・契約）" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} list="category-options" style={{ marginBottom: 10 }} />
        <datalist id="category-options">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
        <button className="btn-primary" onClick={addTemplate} disabled={saving} style={{ width: "100%" }}>追加する</button>
      </div>
    </div>
  );
}
