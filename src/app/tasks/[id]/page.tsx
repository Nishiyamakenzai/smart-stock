'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Task, TaskLog, Member, TaskStatus, TaskPriority, STATUS_COLORS, PRIORITY_COLORS, formatDate } from '@/lib/task-types';
import MemberBadge from '@/components/tasks/MemberBadge';
import TaskHistory from '@/components/tasks/TaskHistory';
import ConfirmDialog from '@/components/tasks/ConfirmDialog';
import { useToast } from '@/components/tasks/Toast';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #E2E8F0', fontSize: 15, color: '#1E293B',
  background: '#F8FAFC', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#94A3B8', display: 'block',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editReviewer, setEditReviewer] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('普通');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editNextAssignee, setEditNextAssignee] = useState('');
  const [editNextTitle, setEditNextTitle] = useState('');
  const [editNextAuto, setEditNextAuto] = useState(false);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('tasks_current_user_id'));
  }, []);

  const reload = async () => {
    const [tr, mr] = await Promise.all([fetch(`/api/tasks/${id}`), fetch('/api/members')]);
    if (tr.ok) {
      const { task: t, logs: l } = await tr.json();
      setTask(t);
      setLogs(l);
      setEditTitle(t.title);
      setEditAssignee(t.assignee_id ?? '');
      setEditReviewer(t.reviewer_id ?? '');
      setEditPriority(t.priority ?? '普通');
      setEditDueDate(t.due_date ?? '');
      setEditNote(t.note ?? '');
      setEditNextAssignee(t.next_assignee_id ?? '');
      setEditNextTitle(t.next_task_title ?? '');
      setEditNextAuto(t.next_task_auto ?? false);
    }
    if (mr.ok) setMembers(await mr.json());
    setLoading(false);
  };

  useEffect(() => { reload(); }, [id]);

  const changeStatus = async (status: TaskStatus) => {
    if (!task) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, changed_by: currentUserId }),
    });
    if (res.ok) {
      const { task: updated, nextTask } = await res.json();
      setTask(prev => prev ? { ...prev, ...updated } : null);
      await reload();
      showToast(`「${status}」に変更しました`);
      if (nextTask) showToast(`💡 ${nextTask.assignee?.name ?? '次の担当者'} へのタスクを自動作成しました`);
    }
    setSaving(false);
  };

  const saveEdits = async () => {
    setSaving(true);
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        assignee_id: editAssignee || null,
        reviewer_id: editReviewer || null,
        priority: editPriority,
        due_date: editDueDate || null,
        note: editNote || null,
        next_assignee_id: editNextAssignee || null,
        next_task_title: editNextTitle || null,
        next_task_auto: editNextAuto,
        changed_by: currentUserId,
      }),
    });
    if (res.ok) {
      const { task: updated } = await res.json();
      setTask(prev => prev ? { ...prev, ...updated } : null);
      setEditing(false);
      showToast('保存しました ✓');
    } else showToast('保存に失敗しました', 'error');
    setSaving(false);
  };

  const handleDelete = async () => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    showToast('削除しました', 'info');
    router.push('/tasks');
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>読み込み中...</div>;
  if (!task) return <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>タスクが見つかりません</div>;

  const statusColor = STATUS_COLORS[task.status];

  return (
    <>
      {/* ヘッダー */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/tasks" style={{ fontSize: 22, textDecoration: 'none', color: '#64748B', lineHeight: 1 }}>←</Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>#{task.task_number}</div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setEditing(!editing)} style={{
              padding: '7px 14px', borderRadius: 10, border: editing ? 'none' : '1px solid #E2E8F0',
              background: editing ? '#2563EB' : '#fff', color: editing ? '#fff' : '#64748B',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{editing ? '編集中' : '編集'}</button>
            <button onClick={() => setShowDelete(true)} style={{
              padding: '7px 14px', borderRadius: 10, border: '1px solid #FCA5A5',
              background: '#FEF2F2', color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>削除</button>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* ステータス変更 */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>ステータスを変更</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(['未対応', '対応中', '確認待ち', '完了', '保留'] as TaskStatus[]).map(s => (
              <button key={s} disabled={saving || task.status === s} onClick={() => changeStatus(s)}
                style={{
                  padding: '9px 16px', borderRadius: 10, border: `2px solid ${STATUS_COLORS[s]}`,
                  background: task.status === s ? STATUS_COLORS[s] : STATUS_COLORS[s] + '11',
                  color: task.status === s ? '#fff' : STATUS_COLORS[s],
                  fontSize: 14, fontWeight: 700, cursor: task.status === s ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
                }}>{s}</button>
            ))}
          </div>
        </div>

        {/* 流れプレビュー */}
        {(task.assignee || task.reviewer || task.next_assignee) && (
          <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>業務の流れ</span>
            {task.assignee && <span style={{ fontSize: 13, fontWeight: 700, color: task.assignee.color, background: task.assignee.color + '22', borderRadius: 99, padding: '3px 12px' }}>{task.assignee.name}</span>}
            {task.reviewer && (<><span style={{ color: '#CBD5E1', fontWeight: 700 }}>→</span><span style={{ fontSize: 11, color: '#94A3B8' }}>確認</span><span style={{ fontSize: 13, fontWeight: 700, color: task.reviewer.color, background: task.reviewer.color + '22', borderRadius: 99, padding: '3px 12px' }}>{task.reviewer.name}</span></>)}
            {task.next_assignee && task.next_task_auto && (<><span style={{ color: '#CBD5E1', fontWeight: 700 }}>→ 完了後自動 →</span><span style={{ fontSize: 13, fontWeight: 700, color: task.next_assignee.color, background: task.next_assignee.color + '22', borderRadius: 99, padding: '3px 12px' }}>{task.next_assignee.name}</span></>)}
          </div>
        )}

        {/* 詳細 */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, marginBottom: 12 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>タスク内容</label>
                <textarea value={editTitle} onChange={e => setEditTitle(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>担当者</label>
                  <select value={editAssignee} onChange={e => setEditAssignee(e.target.value)} style={inputStyle}>
                    <option value="">未設定</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>確認者</label>
                  <select value={editReviewer} onChange={e => setEditReviewer(e.target.value)} style={inputStyle}>
                    <option value="">未設定</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>優先度</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value as TaskPriority)} style={inputStyle}>
                    {(['緊急', '高', '普通', '低'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>期限</label>
                  <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>メモ</label>
                <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'none' }} />
              </div>

              {/* 次のアクション編集 */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                <label style={{ ...labelStyle, marginBottom: 10 }}>完了後の次のアクション</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>次の担当者</label>
                    <select value={editNextAssignee} onChange={e => setEditNextAssignee(e.target.value)} style={inputStyle}>
                      <option value="">なし</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <div onClick={() => setEditNextAuto(!editNextAuto)} style={{ width: 40, height: 22, borderRadius: 99, background: editNextAuto ? '#2563EB' : '#CBD5E1', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 2, left: editNextAuto ? 19 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>自動生成</span>
                    </label>
                  </div>
                </div>
                {editNextAssignee && (
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>次のタスク内容</label>
                    <input value={editNextTitle} onChange={e => setEditNextTitle(e.target.value)} style={inputStyle} placeholder="次の担当者へのタスク内容" />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748B' }}>キャンセル</button>
                <button onClick={saveEdits} disabled={saving} style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '保存中...' : '保存する'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={labelStyle}>タスク内容</span>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', lineHeight: 1.5 }}>{task.title}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><span style={labelStyle}>担当者</span><MemberBadge member={task.assignee} size="md" /></div>
                <div><span style={labelStyle}>確認者</span><MemberBadge member={task.reviewer} size="md" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={labelStyle}>優先度</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                </div>
                <div>
                  <span style={labelStyle}>期限</span>
                  <span style={{ fontSize: 14, color: task.due_date ? '#1E293B' : '#94A3B8' }}>{task.due_date ? formatDate(task.due_date) : '未設定'}</span>
                </div>
              </div>
              {task.note && (
                <div><span style={labelStyle}>メモ</span><p style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{task.note}</p></div>
              )}
              {task.next_assignee && (
                <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>🔗 完了後の次アクション</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: task.next_assignee.color, background: task.next_assignee.color + '22', borderRadius: 99, padding: '2px 10px' }}>{task.next_assignee.name}</span>
                  {task.next_task_title && <span style={{ fontSize: 13, color: '#1E293B' }}>「{task.next_task_title}」</span>}
                  <span style={{ fontSize: 12, color: task.next_task_auto ? '#059669' : '#94A3B8', background: task.next_task_auto ? '#D1FAE5' : '#F1F5F9', borderRadius: 6, padding: '1px 6px' }}>{task.next_task_auto ? '自動生成ON' : '自動生成OFF'}</span>
                </div>
              )}
              <div><span style={labelStyle}>登録者</span><MemberBadge member={task.created_by_member} size="md" /></div>
            </div>
          )}
        </div>

        {/* 変更履歴 */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>変更履歴</p>
          <TaskHistory logs={logs} />
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="タスクを削除"
        message={`「${task.title}」を削除しますか？`}
        confirmLabel="削除する"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
