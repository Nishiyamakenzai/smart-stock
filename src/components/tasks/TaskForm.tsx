'use client';
import { useState } from 'react';
import { Member, Task, TaskStatus, TaskPriority, NextTaskItem } from '@/lib/task-types';
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
  fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};
const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

function MemberToggle({
  members, selected, onToggle, size = 'md',
}: {
  members: Member[];
  selected: string[];
  onToggle: (id: string) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: size === 'sm' ? 6 : 8 }}>
      {members.map(m => {
        const active = selected.includes(m.id);
        return (
          <button key={m.id} type="button" onClick={() => onToggle(m.id)}
            style={{
              padding: size === 'sm' ? '5px 11px' : '7px 14px',
              borderRadius: 99,
              border: `2px solid ${m.color}`,
              background: active ? m.color : m.color + '11',
              color: active ? '#fff' : m.color,
              fontSize: size === 'sm' ? 13 : 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}>
            <span style={{
              width: size === 'sm' ? 6 : 8,
              height: size === 'sm' ? 6 : 8,
              borderRadius: '50%',
              background: active ? 'rgba(255,255,255,0.7)' : m.color,
            }} />
            {m.name}
            {active && <span style={{ fontSize: 11, opacity: 0.9 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function TaskForm({ members, currentUserId, onSuccess, defaultAssigneeId }: Props) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [title, setTitle] = useState('');
  // 担当者：複数選択
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    defaultAssigneeId ? [defaultAssigneeId] : currentUserId ? [currentUserId] : []
  );
  const [reviewerId, setReviewerId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('未対応');
  const [priority, setPriority] = useState<TaskPriority>('普通');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  // 次のアクション：複数対応
  const [showNext, setShowNext] = useState(false);
  const [nextItems, setNextItems] = useState<NextTaskItem[]>([]); // [{ assignee_id, title }]
  const [nextTaskAuto, setNextTaskAuto] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleAssignee = (id: string) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleNextAssignee = (id: string) => {
    setNextItems(prev => {
      if (prev.find(x => x.assignee_id === id)) {
        return prev.filter(x => x.assignee_id !== id);
      }
      return [...prev, { assignee_id: id, title: '' }];
    });
  };

  const setNextTitle = (assignee_id: string, title: string) => {
    setNextItems(prev => prev.map(x => x.assignee_id === assignee_id ? { ...x, title } : x));
  };

  const reset = () => {
    setTitle(''); setReviewerId(''); setStatus('未対応'); setPriority('普通');
    setDueDate(''); setNote(''); setShowNext(false); setNextItems([]); setNextTaskAuto(true);
    setAssigneeIds(currentUserId ? [currentUserId] : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const validNextItems = showNext
      ? nextItems.filter(x => x.assignee_id && x.title.trim())
      : [];

    const basePayload = {
      title: title.trim(),
      reviewer_id: reviewerId || null,
      status, priority,
      due_date: dueDate || null,
      note: note.trim() || null,
      created_by: currentUserId || null,
      next_tasks: validNextItems.length > 0 ? validNextItems : null,
      next_task_auto: showNext && validNextItems.length > 0 && nextTaskAuto,
      // 旧フィールドは使わない
      next_assignee_id: null,
      next_task_title: null,
    };

    try {
      // 担当者ごとにタスクを作成
      const targets = assigneeIds.length > 0 ? assigneeIds : [null];
      const results = await Promise.all(
        targets.map(aid =>
          fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...basePayload, assignee_id: aid }),
          }).then(r => r.ok ? r.json() : Promise.reject())
        )
      );

      const count = results.length;
      showToast(count > 1 ? `${count}件のタスクを登録しました ✓` : 'タスクを登録しました ✓');
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(50);
      reset();
      onSuccess(results[0]);
    } catch {
      showToast('登録に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedNextIds = nextItems.map(x => x.assignee_id);
  const nextCandidates = members.filter(m => !assigneeIds.includes(m.id));

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
        <textarea value={title} onChange={e => setTitle(e.target.value)}
          placeholder="例: 田中様邸 足場解体の確認" required rows={3}
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} autoFocus />
      </div>

      {/* 担当者（複数選択可） */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5, gap: 6 }}>
          <label style={{ ...labelStyle, margin: 0 }}>担当者 *</label>
          {assigneeIds.length > 1 && (
            <span style={{ fontSize: 11, color: '#2563EB', background: '#EFF6FF', borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>
              {assigneeIds.length}人 → {assigneeIds.length}件作成
            </span>
          )}
        </div>
        <MemberToggle members={members} selected={assigneeIds} onToggle={toggleAssignee} />
      </div>

      {/* 詳細モード */}
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
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="詳細・注意事項など" rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </div>
        </>
      )}

      {/* ─── 完了後の次アクション（複数対応） ─── */}
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
              複数人選択すると、それぞれに別のタスクを作成できます。
            </p>

            {/* 次の担当者（複数選択） */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <label style={{ ...labelStyle, margin: 0 }}>次の担当者</label>
                {selectedNextIds.length > 1 && (
                  <span style={{ fontSize: 11, color: '#7C3AED', background: '#F5F3FF', borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>
                    {selectedNextIds.length}人に渡す
                  </span>
                )}
              </div>
              <MemberToggle
                members={nextCandidates}
                selected={selectedNextIds}
                onToggle={toggleNextAssignee}
                size="sm"
              />
            </div>

            {/* 選択した次担当者ごとのタスク内容入力 */}
            {nextItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nextItems.map(item => {
                  const m = members.find(x => x.id === item.assignee_id);
                  if (!m) return null;
                  return (
                    <div key={item.assignee_id}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: m.color, display: 'block', marginBottom: 4 }}>
                        {m.name}さんへのタスク内容
                      </label>
                      <input
                        value={item.title}
                        onChange={e => setNextTitle(item.assignee_id, e.target.value)}
                        placeholder={`例: ${m.name}さん確認お願いします`}
                        style={{ ...inputStyle, borderColor: item.title.trim() ? m.color + '88' : '#E2E8F0' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* 自動作成トグル */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 0' }}>
              <div onClick={() => setNextTaskAuto(!nextTaskAuto)}
                style={{ width: 44, height: 24, borderRadius: 99, background: nextTaskAuto ? '#2563EB' : '#CBD5E1', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: nextTaskAuto ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>完了時に自動でタスクを作成する</span>
            </label>

            {/* フロープレビュー */}
            {nextItems.some(x => x.title.trim()) && (
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px' }}>完了後の流れ：</p>
                {assigneeIds.map(aid => {
                  const a = members.find(m => m.id === aid);
                  return a ? (
                    <div key={aid} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: a.color, background: a.color + '22', borderRadius: 99, padding: '2px 9px' }}>{a.name}</span>
                      <span style={{ color: '#CBD5E1', fontSize: 11 }}>完了 →</span>
                      {nextItems.filter(x => x.title.trim()).map(x => {
                        const n = members.find(m => m.id === x.assignee_id);
                        return n ? <span key={x.assignee_id} style={{ fontSize: 12, fontWeight: 700, color: n.color, background: n.color + '22', borderRadius: 99, padding: '2px 9px' }}>{n.name}</span> : null;
                      })}
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <button type="submit" disabled={loading || !title.trim() || assigneeIds.length === 0} style={{
        padding: '14px 0', background: loading ? '#93C5FD' : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
        color: '#fff', borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700,
        cursor: loading || assigneeIds.length === 0 ? 'not-allowed' : 'pointer',
      }}>
        {loading ? '登録中...' : assigneeIds.length > 1 ? `${assigneeIds.length}件 登録する` : '登録する'}
      </button>
    </form>
  );
}
