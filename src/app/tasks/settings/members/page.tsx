'use client';
import { useState, useEffect, useCallback } from 'react';
import { Member } from '@/lib/task-types';
import { useToast } from '@/components/tasks/Toast';
import ConfirmDialog from '@/components/tasks/ConfirmDialog';

const PRESET_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2', '#4F46E5', '#DC2626', '#0D9488', '#9333EA'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  fontSize: 14,
  color: '#1E293B',
  background: '#F8FAFC',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function MembersSettingsPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [color, setColor] = useState('#2563EB');

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/members');
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const resetForm = () => { setName(''); setRole(''); setColor('#2563EB'); setEditId(null); };

  const startEdit = (m: Member) => {
    setEditId(m.id);
    setName(m.name);
    setRole(m.role);
    setColor(m.color);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    const body = { name: name.trim(), role: role.trim(), color };

    if (editId) {
      const res = await fetch(`/api/members/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) { showToast('更新しました ✓'); setShowForm(false); resetForm(); fetchMembers(); }
      else showToast('更新失敗', 'error');
    } else {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, display_order: members.length + 1 }),
      });
      if (res.ok) { showToast('メンバーを追加しました ✓'); setShowForm(false); resetForm(); fetchMembers(); }
      else showToast('追加失敗', 'error');
    }
  };

  const handleDeactivate = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/members/${deleteId}`, { method: 'DELETE' });
    if (res.ok) { showToast('無効化しました', 'info'); fetchMembers(); }
    setDeleteId(null);
  };

  const targetMember = members.find(m => m.id === deleteId);

  return (
    <>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>⚙️ メンバー管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          ＋ 追加
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Add/Edit form */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 14 }}>
              {editId ? 'メンバーを編集' : '新しいメンバー'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>名前 *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="例: 田中" required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>役割 *</label>
                <input value={role} onChange={e => setRole(e.target.value)} placeholder="例: 営業" required style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 8 }}>担当者カラー</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                        outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 40, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: '#64748B' }}>カスタムカラー</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748B' }}>
                  キャンセル
                </button>
                <button type="submit" style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {editId ? '更新する' : '追加する'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Member list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>読み込み中...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => (
              <div
                key={m.id}
                style={{ background: '#fff', borderRadius: 14, border: `1px solid ${m.color}33`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.color + '22', border: `2px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: m.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.name}</p>
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>{m.role}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => startEdit(m)}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748B' }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: 13, cursor: 'pointer', color: '#EF4444' }}
                  >
                    無効化
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="メンバーを無効化"
        message={`「${targetMember?.name}」を無効化しますか？このメンバーのタスクは残ります。`}
        confirmLabel="無効化"
        danger
        onConfirm={handleDeactivate}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
