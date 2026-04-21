'use client';
import { TaskLog, formatDateTime } from '@/lib/task-types';

const ACTION_LABELS: Record<string, string> = {
  created: '登録',
  status_changed: 'ステータス変更',
  reassigned: '担当変更',
  commented: 'コメント',
  edited: '編集',
};

interface Props {
  logs: TaskLog[];
}

export default function TaskHistory({ logs }: Props) {
  if (!logs.length) return <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>変更履歴なし</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {logs.map((log, i) => (
        <div key={log.id} style={{ display: 'flex', gap: 12, paddingBottom: i < logs.length - 1 ? 16 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1', marginTop: 5, flexShrink: 0 }} />
            {i < logs.length - 1 && <div style={{ width: 1, flex: 1, background: '#E2E8F0', marginTop: 4 }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>{formatDateTime(log.created_at)}</span>
              {log.changed_by_member && (
                <span style={{ fontSize: 12, fontWeight: 600, color: log.changed_by_member.color }}>
                  {log.changed_by_member.name}
                </span>
              )}
              <span style={{ fontSize: 12, color: '#64748B' }}>が{ACTION_LABELS[log.action] ?? log.action}</span>
            </div>
            {log.action === 'status_changed' && log.old_value && log.new_value && (
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                「{log.old_value}」→「{log.new_value}」
              </div>
            )}
            {log.action === 'commented' && log.new_value && (
              <div style={{ fontSize: 13, color: '#1E293B', marginTop: 2 }}>{log.new_value}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
