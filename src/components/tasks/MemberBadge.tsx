'use client';
import { Member } from '@/lib/task-types';

interface Props {
  member: Member | undefined | null;
  size?: 'sm' | 'md';
  label?: string;
}

export default function MemberBadge({ member, size = 'sm', label }: Props) {
  if (!member) return <span style={{ color: '#94A3B8', fontSize: size === 'sm' ? 12 : 14 }}>{label ?? '未設定'}</span>;

  const bg = member.color + '33';
  const fs = size === 'sm' ? 11 : 13;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: bg,
        color: member.color,
        borderRadius: 99,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        fontSize: fs,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: size === 'sm' ? 6 : 8,
          height: size === 'sm' ? 6 : 8,
          borderRadius: '50%',
          background: member.color,
          flexShrink: 0,
        }}
      />
      {member.name}
    </span>
  );
}
