"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Project, ProjectStatus } from "@/lib/project-types";
import {
  PROJECT_STATUS_LIST, PROJECT_STATUS_ICONS, PROJECT_STATUS_COLORS,
  getCurrentProcess, getNextProcess, countDone, stagnationDays, formatDate,
} from "@/lib/project-types";

const STAGNATION_ALERT_DAYS = 3;

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "全て">("全て");
  const [onlyAlert, setOnlyAlert] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "全て" && p.status !== statusFilter) return false;
      const days = stagnationDays(p.processes ?? [], p.updated_at);
      if (onlyAlert && days < STAGNATION_ALERT_DAYS) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const haystack = `${p.name} ${p.customer_name ?? ""} ${p.address ?? ""}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [projects, keyword, statusFilter, onlyAlert]);

  return (
    <div style={{ padding: "14px 14px 24px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          className="input-base"
          placeholder="案件名・お客様名・住所で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ fontSize: 14 }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 8 }}>
        {(["全て", ...PROJECT_STATUS_LIST] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              flexShrink: 0, padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: statusFilter === s ? "1.5px solid #1e3a8a" : "1.5px solid #e2e8f0",
              background: statusFilter === s ? "#1e3a8a" : "#fff",
              color: statusFilter === s ? "#fff" : "#475569",
            }}
          >
            {s === "全て" ? "全て" : `${PROJECT_STATUS_ICONS[s]} ${s}`}
          </button>
        ))}
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569", marginBottom: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={onlyAlert} onChange={(e) => setOnlyAlert(e.target.checked)} />
        ⚠️ 要確認案件のみ（{STAGNATION_ALERT_DAYS}日以上停滞）
      </label>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>該当する案件がありません</div>
      ) : (
        filtered.map((p) => {
          const processes = p.processes ?? [];
          const current = getCurrentProcess(processes);
          const next = getNextProcess(processes);
          const { done, total } = countDone(processes);
          const days = stagnationDays(processes, p.updated_at);
          const alert = days >= STAGNATION_ALERT_DAYS && p.status === "進行中";
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className="card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{p.customer_name}</div>
                </div>
                <span
                  className="tag"
                  style={{ background: PROJECT_STATUS_COLORS[p.status] + "1a", color: PROJECT_STATUS_COLORS[p.status] }}
                >
                  {PROJECT_STATUS_ICONS[p.status]} {p.status}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 12, color: "#334155", marginTop: 8 }}>
                <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 8 }}>
                  現在：{current ? current.name : "全工程完了"}
                </span>
                {next && (
                  <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: 8 }}>
                    次：{next.name}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 11, color: "#94a3b8" }}>
                <span>発生日 {formatDate(p.occurred_at)} ／ 進捗 {done}/{total}</span>
                {alert ? (
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>⚠️ {days}日停滞</span>
                ) : (
                  <span>正常</span>
                )}
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
