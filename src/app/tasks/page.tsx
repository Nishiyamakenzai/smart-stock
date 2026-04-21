'use client';
import { useState, useEffect, useCallback } from 'react';
import { Task, Member, TaskStatus, STATUS_COLORS } from '@/lib/task-types';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import BottomSheet from '@/components/tasks/BottomSheet';
import ConfirmDialog from '@/components/tasks/ConfirmDialog';
import { useToast } from '@/components/tasks/Toast';

const STATUSES: TaskStatus[] = ['未対応', '対応中', '確認待ち', '完了', '保留'];

function MemberSelect({ members, currentUserId, onSelect }: { members: Member[]; currentUserId: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👷</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 8, textAlign: 'center' }}>西山建材 タスク管理</h1>
      <p style={{ fontSize: 15, color: '#64748B', marginBottom: 32, textAlign: 'center' }}>あなたは誰ですか？</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              padding: '14px 20px',
              borderRadius: 14,
              border: `2px solid ${m.color}44`,
              background: m.color + '11',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{m.role}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

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

  // Load current user from localStorage
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
    const params = new URLSearchParams();
    if (filterAssignee) params.set('assignee', filterAssignee);
    if (filterStatus) params.set('status', filterStatus);
    const res = await fetch('/api/tasks?' + params.toString());
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, [filterAssignee, filterStatus]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { if (hydrated) fetchTasks(); }, [fetchTasks, hydrated]);

  // Realtime via Supabase if available
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    async function subscribe() {
      try {
        const { getSupabaseBrowser } = await import('@/lib/supabase-browser');
        const sb = getSupabaseBrowser();
        const ch = sb.channel('tasks-changes').on(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'postgres_changes' as any,
          { event: '*', schema: 'public', table: 'tasks' },
          () => fetchTasks()
        ).subscribe();
        unsubscribe = () => ch.unsubscribe();
      } catch { /* no-op if env vars not set */ }
    }
    if (hydrated) subscribe();
    return () => { unsubscribe?.(); };
  }, [hydrated, fetchTasks]);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, changed_by: currentUserId }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    showToast(`ステータスを「${status}」に変更`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/tasks/${deleteId}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== deleteId));
    showToast('タスクを削除しました', 'info');
    setDeleteId(null);
  };

  const handleSelectUser = (id: string) => {
    localStorage.setItem('tasks_current_user_id', id);
    setCurrentUserId(id);
  };

  if (!hydrated) return null;
  if (members.length > 0 && !currentUserId) {
    return <MemberSelect members={members} currentUserId={currentUserId ?? ''} onSelect={handleSelectUser} />;
  }

  const currentMember = members.find(m => m.id === currentUserId);
  const activeCount = tasks.filter(t => t.status !== '完了').length;

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    background: '#fff',
    fontSize: 14,
    color: '#1E293B',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 100,
  };

  return (
    <>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 16px 10px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>📋 タスク管理</h1>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>未完了 {activeCount}件</p>
          </div>
          {currentMember && (
            <button
              onClick={() => {
                localStorage.removeItem('tasks_current_user_id');
                setCurrentUserId(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: currentMember.color + '22', border: 'none', borderRadius: 99, padding: '6px 12px', cursor: 'pointer' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentMember.color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: currentMember.color }}>{currentMember.name}</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={selectStyle}>
            <option value="">全員</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="">全ステータス</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filterAssignee || filterStatus) && (
            <button
              onClick={() => { setFilterAssignee(''); setFilterStatus(''); }}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F1F5F9', fontSize: 13, cursor: 'pointer', color: '#64748B', whiteSpace: 'nowrap' }}
            >
              リセット
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      <div style={{ padding: '12px 12px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>読み込み中...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#94A3B8', fontSize: 15 }}>タスクはありません</p>
          </div>
        ) : (
          <>
            {/* Status summary */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {STATUSES.slice(0, 4).map(s => {
                const count = tasks.filter(t => t.status === s).length;
                if (!count) return null;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 99,
                      border: `1.5px solid ${STATUS_COLORS[s]}`,
                      background: filterStatus === s ? STATUS_COLORS[s] : STATUS_COLORS[s] + '11',
                      color: filterStatus === s ? '#fff' : STATUS_COLORS[s],
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {s} <span style={{ background: filterStatus === s ? 'rgba(255,255,255,0.3)' : STATUS_COLORS[s] + '44', borderRadius: 99, padding: '0 5px' }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={id => setDeleteId(id)}
              />
            ))}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#2563EB',
          color: '#fff',
          border: 'none',
          fontSize: 28,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
        }}
      >
        ＋
      </button>

      {/* New task bottom sheet */}
      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="新しいタスク">
        <TaskForm
          members={members}
          currentUserId={currentUserId ?? ''}
          onSuccess={() => { fetchTasks(); setShowForm(false); }}
        />
      </BottomSheet>

      {/* Delete confirm */}
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
