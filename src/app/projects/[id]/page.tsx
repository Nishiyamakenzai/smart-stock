"use client";
import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project, ProjectProcess, ProcessLog, LostReason, Source } from "@/lib/project-types";
import {
  PROJECT_STATUS_ICONS, PROJECT_STATUS_COLORS, PROCESS_STATUS_ICONS, PROCESS_STATUS_COLORS,
  getCurrentProcess, getNextNeededProcesses, formatDate, formatDateTime, formatYen, googleMapsUrl,
} from "@/lib/project-types";
import { useCurrentMember } from "@/lib/useCurrentMember";
import MemberPickerModal from "@/components/projects/MemberPickerModal";
import ReasonModal from "@/components/projects/ReasonModal";
import ProjectStatusModal from "@/components/projects/ProjectStatusModal";
import ProjectEditModal from "@/components/projects/ProjectEditModal";
import ConfirmModal from "@/components/projects/ConfirmModal";
import ContractCompleteModal from "@/components/projects/ContractCompleteModal";

type PendingAction = { processId: string; processName: string; action: "complete" | "skip" | "hold" | "problem" } | null;
type ActorPickerFor = { processId: string; action: string; reason?: string; extra?: Record<string, unknown> } | null;
type BulkAction = { action: "complete" | "skip"; reason?: string } | null;

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { members, currentId, setCurrentId } = useCurrentMember();

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [lostReasons, setLostReasons] = useState<LostReason[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actorPickerFor, setActorPickerFor] = useState<ActorPickerFor>(null);
  const [plannedPickerFor, setPlannedPickerFor] = useState<string | null>(null);
  const [notePickerFor, setNotePickerFor] = useState<string | null>(null);
  const [contractCompleteFor, setContractCompleteFor] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkReason, setShowBulkReason] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [bulkRunning, setBulkRunning] = useState(false);

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
    fetch("/api/project-sources").then((r) => r.json()).then((d) => setSources(Array.isArray(d) ? d.filter((s: Source) => s.is_active) : []));
  }, []);

  const showToast = (msg: string, durationMs = 2400) => { setToast(msg); setTimeout(() => setToast(""), durationMs); };

  /** 完了・不要・保留・問題あり・元に戻す ―― どれも「誰が対応したか」を毎回選んでもらう */
  const requestAction = (processId: string, action: string, reason?: string, extra?: Record<string, unknown>) => {
    setActorPickerFor({ processId, action, reason, extra });
  };

  const handleActorSelect = async (memberId: string) => {
    if (!actorPickerFor) return;
    setCurrentId(memberId);
    const { processId, action, reason, extra } = actorPickerFor;
    setActorPickerFor(null);
    const res = await fetch(`/api/projects/${id}/processes/${processId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, actor_id: memberId, reason, ...extra }),
    });
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
      setExpandedId(null);
      if (data.warning) {
        showToast(`⚠️ ${data.warning}`, 8000);
      } else {
        showToast(action === "complete" ? "✅ 完了しました" : action === "skip" ? "❌ 不要にしました" : action === "hold" ? "⏸️ 保留にしました" : action === "problem" ? "⚠️ 問題ありにしました" : "元に戻しました");
      }
      reload();
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedIds([]);
  };

  const toggleSelect = (processId: string) => {
    setSelectedIds((prev) => (prev.includes(processId) ? prev.filter((x) => x !== processId) : [...prev, processId]));
  };

  /** 同じ人が同時に終わらせた複数工程を、まとめて「完了」または「不要」にする */
  const startBulkComplete = () => {
    if (selectedIds.length === 0) return;
    setBulkAction({ action: "complete" });
  };
  const startBulkSkip = () => {
    if (selectedIds.length === 0) return;
    setShowBulkReason(true);
  };

  const handleBulkActorSelect = async (memberId: string) => {
    if (!bulkAction) return;
    setCurrentId(memberId);
    const { action, reason } = bulkAction;
    setBulkAction(null);
    setBulkRunning(true);
    const results = await Promise.all(
      selectedIds.map((processId) =>
        fetch(`/api/projects/${id}/processes/${processId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, actor_id: memberId, reason }),
        }).then(async (r) => ({ ok: r.ok, data: r.ok ? await r.json() : null }))
      )
    );
    setBulkRunning(false);
    const okCount = results.filter((r) => r.ok).length;
    const warning = results.find((r) => r.data?.warning)?.data?.warning;
    if (warning) {
      showToast(`⚠️ ${warning}`, 8000);
    } else {
      showToast(`${okCount}件を${action === "complete" ? "完了" : "不要"}にしました`);
    }
    setSelectMode(false);
    setSelectedIds([]);
    reload();
  };

  /** 「契約」を完了にするときは、工期・契約金額もまとめて記録する */
  const handleContractComplete = (payload: { periodStart: string; periodEnd: string; contractAmount: number; note: string }) => {
    if (!contractCompleteFor) return;
    const processId = contractCompleteFor;
    setContractCompleteFor(null);
    requestAction(processId, "complete", payload.note || undefined, {
      contract_amount: payload.contractAmount,
      construction_period: `${formatDate(payload.periodStart)}〜${formatDate(payload.periodEnd)}`,
    });
  };

  /** 予定担当者の設定・変更（誰でもいつでも選び直せる） */
  const setPlannedAssignee = async (processId: string, memberId: string | null) => {
    setPlannedPickerFor(null);
    const res = await fetch(`/api/projects/${id}/processes/${processId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", planned_assignee_id: memberId }),
    });
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
      showToast("予定担当者を更新しました");
      reload();
    }
  };

  /** コメントの追加・編集（状態は変えず、いつでも書ける） */
  const setNote = async (processId: string, note: string) => {
    setNotePickerFor(null);
    const res = await fetch(`/api/projects/${id}/processes/${processId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", note, actor_id: currentId }),
    });
    if (res.ok) {
      const data = await res.json();
      setProject(data.project);
      showToast("コメントを保存しました");
      reload();
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

  /** 間違って登録した内容の訂正（基本情報の編集） */
  const editProject = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, changed_by: currentId }),
    });
    if (res.ok) {
      setShowEditModal(false);
      showToast("案件情報を更新しました");
      reload();
    }
  };

  /** 間違って登録した案件・不要になった案件の完全削除 */
  const deleteProject = async () => {
    setDeleting(true);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/projects");
    } else {
      setDeleting(false);
      setShowDeleteConfirm(false);
      showToast("削除に失敗しました");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>読み込み中...</div>;
  if (!project) return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>案件が見つかりません</div>;

  const processes = (project.processes ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const current = getCurrentProcess(processes);
  const nextNeeded = getNextNeededProcesses(processes);
  const categories = Array.from(new Set(processes.map((p) => p.category)));

  return (
    <div style={{ padding: "14px 14px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/projects" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← 案件一覧</Link>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={toggleSelectMode} style={{ fontSize: 12, color: selectMode ? "#dc2626" : "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
            {selectMode ? "✕ 選択を終了" : "☑️ 複数選択"}
          </button>
          <button onClick={() => setShowEditModal(true)} style={{ fontSize: 12, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
            ✏️ 編集
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
            🗑 削除
          </button>
        </div>
      </div>

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
          <div style={{ marginTop: 8, fontSize: 12, color: "#059669" }}>成約日 {formatDate(project.won_at)} ／ 契約金額（税込） {formatYen(project.contract_amount)}</div>
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
              {nextNeeded.length > 0 ? nextNeeded.map((p) => p.name).join("・") : "なし"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#475569", lineHeight: 1.9 }}>
          <div>
            📍{" "}
            {project.address ? (
              <a href={googleMapsUrl(project.address)} target="_blank" rel="noopener noreferrer" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                {project.address} 🗺️
              </a>
            ) : "住所未登録"}
            {" ／ "}{project.building_age || "築年数未登録"}
          </div>
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
              onComplete={() => {
                if (p.name === "契約") setContractCompleteFor(p.id);
                else setPendingAction({ processId: p.id, processName: p.name, action: "complete" });
              }}
              onSkip={(reason) => requestAction(p.id, "skip", reason)}
              onHold={(reason) => requestAction(p.id, "hold", reason)}
              onProblem={(reason) => requestAction(p.id, "problem", reason)}
              onReopen={() => requestAction(p.id, "reopen")}
              onOpenReasonModal={(action) => setPendingAction({ processId: p.id, processName: p.name, action })}
              onSetPlanned={() => setPlannedPickerFor(p.id)}
              onEditNote={() => setNotePickerFor(p.id)}
              selectMode={selectMode}
              selected={selectedIds.includes(p.id)}
              onToggleSelect={() => toggleSelect(p.id)}
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
        <div style={{ position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 600, zIndex: 300, maxWidth: "88vw", width: "max-content", textAlign: "center", lineHeight: 1.5 }}>
          {toast}
        </div>
      )}

      {selectMode && (
        <div style={{ position: "fixed", bottom: 64, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 16px", zIndex: 150, boxShadow: "0 -4px 16px rgba(0,0,0,.06)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>{selectedIds.length}件選択中</span>
            <button
              onClick={startBulkComplete}
              disabled={selectedIds.length === 0 || bulkRunning}
              style={{ flex: 1, padding: 11, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: selectedIds.length === 0 ? 0.5 : 1 }}
            >
              まとめて完了
            </button>
            <button
              onClick={startBulkSkip}
              disabled={selectedIds.length === 0 || bulkRunning}
              style={{ flex: 1, padding: 11, background: "#64748b", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: selectedIds.length === 0 ? 0.5 : 1 }}
            >
              まとめて不要
            </button>
          </div>
        </div>
      )}

      {showBulkReason && (
        <ReasonModal
          title="不要にする理由（選択した全工程に適用）"
          required
          confirmLabel="不要にする"
          confirmColor="#64748b"
          onClose={() => setShowBulkReason(false)}
          onConfirm={(reason) => {
            setShowBulkReason(false);
            setBulkAction({ action: "skip", reason });
          }}
        />
      )}

      {bulkAction && (
        <MemberPickerModal
          members={members}
          title={`対応者を選択（${selectedIds.length}件まとめて${bulkAction.action === "complete" ? "完了" : "不要"}）`}
          highlightId={currentId}
          onSelect={handleBulkActorSelect}
          onClose={() => setBulkAction(null)}
        />
      )}

      {actorPickerFor && (
        <MemberPickerModal
          members={members}
          title="対応者を選択"
          highlightId={currentId}
          onSelect={handleActorSelect}
          onClose={() => setActorPickerFor(null)}
        />
      )}

      {plannedPickerFor && (
        <MemberPickerModal
          members={members}
          title="予定担当者を選択"
          highlightId={processes.find((p) => p.id === plannedPickerFor)?.planned_assignee_id}
          allowClear
          onSelect={(memberId) => setPlannedAssignee(plannedPickerFor, memberId)}
          onClear={() => setPlannedAssignee(plannedPickerFor, null)}
          onClose={() => setPlannedPickerFor(null)}
        />
      )}

      {pendingAction && (() => {
        const isContractLost = pendingAction.processName === "契約" && pendingAction.action === "problem";
        return (
          <ReasonModal
            title={
              pendingAction.action === "complete" ? "完了メモ（任意）"
              : pendingAction.action === "skip" ? "不要にする理由"
              : pendingAction.action === "hold" ? "保留にする理由"
              : isContractLost ? "失注理由"
              : "問題ありの内容"
            }
            required={pendingAction.action === "skip" || isContractLost}
            confirmLabel={
              pendingAction.action === "complete" ? "完了する"
              : pendingAction.action === "skip" ? "不要にする"
              : pendingAction.action === "hold" ? "保留にする"
              : isContractLost ? "失注にする"
              : "問題ありにする"
            }
            confirmColor={
              pendingAction.action === "complete" ? "#10b981"
              : pendingAction.action === "skip" ? "#64748b"
              : pendingAction.action === "hold" ? "#f59e0b"
              : "#dc2626"
            }
            onClose={() => setPendingAction(null)}
            onConfirm={(reason) => {
              const { processId, action } = pendingAction;
              setPendingAction(null);
              requestAction(processId, action, reason || undefined);
            }}
          />
        );
      })()}

      {notePickerFor && (
        <ReasonModal
          title="コメントを追加・編集"
          placeholder="必要であれば自由にコメントを入力（任意）"
          confirmLabel="保存する"
          confirmColor="#3b82f6"
          defaultValue={processes.find((p) => p.id === notePickerFor)?.note ?? ""}
          onClose={() => setNotePickerFor(null)}
          onConfirm={(text) => setNote(notePickerFor, text)}
        />
      )}

      {contractCompleteFor && (
        <ContractCompleteModal
          onClose={() => setContractCompleteFor(null)}
          onConfirm={handleContractComplete}
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

      {showEditModal && (
        <ProjectEditModal
          project={project}
          sources={sources}
          onClose={() => setShowEditModal(false)}
          onConfirm={editProject}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="この案件を削除しますか？"
          description={`「${project.name}」を削除すると、工程・履歴もすべて消え、元に戻せません。間違って登録した場合はこのまま削除できます。失注・取消として記録を残したい場合は、削除ではなく「案件状態」の変更をお使いください。`}
          confirmLabel={deleting ? "削除中..." : "削除する"}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={deleteProject}
        />
      )}
    </div>
  );
}

function ProcessRow({
  process, isCurrent, expanded, onToggle, onComplete, onSkip, onHold, onProblem, onReopen, onOpenReasonModal, onSetPlanned, onEditNote,
  selectMode, selected, onToggleSelect,
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
  onSetPlanned: () => void;
  onEditNote: () => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const resolved = process.status === "完了" || process.status === "不要";
  const canSelect = selectMode && !resolved;
  const isContract = process.name === "契約";
  const isLost = isContract && process.status === "問題あり";
  const statusLabel = isLost ? "失注" : process.status;
  return (
    <div
      className="card-flat"
      style={{
        marginBottom: 8,
        borderColor: selected ? "#3b82f6" : isCurrent ? "#93c5fd" : "#e2e8f0",
        background: selected ? "#eff6ff" : isCurrent ? "#f8fbff" : "#fff",
        opacity: selectMode && resolved ? 0.5 : 1,
      }}
    >
      <div onClick={canSelect ? onToggleSelect : onToggle} style={{ display: "flex", alignItems: "center", gap: 10, cursor: canSelect || !selectMode ? "pointer" : "default" }}>
        {selectMode ? (
          <span style={{ fontSize: 18 }}>{canSelect ? (selected ? "✅" : "⬜") : "🚫"}</span>
        ) : (
          <span style={{ fontSize: 18 }}>{PROCESS_STATUS_ICONS[process.status]}</span>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: isCurrent ? 800 : 600, color: "#0f172a" }}>{process.name}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
            {process.status === "完了" && `${process.actual_assignee?.name ?? "―"} ・ ${formatDateTime(process.completed_at)}`}
            {process.status === "不要" && `不要：${process.skip_reason || "理由なし"}（${process.actual_assignee?.name ?? "―"}）`}
            {process.status === "保留" && `保留：${process.note || "理由なし"}`}
            {process.status === "問題あり" && (isLost ? `🔴 失注：${process.problem_note || "理由なし"}` : `⚠️ ${process.problem_note || "内容未記入"}`)}
          </div>
        </div>
        <span
          className="tag"
          style={{ background: PROCESS_STATUS_COLORS[process.status] + "1a", color: PROCESS_STATUS_COLORS[process.status] }}
        >
          {statusLabel}
        </span>
      </div>

      {!selectMode && (
      <div style={{ marginTop: 8, marginLeft: 28, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {!resolved && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetPlanned(); }}
            style={{
              fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
              background: process.planned_assignee ? `${process.planned_assignee.color}18` : "#f1f5f9",
              color: process.planned_assignee ? process.planned_assignee.color : "#94a3b8",
              padding: "3px 10px", borderRadius: 99,
            }}
          >
            予定担当者：{process.planned_assignee ? process.planned_assignee.name : "未定（タップで選択）"}
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEditNote(); }}
          style={{
            fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
            background: process.status !== "完了" && process.status !== "不要" && process.note ? "#eff6ff" : "#f1f5f9",
            color: process.status !== "完了" && process.status !== "不要" && process.note ? "#1d4ed8" : "#94a3b8",
            padding: "3px 10px", borderRadius: 99,
          }}
        >
          💬 {process.status !== "保留" && process.note ? process.note : "コメントを追加"}
        </button>
      </div>
      )}

      {!selectMode && expanded && !resolved && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 12 }}>
          <ActionButton label="完了" color="#10b981" onClick={onComplete} />
          <ActionButton label="不要" color="#64748b" onClick={() => onOpenReasonModal("skip")} />
          <ActionButton label="保留" color="#f59e0b" onClick={() => onOpenReasonModal("hold")} />
          <ActionButton label={isContract ? "失注" : "問題あり"} color="#dc2626" onClick={() => onOpenReasonModal("problem")} />
        </div>
      )}

      {!selectMode && expanded && resolved && (
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
