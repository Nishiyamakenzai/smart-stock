'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Member } from '@/lib/task-types';
import PushSetup from '@/components/tasks/PushSetup';

export default function NotificationsSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tasks_current_user_id');
    if (stored) setSelectedId(stored);
    fetch('/api/members').then(r => r.json()).then(data => {
      setMembers(data);
      setLoaded(true);
    });
  }, []);

  const selectedMember = members.find(m => m.id === selectedId);

  return (
    <div style={{ minHeight: '100dvh', background: '#F8FAFC', paddingBottom: 80 }}>
      {/* ヘッダー */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/tasks/settings/members" style={{ textDecoration: 'none', color: '#2563EB', fontSize: 22, lineHeight: 1 }}>‹</Link>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: '#1E293B', margin: 0 }}>🔔 通知設定</h1>
      </div>

      <div style={{ padding: 16, maxWidth: 520, margin: '0 auto' }}>
        {/* 自分を選ぶ */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: '0 0 12px' }}>このスマホを使うのは誰ですか？</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedId(m.id);
                  localStorage.setItem('tasks_current_user_id', m.id);
                }}
                style={{
                  padding: '11px 14px', borderRadius: 10,
                  border: selectedId === m.id ? `2px solid ${m.color}` : '2px solid #E2E8F0',
                  background: selectedId === m.id ? m.color + '11' : '#F8FAFC',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.color + '22', border: `2px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.name[0]}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{m.role}</div>
                </div>
                {selectedId === m.id && (
                  <span style={{ marginLeft: 'auto', fontSize: 18 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 通知設定 */}
        {loaded && selectedMember && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: '0 0 12px' }}>
              {selectedMember.name}さんの通知設定
            </p>
            <PushSetup memberId={selectedMember.id} memberName={selectedMember.name} compact />
          </div>
        )}

        {loaded && !selectedMember && (
          <div style={{ background: '#FFF7ED', borderRadius: 14, border: '1px solid #FED7AA', padding: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#92400E', margin: 0 }}>上から自分の名前を選んでください</p>
          </div>
        )}

        {/* 通知が届く条件の説明 */}
        <div style={{ background: '#EFF6FF', borderRadius: 14, border: '1px solid #BFDBFE', padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', margin: '0 0 10px' }}>📋 通知が届くタイミング</p>
          <ul style={{ fontSize: 13, color: '#1E40AF', margin: 0, paddingLeft: 18, lineHeight: 2 }}>
            <li>自分にタスクが割り当てられたとき</li>
            <li>自分のタスクに確認依頼が来たとき</li>
            <li>自分担当の完了後に次のタスクが作成されたとき</li>
          </ul>
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #BFDBFE' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', margin: '0 0 4px' }}>⚠️ iPhoneをお使いの方へ</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
              通知を受け取るには、このアプリをホーム画面に追加してから設定する必要があります。<br />
              Safari下部の 共有（□↑）→「ホーム画面に追加」
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
