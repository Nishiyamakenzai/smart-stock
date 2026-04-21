'use client';
import { TaskStatus, STATUS_COLORS } from '@/lib/task-types';

interface Props {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const color = STATUS_COLORS[status];
  const fs = size === 'sm' ? 11 : 13;
  return (
    <span
      style={{
        display: 'inline-block',
        background: color + '22',
        color,
        borderRadius: 99,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        fontSize: fs,
        fontWeight: 700,
        border: `1px solid ${color}44`,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}
