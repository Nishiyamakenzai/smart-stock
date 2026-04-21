'use client';
import Link from 'next/link';

export default function SettingsPage() {
  const items = [
    {
      href: '/tasks/settings/notifications',
      icon: '🔔',
      title: '通知設定',
      desc: 'スマホへのプッシュ通知を設定する',
      color: '#FFFBEB',
      border: '#FDE68A',
      textColor: '#D97706',
    },
    {
      href: '/tasks/settings/members',
      icon: '👥',
      title: 'メンバー管理',
      desc: 'スタッフの追加・編集・無効化',
      color: '#EFF6FF',
      border: '#BFDBFE',
      textColor: '#2563EB',
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: '#F8FAFC', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: '#1E293B', margin: 0 }}>⚙️ 設定</h1>
      </div>

      <div style={{ padding: 16, maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: item.color, border: `1.5px solid ${item.border}`,
              borderRadius: 14, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: item.textColor }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{item.desc}</div>
              </div>
              <span style={{ fontSize: 18, color: '#94A3B8' }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
