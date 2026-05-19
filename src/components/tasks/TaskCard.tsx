'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Task, STATUS_COLORS, PRIORITY_COLORS, nextStatus, formatDate, TaskStatus } from '@/lib/task-types';
import ConfirmDialog from '@/components/tasks/ConfirmDialog';

interface Props {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDelete: (id: string) => void;
}

function MiniMember({ member, label }: { member: Task['assignee']; label?: string }) {
  if (!member) return <span style={{ color: '#CBD5E1', fontSize: 12 }}>{label ?? '未設定'}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: member.color + '22', color: member.color, borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: member.color, flexShrink: 0 }} />{member.name}
    </span>
  );
}

export default function TaskCard({ task, onStatusChange, onDelete }: Props) {
  const startX = useRef(0);
  const isDragging = useRef(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);

  const statusColor = STATUS_COLORS[task.status];
  const isUrgent = task.priority === '緊急';
  const isOverdue = task.due_date && task.status !== '完了' && new Date(task.due_date) < new Date();
  const isDone = task.status === '完了';

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    setSwiped(false);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    setSwipeX(Math.max(-80, Math.min(80, e.touches[0].clientX - startX.current)));
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    if (swipeX > 50) {
      const next = nextStatus(task.status);
      if (next !== task.status) setPendingStatus(next);
    } else if (swipeX < -50) {
      setSwiped(true);
    }
    setSwipeX(0);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    setAdvancing(true);
    await onStatusChange(task.id, pendingStatus);
    setAdvancing(false);
    setPendingStatus(null);
  };

  const cardBg = isDone ? '#F8FAFC' : (task.assignee?.color ? task.assignee.color + '0D' : '#fff');

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, marginBottom: 10 }}>
      {/* 削除バックドロップ */}
      {swiped && (
        <div style={{ position: 'absolute', inset: 0, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 16, borderRadius: 14 }}
          onClick={() => setSwiped(false)}>
          <button onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            style={{ background: '#fff', color: '#EF4444', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            削除
          </button>
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative', zIndex: 1,
          transform: `translateX(${swiped ? -80 : swipeX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          background: isUrgent ? '#FEF2F2' : cardBg,
          borderRadius: 14,
          border: `1px solid ${isUrgent ? '#FCA5A5' : (isDone ? '#E2E8F0' : statusColor + '33')}`,
          display: 'flex', overflow: 'hidden',
          boxShadow: advancing ? `0 0 0 2px ${statusColor}` : '0 1px 4px rgba(0,0,0,0.06)',
          opacity: isDone ? 0.7 : 1,
        }}
      >
        {/* ステータスバー */}
        <div style={{ width: 5, background: statusColor, flexShrink: 0 }} />

        <Link href={`/tasks/${task.id}`} style={{ flex: 1, padding: '12px 14px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          {/* タイトル行 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                {isUrgent && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', padding: '1px 7px', borderRadius: 6, animation: 'pulse 1.5s infinite' }}>★緊急★</span>
                )}
                {task.priority === '高' && !isUrgent && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS['高'], background: '#FFF7ED', padding: '1px 7px', borderRadius: 6 }}>優先高</span>
                )}
                <span style={{ fontSize: 11, color: '#CBD5E1' }}>#{task.task_number}</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: isDone ? 500 : 700, color: isDone ? '#94A3B8' : '#1E293B', lineHeight: 1.4, textDecoration: isDone ? 'line-through' : 'none', wordBreak: 'break-all' }}>
                {task.title}
              </p>
            </div>
            {/* ステータスバッジ */}
            <span style={{
              fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + '1A',
              borderRadius: 8, padding: '4px 9px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{task.status}</span>
          </div>

          {/* ─── フロー表示 ─── */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: task.due_date || task.next_assignee ? 6 : 0 }}>
            <MiniMember member={task.assignee} label="未割当" />
            {task.reviewer && (
              <>
                <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 700 }}>→</span>
                <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>確認</span>
                <MiniMember member={task.reviewer} />
              </>
            )}
            {task.next_assignee && (
              <>
                <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 700 }}>→</span>
                <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>次</span>
                <MiniMember member={task.next_assignee} />
              </>
            )}
          </div>

          {/* 期限 & 登録者 */}
          {(task.due_date || task.created_by_member) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              {task.created_by_member && (
                <span style={{ fontSize: 11, color: '#CBD5E1' }}>登録: {task.created_by_member.name}</span>
              )}
              {task.due_date && (
                <span style={{ fontSize: 12, color: isOverdue ? '#EF4444' : '#94A3B8', fontWeight: isOverdue ? 700 : 400, marginLeft: 'auto' }}>
                  期限 {formatDate(task.due_date)}{isOverdue ? ' ⚠️' : ''}
                </span>
              )}
            </div>
          )}
        </Link>

        {/* クイックステータス進行ボタン */}
        {!isDone && task.status !== '保留' && (
          <button
            onClick={e => {
              e.preventDefault();
              const next = nextStatus(task.status);
              if (next !== task.status) setPendingStatus(next);
            }}
            style={{
              flexShrink: 0, alignSelf: 'stretch', width: 44, background: statusColor + '18',
              border: 'none', borderLeft: `1px solid ${statusColor}22`, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              color: statusColor, padding: 0,
            }}
            title="ステータスを次に進める"
          >
            <span style={{ fontSize: 16 }}>▶</span>
            <span style={{ fontSize: 9, fontWeight: 700, writingMode: 'vertical-rl', letterSpacing: 1 }}>
              {nextStatus(task.status)}
            </span>
          </button>
        )}
      </div>

      <ConfirmDialog
        open={pendingStatus !== null}
        title="ステータスを変更"
        message={`「${task.title}」を「${pendingStatus}」に変更しますか？`}
        confirmLabel={`${pendingStatus}にする`}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}

interface Props {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDelete: (id: string) => void;
}

function MiniMember({ member, label }: { member: Task['assignee']; label?: string }) {
  if (!member) return <span style={{ color: '#CBD5E1', fontSize: 12 }}>{label ?? '未設定'}</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: member.color + '22', color: member.color, borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: member.color, flexShrink: 0 }} />{member.name}
    </span>
  );
}

export default function TaskCard({ task, onStatusChange, onDelete }: Props) {
  const startX = useRef(0);
  const isDragging = useRef(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const statusColor = STATUS_COLORS[task.status];
  const isUrgent = task.priority === '緊急';
  const isOverdue = task.due_date && task.status !== '完了' && new Date(task.due_date) < new Date();
  const isDone = task.status === '完了';

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    setSwiped(false);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    setSwipeX(Math.max(-80, Math.min(80, e.touches[0].clientX - startX.current)));
  };
  const handleTouchEnd = async () => {
    isDragging.current = false;
    if (swipeX > 50) {
      const next = nextStatus(task.status);
      if (next !== task.status) { setAdvancing(true); await onStatusChange(task.id, next); setAdvancing(false); }
    } else if (swipeX < -50) {
      setSwiped(true);
    }
    setSwipeX(0);
  };

  const cardBg = isDone ? '#F8FAFC' : (task.assignee?.color ? task.assignee.color + '0D' : '#fff');

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, marginBottom: 10 }}>
      {/* 削除バックドロップ */}
      {swiped && (
        <div style={{ position: 'absolute', inset: 0, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 16, borderRadius: 14 }}
          onClick={() => setSwiped(false)}>
          <button onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            style={{ background: '#fff', color: '#EF4444', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            削除
          </button>
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative', zIndex: 1,
          transform: `translateX(${swiped ? -80 : swipeX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          background: isUrgent ? '#FEF2F2' : cardBg,
          borderRadius: 14,
          border: `1px solid ${isUrgent ? '#FCA5A5' : (isDone ? '#E2E8F0' : statusColor + '33')}`,
          display: 'flex', overflow: 'hidden',
          boxShadow: advancing ? `0 0 0 2px ${statusColor}` : '0 1px 4px rgba(0,0,0,0.06)',
          opacity: isDone ? 0.7 : 1,
        }}
      >
        {/* ステータスバー */}
        <div style={{ width: 5, background: statusColor, flexShrink: 0 }} />

        <Link href={`/tasks/${task.id}`} style={{ flex: 1, padding: '12px 14px', textDecoration: 'none', color: 'inherit', display: 'block' }}>
          {/* タイトル行 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                {isUrgent && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', padding: '1px 7px', borderRadius: 6, animation: 'pulse 1.5s infinite' }}>★緊急★</span>
                )}
                {task.priority === '高' && !isUrgent && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS['高'], background: '#FFF7ED', padding: '1px 7px', borderRadius: 6 }}>優先高</span>
                )}
                <span style={{ fontSize: 11, color: '#CBD5E1' }}>#{task.task_number}</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: isDone ? 500 : 700, color: isDone ? '#94A3B8' : '#1E293B', lineHeight: 1.4, textDecoration: isDone ? 'line-through' : 'none', wordBreak: 'break-all' }}>
                {task.title}
              </p>
            </div>
            {/* ステータスバッジ */}
            <span style={{
              fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + '1A',
              borderRadius: 8, padding: '4px 9px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{task.status}</span>
          </div>

          {/* ─── フロー表示 ─── */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: task.due_date || task.next_assignee ? 6 : 0 }}>
            <MiniMember member={task.assignee} label="未割当" />
            {task.reviewer && (
              <>
                <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 700 }}>→</span>
                <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>確認</span>
                <MiniMember member={task.reviewer} />
              </>
            )}
            {task.next_assignee && (
              <>
                <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 700 }}>→</span>
                <span style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>次</span>
                <MiniMember member={task.next_assignee} />
              </>
            )}
          </div>

          {/* 期限 & 登録者 */}
          {(task.due_date || task.created_by_member) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              {task.created_by_member && (
                <span style={{ fontSize: 11, color: '#CBD5E1' }}>登録: {task.created_by_member.name}</span>
              )}
              {task.due_date && (
                <span style={{ fontSize: 12, color: isOverdue ? '#EF4444' : '#94A3B8', fontWeight: isOverdue ? 700 : 400, marginLeft: 'auto' }}>
                  期限 {formatDate(task.due_date)}{isOverdue ? ' ⚠️' : ''}
                </span>
              )}
            </div>
          )}
        </Link>

        {/* クイックステータス進行ボタン */}
        {!isDone && task.status !== '保留' && (
          <button
            onClick={async e => {
              e.preventDefault();
              const next = nextStatus(task.status);
              if (next !== task.status) { setAdvancing(true); await onStatusChange(task.id, next); setAdvancing(false); }
            }}
            style={{
              flexShrink: 0, alignSelf: 'stretch', width: 44, background: statusColor + '18',
              border: 'none', borderLeft: `1px solid ${statusColor}22`, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              color: statusColor, padding: 0,
            }}
            title="ステータスを次に進める"
          >
            <span style={{ fontSize: 16 }}>▶</span>
            <span style={{ fontSize: 9, fontWeight: 700, writingMode: 'vertical-rl', letterSpacing: 1 }}>
              {nextStatus(task.status)}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
