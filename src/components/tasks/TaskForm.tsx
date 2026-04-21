'use client';
import { useState } from 'react';
import { Member, TaskStatus, TaskPriority, PRIORITY_COLORS } from '@/lib/task-types';
import { useToast } from './Toast';

interface Props {
  members: Member[];
  currentUserId: string;
  onSuccess: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  fontSize: 15,
  color: '#1E293B',
  background: '#F8FAFC',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#64748B',
  display: 'block',
  marginBottom: 6,
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

export default function TaskForm({ members, currentUserId, onSuccess }: Props) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState(currentUserId || '');
  const [reviewerId, setReviewerId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('未対応');
  const [priority, setPriority] = useState<TaskPriority>('普通');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setReviewerId('');
    setStatus('未対応');
    setPriority('普通');
    setDueDate('');
    setNote('');
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
          status,
          priority,
          due_date: dueDate || null,
          note: note.trim() || null,
          created_by: currentUserId || null,
        }),
      });
      if (!res.ok) throw new Error('登録失敗');
      showToast('タスクを登録しました ✓');
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(50);
      reset();
      onSuccess();
    } catch {
      showToast('登録に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>タスク内容 *</label>
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="例: 中村様邸 雨漏り調査"
          required
          rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
        />
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>担当者 *</label>
          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={inputStyle}>
            <option value="">未設定</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>次の確認者</label>
          <select value={reviewerId} onChange={e => setReviewerId(e.target.value)} style={inputStyle}>
            <option value="">未設定</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>ステータス</label>
          <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={inputStyle}>
            {(['未対応', '対応中', '確認待ち', '完了', '保留'] as TaskStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>優先度</label>
          <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={inputStyle}>
            {(['緊急', '高', '普通', '低'] as TaskPriority[]).map(p => (
              <option key={p} value={p} style={{ color: PRIORITY_COLORS[p] }}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>期限</label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>メモ（任意）</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="備考・詳細など"
          rows={2}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim()}
        style={{
          padding: '14px 0',
          background: loading ? '#93C5FD' : '#2563EB',
          color: '#fff',
          borderRadius: 12,
          border: 'none',
          fontSize: 16,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {loading ? '登録中...' : '登録する'}
      </button>
    </form>
  );
}
