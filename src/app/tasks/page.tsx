'use client';
import { useState, useEffect, useCallback } from 'react';
import { Task, Member, TaskStatus, STATUS_COLORS } from '@/lib/task-types';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import BottomSheet from '@/components/tasks/BottomSheet';
import ConfirmDialog from '@/components/tasks/ConfirmDialog';
import { useToast } from '@/components/tasks/Toast';

const STATUSES: TaskStatus[] = ['未対応', '対応中', '確認待ち', '完了', '保留'];

/* ─── メンバー選択画面 ─── */
function MemberSelect({ members, onSelect }: { members: Member[]; onSelect: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,#EFF6FF,#F8FAFC)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 52, marginBottom: 8 }}>👷</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', marginBottom: 4, textAlign: 'center' }}>西山建材 タスク管理</h1>
      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32, textAlign: 'center' }}>あなたは誰ですか？</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {members.map(m => (
          <button key={m.id} onClick={() => onSelect(m.id)} style={{
            padding: '14px 18px', borderRadius: 14, border: `2px solid ${m.color}44`,
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
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

/* ─── 担当者ボード（横スクロール）─── */
function MemberBoard({ members, tasks, activeId, onSelect }: {
  members: Member[]; tasks: Task[]; activeId: string; onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 16px 8px', scrollbarWidth: 'none' }}>
      <button
        onClick={() => onSelect('')}
        style={{
          flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          padding: '10px 14px', borderRadius: 14, border: activeId === '' ? '2px solid #2563EB' : '2px solid #E2E8F0',
          background: activeId === '' ? '#EFF6FF' : '#fff', cursor: 'pointer', minWidth: 68,
        }}
      >
        <span style={{ fontSize: 20 }}>👥</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: activeId === '' ? '#2563EB' : '#64748B' }}>全員</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: activeId === '' ? '#2563EB' : '#1E293B' }}>
          {tasks.filter(t => t.status !== '完了').length}
        </span>
      </button>
      {members.map(m => {
        const myTasks = tasks.filter(t => t.assignee_id === m.id && t.status !== '完了');
        const urgent = myTasks.some(t => t.priority === '緊急');
        const isActive = activeId === m.id;
        return (
          <button key={m.id} onClick={() => onSelect(isActive ? '' : m.id)} style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 14px', borderRadius: 14,
            border: isActive ? `2px solid ${m.color}` : '2px solid #E2E8F0',
            background: isActive ? m.color + '11' : '#fff',
            cursor: 'pointer', minWidth: 68, position: 'relative',
          }}>
            {urgent && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.color + '22', border: `2px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.name[0]}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? m.color : '#64748B' }}>{m.name}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: isActive ? m.color : (myTasks.length > 0 ? '#1E293B' : '#CBD5E1') }}>
              {myTasks.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── ステータス別集計タブ ─── */
function StatusTabs({ tasks, active, onChange }: { tasks: Task[]; active: string; onChange: (s: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
      {STATUSES.slice(0, 4).map(s => {
        const count = tasks.filter(t => t.status === s).length;
        if (!count && active !== s) return null;
        const isActive = active === s;
        return (
          <button key={s} onClick={() => onChange(isActive ? '' : s)} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 99,
            border: `1.5px solid ${STATUS_COLORS[s]}`,
            background: isActive ? STATUS_COLORS[s] : STATUS_COLORS[s] + '11',
            color: isActive ? '#fff' : STATUS_COLORS[s],
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            {s}
            <span style={{
              background: isActive ? 'rgba(255,255,255,0.3)' : STATUS_COLORS[s] + '44',
              borderRadius: 99, padding: '0 6px', fontSize: 12, fontWeight: 800,
            }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── アラートバナー ─── */
function AlertBanner({ tasks }: { tasks: Task[] }) {
  const urgent = tasks.filter(t => t.priority === '緊急' && t.status !== '完了');
  const overdue = tasks.filter(t => t.due_date && t.status !== '完了' && new Date(t.due_date) < new Date());
  const waitingMe = tasks.filter(t => t.status === '確認待ち');

  if (!urgent.length && !overdue.length && !waitingMe.length) return null;
  return (
    <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {urgent.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🚨</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>緊急タスク {urgent.length}件 — 即対応が必要です</span>
        </div>
      )}
      {overdue.length > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⏰</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>期限超過 {overdue.length}件</span>
        </div>
      )}
      {waitingMe.length > 0 && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>👆</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>確認待ちのタスク {waitingMe.length}件</span>
        </div>
      )}
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

  useEffect(() => {
    const stored = localStorage.getItem('tasks_current_user_id');
    setCurrentUserId(stored);
    setHydrated(true);
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
        showToast(`💡 次のタスクを ${nextTask.assignee?.name ?? '担当者'} に自動作成しました`);
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

  const handleSelectUser = (id: string) => {
    localStorage.setItem('tasks_current_user_id', id);
    setCurrentUserId(id);
  };

  if (!hydrated) return null;
  if (members.length > 0 && !currentUserId) {
    return <MemberSelect members={members} onSelect={handleSelectUser} />;
  }

  const currentMember = members.find(m => m.id === currentUserId);

  // フィルター適用
  const filtered = tasks.filter(t => {
    if (filterAssignee && t.assignee_id !== filterAssignee) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  // 表示分類: 完了以外 → 通常リスト、完了 → 最後に折り畳み
  const active = filtered.filter(t => t.status !== '完了');
  const done = filtered.filter(t => t.status === '完了');

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
            <button onClick={() => { localStorage.removeItem('tasks_current_user_id'); setCurrentUserId(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: currentMember.color + '18', border: `1.5px solid ${currentMember.color}44`, borderRadius: 99, padding: '6px 12px', cursor: 'pointer' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentMember.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: currentMember.color }}>{currentMember.name}</span>
            </button>
          )}
        </div>

        {/* 担当者ボード */}
        <MemberBoard members={members} tasks={tasks} activeId={filterAssignee} onSelect={setFilterAssignee} />

        {/* ステータスタブ */}
        <StatusTabs tasks={filterAssignee ? tasks.filter(t => t.assignee_id === filterAssignee || !filterAssignee) : tasks} active={filterStatus} onChange={setFilterStatus} />

        <div style={{ height: 8 }} />
      </div>

      <div style={{ padding: '8px 12px 0' }}>
        {/* アラートバナー */}
        <AlertBanner tasks={filterAssignee ? tasks.filter(t => !filterAssignee || t.assignee_id === filterAssignee) : tasks} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8', fontSize: 14 }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
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
                <summary style={{ fontSize: 13, color: '#94A3B8', padding: '10px 4px', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
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
        fontWeight: 300, lineHeight: 1,
      }}>＋</button>

      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="新しいタスク">
        <TaskForm
          members={members}
          currentUserId={currentUserId ?? ''}
          onSuccess={(newTask) => {
            if (newTask) setTasks(prev => [newTask, ...prev]);
            setShowForm(false);
          }}
        />
      </BottomSheet>

      <ConfirmDialog
        open={!!deleteId}
        title="タスクを削除"
        message="このタスクを削除しますか？この操作は元に戻せません。"
        confirmLabel="削除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
