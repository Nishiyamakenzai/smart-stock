'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Task, STATUS_COLORS, PRIORITY_COLORS, nextStatus, formatDate, TaskStatus } from '@/lib/task-types';
import MemberBadge from './MemberBadge';

interface Props {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onStatusChange, onDelete }: Props) {
  const [swiped, setSwiped] = useState(false);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const [swipeX, setSwipeX] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  const statusColor = STATUS_COLORS[task.status];
  const isUrgent = task.priority === '緊急';
  const isOverdue = task.due_date && task.status !== '完了' && new Date(task.due_date) < new Date();

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    setSwiped(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    setSwipeX(Math.max(-80, Math.min(80, dx)));
  };

  const handleTouchEnd = async () => {
    isDragging.current = false;
    if (swipeX > 50) {
      // Right swipe → advance status
      const next = nextStatus(task.status);
      if (next !== task.status) {
        setAdvancing(true);
        await onStatusChange(task.id, next);
        setAdvancing(false);
      }
    } else if (swipeX < -50) {
      // Left swipe → show delete
      setSwiped(true);
    }
    setSwipeX(0);
  };

  const bg = task.assignee?.color ? task.assignee.color + '11' : '#F8FAFC';

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14, marginBottom: 10 }}>
      {/* Delete backdrop */}
      {swiped && (
        <div
          style={{ position: 'absolute', inset: 0, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 20, borderRadius: 14, zIndex: 0 }}
          onClick={() => setSwiped(false)}
        >
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            style={{ background: '#fff', color: '#EF4444', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            削除
          </button>
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          zIndex: 1,
          transform: `translateX(${swiped ? -80 : swipeX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          background: isUrgent ? '#FEF2F2' : bg,
          borderRadius: 14,
          border: `1px solid ${isUrgent ? '#FCA5A5' : '#E2E8F0'}`,
          display: 'flex',
          overflow: 'hidden',
          boxShadow: advancing ? '0 0 0 2px ' + statusColor : '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {/* Status bar */}
        <div style={{ width: 5, background: statusColor, flexShrink: 0 }} />

        <Link
          href={`/tasks/${task.id}`}
          style={{ flex: 1, padding: '12px 14px', textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                {isUrgent && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', padding: '1px 6px', borderRadius: 6, animation: 'pulse 1.5s infinite' }}>
                    ★緊急★
                  </span>
                )}
                {task.priority === '高' && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS['高'], background: '#FFF7ED', padding: '1px 6px', borderRadius: 6 }}>高</span>
                )}
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', lineHeight: 1.4, wordBreak: 'break-all' }}>
                #{task.task_number} {task.title}
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: statusColor,
                background: statusColor + '22',
                borderRadius: 6,
                padding: '3px 8px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {task.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>担当</span>
            <MemberBadge member={task.assignee} />
            {task.reviewer && (
              <>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>→ 確認</span>
                <MemberBadge member={task.reviewer} />
              </>
            )}
            {task.due_date && (
              <span style={{ fontSize: 12, color: isOverdue ? '#EF4444' : '#94A3B8', fontWeight: isOverdue ? 700 : 400, marginLeft: 'auto' }}>
                期限 {formatDate(task.due_date)}{isOverdue ? ' ⚠️' : ''}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
