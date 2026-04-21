'use client';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = '削除', danger = false }: Props) {
  if (!open) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onCancel}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#64748B' }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: danger ? '#EF4444' : '#3B82F6', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
