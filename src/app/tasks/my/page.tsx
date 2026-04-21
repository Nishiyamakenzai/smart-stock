'use client';
import { useState, useEffect, useCallback } from 'react';
import { Task, Member, TaskStatus } from '@/lib/task-types';
import TaskCard from '@/components/tasks/TaskCard';
import ConfirmDialog from '@/components/tasks/ConfirmDialog';
import { useToast } from '@/components/tasks/Toast';

export default function MyTasksPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'todo' | 'review'>('todo');
  const [todoTasks, setTodoTasks] = useState<Task[]>([]);
  const [reviewTasks, setReviewTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('tasks_current_user_id');
    setCurrentUserId(stored);
    setHydrated(true);
  }, []);

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/members');
    if (res.ok) setMembers(await res.json());
  }, []);

  const fetchMyTasks = useCallback(async (uid: string) => {
    const [todoRes, reviewRes] = await Promise.all([
      fetch(`/api/tasks?assignee=${uid}`),
      fetch(`/api/tasks?reviewer=${uid}&status=確認待ち`),
    ]);
    if (todoRes.ok) {
      const all: Task[] = await todoRes.json();
      setTodoTasks(all.filter(t => t.status !== '完了' && t.status !== '保留'));
    }
    if (reviewRes.ok) setReviewTasks(await reviewRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  useEffect(() => {
    if (hydrated && currentUserId) fetchMyTasks(currentUserId);
    else if (hydrated) setLoading(false);
  }, [hydrated, currentUserId, fetchMyTasks]);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, changed_by: currentUserId }),
    });
    setTodoTasks(prev => prev.filter(t => t.id !== id || status === '保留'));
    if (status === '完了') setReviewTasks(prev => prev.filter(t => t.id !== id));
    showToast(`ステータスを「${status}」に変更`);
    if (res.ok) {
      const { nextTask } = await res.json();
      if (nextTask) showToast(`💡 ${nextTask.assignee?.name ?? '次の担当者'} へのタスクを自動作成しました`);
    }
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '完了', changed_by: currentUserId }),
    });
    setReviewTasks(prev => prev.filter(t => t.id !== id));
    showToast('確認完了！タスクが完了しました ✓');
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);
    if (res.ok) {
      const { nextTask } = await res.json();
      if (nextTask) showToast(`💡 ${nextTask.assignee?.name ?? '次の担当者'} へのタスクを自動作成しました`);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/tasks/${deleteId}`, { method: 'DELETE' });
    setTodoTasks(prev => prev.filter(t => t.id !== deleteId));
    setReviewTasks(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);
    showToast('削除しました', 'info');
  };

  if (!hydrated) return null;

  const currentMember = members.find(m => m.id === currentUserId);

  if (!currentUserId) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#94A3B8', fontSize: 15 }}>
          <a href="/tasks" style={{ color: '#2563EB' }}>トップページ</a>でメンバーを選択してください
        </p>
      </div>
    );
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 0',
    border: 'none',
    background: 'none',
    fontSize: 15,
    fontWeight: active ? 700 : 400,
    color: active ? '#2563EB' : '#94A3B8',
    cursor: 'pointer',
    borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 16px 0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>👤 マイタスク</h1>
          {currentMember && (
            <span style={{ fontSize: 13, fontWeight: 600, color: currentMember.color, background: currentMember.color + '22', padding: '3px 10px', borderRadius: 99 }}>
              {currentMember.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex' }}>
          <button style={tabStyle(tab === 'todo')} onClick={() => setTab('todo')}>
            やること
            {todoTasks.length > 0 && (
              <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 12 }}>
                {todoTasks.length}
              </span>
            )}
          </button>
          <button style={tabStyle(tab === 'review')} onClick={() => setTab('review')}>
            確認依頼
            {reviewTasks.length > 0 && (
              <span style={{ marginLeft: 6, background: '#10B981', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 12 }}>
                {reviewTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 12px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>読み込み中...</div>
        ) : tab === 'todo' ? (
          todoTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <p style={{ color: '#94A3B8', fontSize: 15 }}>やることはありません！</p>
            </div>
          ) : (
            todoTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={id => setDeleteId(id)}
              />
            ))
          )
        ) : (
          reviewTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👍</div>
              <p style={{ color: '#94A3B8', fontSize: 15 }}>確認依頼はありません</p>
            </div>
          ) : (
            reviewTasks.map(task => (
              <div key={task.id}>
                <TaskCard
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={id => setDeleteId(id)}
                />
                <button
                  onClick={() => handleApprove(task.id)}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: '#10B981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: -6,
                    marginBottom: 16,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  }}
                >
                  ✅ 確認OK → 完了にする
                </button>
              </div>
            ))
          )
        )}
      </div>

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
