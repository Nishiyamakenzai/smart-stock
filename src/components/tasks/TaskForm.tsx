'use client';
import { useState } from 'react';
import { Member, Task, TaskStatus, TaskPriority } from '@/lib/task-types';
import { useToast } from './Toast';

interface Props {
  members: Member[];
  currentUserId: string;
  onSuccess: (task?: Task) => void;
  defaultAssigneeId?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #E2E8F0', fontSize: 15, color: '#1E293B',
  background: '#F8FAFC', outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em',
};
const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

export default function TaskForm({ members, currentUserId, onSuccess, defaultAssigneeId }: Props) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId || currentUserId || '');
  const [reviewerId, setReviewerId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('未対応');
  const [priority, setPriority] = useState<TaskPriority>('普通');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  // 次のアクション
  const [showNext, setShowNext] = useState(false);
  const [nextAssigneeId, setNextAssigneeId] = useState('');
  const [nextTaskTitle, setNextTaskTitle] = useState('');
  const [nextTaskAuto, setNextTaskAuto] = useState(true);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle(''); setReviewerId(''); setStatus('未対応'); setPriority('普通');
    setDueDate(''); setNote(''); setShowNext(false); setNextAssigneeId(''); setNextTaskTitle(''); setNextTaskAuto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          assignee_id: assigneeId || null,
          reviewer_id: reviewerId || null,
          status, priority,
          due_date: dueDate || null,
          note: note.trim() || null,
          created_by: currentUserId || null,
          next_assignee_id: showNext && nextAssigneeId ? nextAssigneeId : null,
          next_task_title: showNext && nextTaskTitle.trim() ? nextTaskTitle.trim() : null,
          next_task_auto: showNext && nextTaskAuto,
        }),
      });
      if (!res.ok) throw new Error();
      const task = await res.json();
      showToast('タスクを登録しました ✓');
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(50);
      reset();
      onSuccess(task);
    } catch {
      showToast('登録に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const assignee = members.find(m => m.id === assigneeId);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* モード切替 */}
      <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 3 }}>
        {(['quick', 'full'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: mode === m ? '#fff' : 'transparent',
            color: mode === m ? '#1E293B' : '#94A3B8',
            fontWeight: mode === m ? 700 : 500, fontSize: 13, cursor: 'pointer',
            boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            {m === 'quick' ? '⚡ クイック' : '📝 詳細入力'}
          </button>
        ))}
      </div>

      {/* タスク内容 */}
      <div>
        <label style={labelStyle}>タスク内容 *</label>
        <textarea value={title} onChange={e => setTitle(e.target.value)} placeholder="例: 田中様邸 足場解体の確認" required rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} autoFocus />
      </div>

      {/* 担当者 */}
      <div>
        <label style={labelStyle}>担当者 *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {members.map(m => (
            <button key={m.id} type="button" onClick={() => setAssigneeId(assigneeId === m.id ? '' : m.id)}
              style={{
                padding: '7px 14px', borderRadius: 99, border: `2px solid ${m.color}`,
                background: assigneeId === m.id ? m.color : m.color + '11',
                color: assigneeId === m.id ? '#fff' : m.color,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: assigneeId === m.id ? 'rgba(255,255,255,0.7)' : m.color }} />
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* 詳細モード追加フィールド */}
      {mode === 'full' && (
        <>
          <div style={row2}>
            <div>
              <label style={labelStyle}>確認者</label>
              <select value={reviewerId} onChange={e => setReviewerId(e.target.value)} style={inputStyle}>
                <option value="">未設定</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>優先度</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={inputStyle}>
                {(['緊急', '高', '普通', '低'] as TaskPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={row2}>
            <div>
              <label style={labelStyle}>ステータス</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={inputStyle}>
                {(['未対応', '対応中', '確認待ち', '完了', '保留'] as TaskStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>期限</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>メモ（任意）</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="詳細・注意事項など" rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </div>
        </>
      )}

      {/* ─── 完了後の次アクション ─── */}
      <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #CBD5E1', overflow: 'hidden' }}>
        <button type="button" onClick={() => setShowNext(!showNext)}
          style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
          <span style={{ fontSize: 16 }}>{showNext ? '🔗' : '➕'}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: showNext ? '#2563EB' : '#64748B' }}>
            完了したら次の人へ自動でタスクを渡す
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8' }}>{showNext ? '▲' : '▼'}</span>
        </button>

        {showNext && (
          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: -2 }}>
              このタスクが「完了」になったとき、自動で次の担当者にタスクを作成します。LINEで連絡する代わりに使ってください。
            </p>

            <div>
              <label style={labelStyle}>次の担当者</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {members.filter(m => m.id !== assigneeId).map(m => (
                  <button key={m.id} type="button" onClick={() => setNextAssigneeId(nextAssigneeId === m.id ? '' : m.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 99, border: `2px solid ${m.color}`,
                      background: nextAssigneeId === m.id ? m.color : m.color + '11',
                      color: nextAssigneeId === m.id ? '#fff' : m.color,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    }}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {nextAssigneeId && (
              <div>
                <label style={labelStyle}>次のタスク内容</label>
                <input value={nextTaskTitle} onChange={e => setNextTaskTitle(e.target.value)}
                  placeholder={`例: ${members.find(m => m.id === nextAssigneeId)?.name}さん確認お願いします`}
                  style={inputStyle} />
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
              <div
                onClick={() => setNextTaskAuto(!nextTaskAuto)}
                style={{
                  width: 44, height: 24, borderRadius: 99, background: nextTaskAuto ? '#2563EB' : '#CBD5E1',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                <div style={{
                  position: 'absolute', top: 2, left: nextTaskAuto ? 22 : 2, width: 20, height: 20,
                  borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>完了時に自動でタスクを作成する</span>
            </label>

            {/* フロープレビュー */}
            {nextAssigneeId && (
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>流れ：</span>
                {assignee && <span style={{ fontSize: 13, fontWeight: 700, color: assignee.color, background: assignee.color + '22', borderRadius: 99, padding: '2px 10px' }}>{assignee.name}</span>}
                <span style={{ color: '#CBD5E1', fontWeight: 700 }}>→ 完了 →</span>
                {(() => { const n = members.find(m => m.id === nextAssigneeId); return n ? <span style={{ fontSize: 13, fontWeight: 700, color: n.color, background: n.color + '22', borderRadius: 99, padding: '2px 10px' }}>{n.name}</span> : null; })()}
              </div>
            )}
          </div>
        )}
      </div>

      <button type="submit" disabled={loading || !title.trim()} style={{
        padding: '14px 0', background: loading ? '#93C5FD' : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
        color: '#fff', borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}>
        {loading ? '登録中...' : '登録する'}
      </button>
    </form>
  );
}
