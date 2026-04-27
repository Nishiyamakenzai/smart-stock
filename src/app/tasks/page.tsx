'use client';
import { useState, useEffect, useCallback } from 'react';
import { Task, Member, TaskStatus, STATUS_COLORS } from '@/lib/task-types';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import BottomSheet from '@/components/tasks/BottomSheet';
import ConfirmDialog from '@/components/tasks/ConfirmDialog';
import PushSetup from '@/components/tasks/PushSetup';
import { useToast } from '@/components/tasks/Toast';

/* ─── メンバー選択画面 ─── */
function MemberSelect({ members, onSelect }: { members: Member[]; onSelect: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,#EFF6FF,#F8FAFC)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
      <div style={{ fontSize: 52, marginBottom: 8 }}>👷</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', marginBottom: 4, textAlign: 'center' }}>西山建材 タスク管理</h1>
      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32, textAlign: 'center' }}>あなたは誰ですか？</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {members.map(m => (
          <button key={m.id} onClick={() => onSelect(m.id)} style={{
            padding: '14px 18px', borderRadius: 14, border: `2px solid ${m.color}44`,
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: `0 2px 8px ${m.color}22`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color + '22', border: `2px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.name[0]}</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{m.role}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── 確認依頼カード（アクションボタン付き） ─── */
function ReviewCard({ task, onApprove, onChange }: {
  task: Task;
  onApprove: (id: string) => void;
  onChange: (id: string, status: TaskStatus) => void;
}) {
  const assigneeColor = task.assignee?.color ?? '#94A3B8';
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '2px solid #10B981', overflow: 'hidden', marginBottom: 10, boxShadow: '0 2px 8px rgba(16,185,129,0.12)' }}>
      <div style={{ display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 5, background: '#10B981', flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              {task.priority === '緊急' && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', padding: '1px 7px', borderRadius: 6, display: 'inline-block', marginBottom: 4 }}>★緊急★</span>
              )}
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', lineHeight: 1.4 }}>{task.title}</p>
            </div>
            <span style={{ fontSize: 11, color: '#64748B' }}>#{task.task_number}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: assigneeColor, background: assigneeColor + '22', borderRadius: 99, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: assigneeColor }} />{task.assignee?.name ?? '?'}
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>→ 確認依頼が届いています</span>
          </div>
          {task.note && <p style={{ fontSize: 12, color: '#64748B', marginTop: 6, lineHeight: 1.5 }}>{task.note}</p>}
        </div>
      </div>
      {/* アクションボタン */}
      <div style={{ display: 'flex', borderTop: '1px solid #D1FAE5' }}>
        <button
          onClick={() => onChange(task.id, '対応中')}
          style={{ flex: 1, padding: '11px 0', background: '#F0FDF4', border: 'none', borderRight: '1px solid #D1FAE5', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#059669' }}
        >
          修正依頼・対応中に戻す
        </button>
        <button
          onClick={() => onApprove(task.id)}
          style={{ flex: 1, padding: '11px 0', background: '#10B981', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#fff' }}
        >
          ✅ 確認OK・完了
        </button>
      </div>
    </div>
  );
}

/* ─── 担当者ボード ─── */
function MemberBoard({ members, tasks, activeId, onSelect }: {
  members: Member[]; tasks: Task[]; activeId: string; onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 16px 8px', scrollbarWidth: 'none' }}>
      <button onClick={() => onSelect('')} style={{
        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        padding: '8px 12px', borderRadius: 14,
        border: activeId === '' ? '2px solid #2563EB' : '2px solid #E2E8F0',
        background: activeId === '' ? '#EFF6FF' : '#fff', cursor: 'pointer', minWidth: 64,
      }}>
        <span style={{ fontSize: 18 }}>👥</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: activeId === '' ? '#2563EB' : '#64748B' }}>全員</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: activeId === '' ? '#2563EB' : '#1E293B' }}>
          {tasks.filter(t => t.status !== '完了').length}
        </span>
      </button>
      {members.map(m => {
        const myTasks = tasks.filter(t => t.assignee_id === m.id && t.status !== '完了');
        // 確認待ちタスク（レビュアーとして）
        const reviewPending = tasks.filter(t => t.reviewer_id === m.id && t.status === '確認待ち');
        const total = myTasks.length + reviewPending.length;
        const urgent = myTasks.some(t => t.priority === '緊急');
        const hasReview = reviewPending.length > 0;
        const isActive = activeId === m.id;
        return (
          <button key={m.id} onClick={() => onSelect(isActive ? '' : m.id)} style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 10px', borderRadius: 14,
            border: isActive ? `2px solid ${m.color}` : '2px solid #E2E8F0',
            background: isActive ? m.color + '11' : '#fff',
            cursor: 'pointer', minWidth: 64, position: 'relative',
          }}>
            {urgent && <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />}
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.color + '22', border: `2px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.name[0]}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? m.color : '#64748B' }}>{m.name}</span>
            {/* 担当 + 確認を分けて表示 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {myTasks.length > 0 && (
                <span style={{ fontSize: 12, fontWeight: 800, color: isActive ? m.color : '#1E293B' }}>{myTasks.length}件</span>
              )}
              {hasReview && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: '#D1FAE5', borderRadius: 99, padding: '1px 5px' }}>確認{reviewPending.length}</span>
              )}
              {total === 0 && <span style={{ fontSize: 12, color: '#CBD5E1' }}>0</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── ステータスタブ ─── */
function StatusTabs({ tasks, active, onChange }: { tasks: Task[]; active: string; onChange: (s: string) => void }) {
  const STATUSES: TaskStatus[] = ['未対応', '対応中', '確認待ち', '完了', '保留'];
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
      {STATUSES.slice(0, 5).map(s => {
        const count = tasks.filter(t => t.status === s).length;
        if (!count && active !== s) return null;
        const isActive = active === s;
        return (
          <button key={s} onClick={() => onChange(isActive ? '' : s)} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 99,
            border: `1.5px solid ${STATUS_COLORS[s]}`,
            background: isActive ? STATUS_COLORS[s] : STATUS_COLORS[s] + '11',
            color: isActive ? '#fff' : STATUS_COLORS[s],
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            {s}
            <span style={{ background: isActive ? 'rgba(255,255,255,0.3)' : STATUS_COLORS[s] + '44', borderRadius: 99, padding: '0 5px', fontSize: 11 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── メインページ ─── */
export default function TasksDashboard() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPushSetup, setShowPushSetup] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tasks_current_user_id');
    setCurrentUserId(stored);
    setHydrated(true);
    // 通知設定を1度だけ促す
    if (stored && !localStorage.getItem('push_asked')) {
      setShowPushSetup(true);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/members');
    if (res.ok) setMembers(await res.json());
  }, []);

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks');
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { if (hydrated) fetchTasks(); }, [fetchTasks, hydrated]);

  // Realtime
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    async function subscribe() {
      try {
        const { getSupabaseBrowser } = await import('@/lib/supabase-browser');
        const sb = getSupabaseBrowser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ch = sb.channel('tasks-rt').on('postgres_changes' as any, { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks()).subscribe();
        unsubscribe = () => ch.unsubscribe();
      } catch { /* no-op */ }
    }
    if (hydrated) subscribe();
    return () => { unsubscribe?.(); };
  }, [hydrated, fetchTasks]);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, changed_by: currentUserId }),
    });
    if (res.ok) {
      const { task: updated, nextTask } = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
      showToast(`「${status}」に変更しました`);
      if (nextTask) {
        setTasks(prev => [nextTask, ...prev]);
        showToast(`💡 ${nextTask.assignee?.name ?? '次の担当者'} にタスクを自動作成しました`);
      }
    }
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '完了', changed_by: currentUserId }),
    });
    if (res.ok) {
      const { nextTask } = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: '完了' } : t));
      showToast('確認OK！タスクを完了にしました ✓');
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);
      if (nextTask) {
        setTasks(prev => [nextTask, ...prev]);
        showToast(`💡 ${nextTask.assignee?.name ?? '次の担当者'} にタスクを自動作成しました`);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/tasks/${deleteId}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== deleteId));
    showToast('削除しました', 'info');
    setDeleteId(null);
  };

  if (!hydrated) return null;
  if (members.length > 0 && !currentUserId) {
    return <MemberSelect members={members} onSelect={id => {
      localStorage.setItem('tasks_current_user_id', id);
      setCurrentUserId(id);
    }} />;
  }

  const currentMember = members.find(m => m.id === currentUserId);

  // 自分への確認依頼（最優先表示）
  const myReviewTasks = currentUserId
    ? tasks.filter(t => t.reviewer_id === currentUserId && t.status === '確認待ち')
    : [];

  // フィルター適用
  const filtered = tasks.filter(t => {
    if (filterAssignee && t.assignee_id !== filterAssignee) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });
  const active = filtered.filter(t => t.status !== '完了');
  const done = filtered.filter(t => t.status === '完了');

  // 緊急・期限超過
  const urgentTasks = tasks.filter(t => t.priority === '緊急' && t.status !== '完了');
  const overdueTasks = tasks.filter(t => t.due_date && t.status !== '完了' && new Date(t.due_date) < new Date());

  return (
    <>
      {/* ─── ヘッダー ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>📋 タスク管理</h1>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>未完了 {tasks.filter(t => t.status !== '完了').length}件</p>
          </div>
          {currentMember && (
            <button
              onClick={() => { localStorage.removeItem('tasks_current_user_id'); setCurrentUserId(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: currentMember.color + '18', border: `1.5px solid ${currentMember.color}44`, borderRadius: 99, padding: '6px 12px', cursor: 'pointer' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentMember.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: currentMember.color }}>{currentMember.name}</span>
            </button>
          )}
        </div>
        <MemberBoard members={members} tasks={tasks} activeId={filterAssignee} onSelect={setFilterAssignee} />
        <StatusTabs tasks={filterAssignee ? tasks.filter(t => !filterAssignee || t.assignee_id === filterAssignee) : tasks} active={filterStatus} onChange={setFilterStatus} />
        <div style={{ height: 6 }} />
      </div>

      <div style={{ padding: '8px 12px 0' }}>

        {/* 通知設定バナー */}
        {showPushSetup && currentMember && (
          <div style={{ position: 'relative' }}>
            <PushSetup memberId={currentMember.id} memberName={currentMember.name} />
            <button
              onClick={() => { setShowPushSetup(false); localStorage.setItem('push_asked', '1'); }}
              style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94A3B8' }}
            >×</button>
          </div>
        )}

        {/* ─── 自分への確認依頼（最優先ブロック） ─── */}
        {myReviewTasks.length > 0 && !filterAssignee && !filterStatus && (
          <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)', border: '2px solid #10B981', borderRadius: 16, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>
                  {currentMember?.name}さんへの確認依頼 {myReviewTasks.length}件
                </p>
                <p style={{ fontSize: 12, color: '#6EE7B7' }}>以下のタスクを確認してください</p>
              </div>
            </div>
            {myReviewTasks.map(task => (
              <ReviewCard
                key={task.id}
                task={task}
                onApprove={handleApprove}
                onChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* アラート */}
        {!filterAssignee && !filterStatus && (urgentTasks.length > 0 || overdueTasks.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {urgentTasks.length > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚨</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>緊急タスク {urgentTasks.length}件 — 即対応が必要です</span>
              </div>
            )}
            {overdueTasks.length > 0 && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⏰</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>期限超過 {overdueTasks.length}件</span>
              </div>
            )}
          </div>
        )}

        {/* タスク一覧 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>読み込み中...</div>
        ) : active.length === 0 && done.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#94A3B8', fontSize: 15 }}>タスクはありません</p>
          </div>
        ) : (
          <>
            {active.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onDelete={id => setDeleteId(id)} />
            ))}
            {done.length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 13, color: '#94A3B8', padding: '10px 4px', cursor: 'pointer', fontWeight: 600 }}>
                  完了済み {done.length}件
                </summary>
                <div style={{ marginTop: 6 }}>
                  {done.map(task => (
                    <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onDelete={id => setDeleteId(id)} />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
        <div style={{ height: 16 }} />
      </div>

      {/* FAB */}
      <button onClick={() => setShowForm(true)} style={{
        position: 'fixed', bottom: 80, right: 20, width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', border: 'none',
        fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}>＋</button>

      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="新しいタスク">
        <TaskForm
          members={members}
          currentUserId={currentUserId ?? ''}
          onSuccess={() => {
            fetchTasks();
            setShowForm(false);
          }}
        />
      </BottomSheet>

      <ConfirmDialog
        open={!!deleteId}
        title="タスクを削除"
        message="このタスクを削除しますか？"
        confirmLabel="削除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
