"use client";
import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import type { Project, ProjectProcess, ProcessLog, LostReason } from "@/lib/project-types";
import {
  PROJECT_STATUS_ICONS, PROJECT_STATUS_COLORS, PROCESS_STATUS_ICONS, PROCESS_STATUS_COLORS,
  getCurrentProcess, formatDate, formatDateTime, formatYen,
} from "@/lib/project-types";
import { useCurrentMember } from "@/lib/useCurrentMember";
import MemberPickerModal from "@/components/projects/MemberPickerModal";
import ReasonModal from "@/components/projects/ReasonModal";
import ProjectStatusModal from "@/components/projects/ProjectStatusModal";

type PendingAction = { processId: string; action: "skip" | "hold" | "problem" } | null;

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { members, currentId, setCurrentId } = useCurrentMember();

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [lostReasons, setLostReasons] = useState<LostReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pickerFor, setPickerFor] = useState<{ processId: string; action: string; reason?: string } | null>(null);
  const [toast, setToast] = useState("");

  const autoExpandedRef = useRef(false);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
      setLogs(data.logs);
      if (!autoExpandedRef.current) {
        const cur = getCurrentProcess((data.project.processes ?? []).slice().sort((a: ProjectProcess, b: ProjectProcess) => a.sort_order - b.sort_order));
        if (cur) setExpandedId(cur.id);
        autoExpandedRef.current = true;
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    fetch("/api/project-lost-reasons").then((r) => r.json()).then((d) => setLostReasons(Array.isArray(d) ? d.filter((r: LostReason) => r.is_active) : []));
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  const runAction = async (processId: string, action: string, reason?: string) => {
    if (!currentId) { setPickerFor({ processId, action, reason }); return; }
    const res = await fetch(`/api/projects/${id}/processes/${processId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, actor_id: currentId, reason }),
    });
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
      setExpandedId(null);
      showToast(action === "complete" ? "✅ 完了しました" : action === "skip" ? "❌ 不要にしました" : action === "hold" ? "⏸️ 保留にしました" : action === "problem" ? "⚠️ 問題ありにしました" : "元に戻しました");
      reload();
    }
  };

  const handlePickerSelect = (memberId: string) => {
    setCurrentId(memberId);
    if (pickerFor) {
      const { processId, action, reason } = pickerFor;
      setPickerFor(null);
      fetch(`/api/projects/${id}/processes/${processId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, actor_id: memberId, reason }),
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setProject(data.project);
          setExpandedId(null);
          reload();
        }
      });
    }
  };

  const changeProjectStatus = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, changed_by: currentId }),
    });
    if (res.ok) {
      setShowStatusModal(false);
      showToast("案件状態を更新しました");
      reload();
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>読み込み中...</div>;
  if (!project) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>案件が見つかりません</div>;

  const processes = (project.processes ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const current = getCurrentProcess(processes);
  const categories = Array.from(new Set(processes.map((p) => p.category)));

  return (
    <div style={{ padding: "14px 14px 40px" }}>
      <Link href="/projects" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← 案件一覧</Link>

      <div className="card" style={{ marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 900, color: "#0f172a" }}>{project.name}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{project.customer_name}</div>
          </div>
          <button
            onClick={() => setShowStatusModal(true)}
            className="tag"
            style={{ background: PROJECT_STATUS_COLORS[project.status] + "1a", color: PROJECT_STATUS_COLORS[project.status], border: "none", cursor: "pointer", fontSize: 12, padding: "5px 10px" }}
          >
            {PROJECT_STATUS_ICONS[project.status]} {project.status} ▾
          </button>
        </div>

        {project.status === "成約" && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#059669" }}>成約日 {formatDate(project.won_at)} ／ 契約金額 {formatYen(project.contract_amount)}</div>
        )}
        {project.status === "失注" && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#dc2626" }}>
            失注日 {formatDate(project.lost_at)} ／ {project.lost_reason?.name}
            {project.lost_reason_detail && `（${project.lost_reason_detail}）`}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>現在工程</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{current ? current.name : "全工程完了"}</div>
          </div>
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700 }}>次に必要</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8", marginTop: 2 }}>
              {(() => {
                const idx = current ? processes.findIndex((p) => p.id === current.id) : -1;
                const nxt = idx >= 0 ? processes.slice(idx + 1).find((p) => p.status !== "完了" && p.status !== "不要") : null;
                return nxt ? nxt.name : "なし";
              })()}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#475569", lineHeight: 1.9 }}>
          <div>📍 {project.address || "住所未登録"} ／ 築{project.building_age || "-"}</div>
          <div>🔧 {project.work_content || "工事内容未登録"}</div>
          <div>📅 発生日 {formatDate(project.occurred_at)} ／ 発生源 {project.source?.name ?? "-"} ／ 工期 {project.construction_period || "未定"}</div>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat} style={{ marginTop: 18 }}>
          <div className="section-title">{cat}</div>
          {processes.filter((p) => p.category === cat).map((p) => (
            <ProcessRow
              key={p.id}
              process={p}
              isCurrent={current?.id === p.id}
              expanded={expandedId === p.id}
              onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
              onComplete={() => runAction(p.id, "complete")}
              onSkip={(reason) => runAction(p.id, "skip", reason)}
              onHold={(reason) => runAction(p.id, "hold", reason)}
              onProblem={(reason) => runAction(p.id, "problem", reason)}
              onReopen={() => runAction(p.id, "reopen")}
              onOpenReasonModal={(action) => setPendingAction({ processId: p.id, action })}
            />
          ))}
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setShowHistory(!showHistory)} className="btn-outline" style={{ width: "100%" }}>
          {showHistory ? "履歴を閉じる ▲" : "履歴を見る（誰がいつ何をしたか） ▼"}
        </button>
        {showHistory && (
          <div className="card" style={{ marginTop: 10 }}>
            {logs.length === 0 ? (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>履歴がありません</div>
            ) : (
              logs.map((l) => (
                <div key={l.id} style={{ fontSize: 12, color: "#334155", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#94a3b8" }}>{formatDateTime(l.created_at)}</span>{" "}
                  <span style={{ fontWeight: 700 }}>{l.changed_by_member?.name ?? "―"}</span>{" "}
                  {l.process_name && <span style={{ color: "#0f172a" }}>{l.process_name}</span>}{" "}
                  <span style={{ color: "#64748b" }}>{l.detail}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "10px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, zIndex: 300 }}>
          {toast}
        </div>
      )}

      {pickerFor && (
        <MemberPickerModal members={members} onSelect={handlePickerSelect} onClose={() => setPickerFor(null)} />
      )}

      {pendingAction && (
        <ReasonModal
          title={pendingAction.action === "skip" ? "不要にする理由" : pendingAction.action === "hold" ? "保留にする理由" : "問題ありの内容"}
          required={pendingAction.action === "skip"}
          confirmLabel={pendingAction.action === "skip" ? "不要にする" : pendingAction.action === "hold" ? "保留にする" : "問題ありにする"}
          confirmColor={pendingAction.action === "skip" ? "#64748b" : pendingAction.action === "hold" ? "#f59e0b" : "#dc2626"}
          onClose={() => setPendingAction(null)}
          onConfirm={(reason) => {
            const { processId, action } = pendingAction;
            setPendingAction(null);
            runAction(processId, action, reason);
          }}
        />
      )}

      {showStatusModal && (
        <ProjectStatusModal
          currentStatus={project.status}
          lostReasons={lostReasons}
          onClose={() => setShowStatusModal(false)}
          onConfirm={changeProjectStatus}
        />
      )}
    </div>
  );
}

function ProcessRow({
  process, isCurrent, expanded, onToggle, onComplete, onSkip, onHold, onProblem, onReopen, onOpenReasonModal,
}: {
  process: ProjectProcess;
  isCurrent: boolean;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onSkip: (reason: string) => void;
  onHold: (reason: string) => void;
  onProblem: (reason: string) => void;
  onReopen: () => void;
  onOpenReasonModal: (action: "skip" | "hold" | "problem") => void;
}) {
  const resolved = process.status === "完了" || process.status === "不要";
  return (
    <div className="card-flat" style={{ marginBottom: 8, borderColor: isCurrent ? "#93c5fd" : "#e2e8f0", background: isCurrent ? "#f8fbff" : "#fff" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <span style={{ fontSize: 18 }}>{PROCESS_STATUS_ICONS[process.status]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: isCurrent ? 800 : 600, color: "#0f172a" }}>{process.name}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
            {process.status === "完了" && `${process.actual_assignee?.name ?? "―"} ・ ${formatDateTime(process.completed_at)}`}
            {process.status === "不要" && `不要：${process.skip_reason || "理由なし"}`}
            {process.status === "保留" && `保留：${process.note || "理由なし"}`}
            {process.status === "問題あり" && `⚠️ ${process.problem_note || "内容未記入"}`}
            {process.status === "未完了" && (process.planned_assignee ? `予定：${process.planned_assignee.name}` : "")}
          </div>
        </div>
        <span
          className="tag"
          style={{ background: PROCESS_STATUS_COLORS[process.status] + "1a", color: PROCESS_STATUS_COLORS[process.status] }}
        >
          {process.status}
        </span>
      </div>

      {expanded && !resolved && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 12 }}>
          <ActionButton label="完了" color="#10b981" onClick={onComplete} />
          <ActionButton label="不要" color="#64748b" onClick={() => onOpenReasonModal("skip")} />
          <ActionButton label="保留" color="#f59e0b" onClick={() => onOpenReasonModal("hold")} />
          <ActionButton label="問題あり" color="#dc2626" onClick={() => onOpenReasonModal("problem")} />
        </div>
      )}

      {expanded && resolved && (
        <div style={{ marginTop: 10 }}>
          <button onClick={onReopen} style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}>
            ← 未完了に戻す（訂正）
          </button>
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 4px", borderRadius: 10, border: "none", background: color, color: "#fff",
        fontSize: 12, fontWeight: 800, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
