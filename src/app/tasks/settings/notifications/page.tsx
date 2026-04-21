'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Member } from '@/lib/task-types';
import PushSetup from '@/components/tasks/PushSetup';

export default function NotificationsSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('tasks_current_user_id');
    if (stored) setSelectedId(stored);
    fetch('/api/members').then(r => r.json()).then(data => {
      setMembers(data);
      setLoaded(true);
    });
  }, []);

  const selectMember = (id: string) => {
    setSelectedId(id);
    localStorage.setItem('tasks_current_user_id', id);
    setTestState('idle');
    setTestMsg('');
  };

  const sendTest = async () => {
    if (!selectedId) return;
    setTestState('sending');
    setTestMsg('');
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: selectedId }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestState('ok');
        setTestMsg('テスト通知を送信しました！スマホに届いていますか？');
      } else {
        setTestState('error');
        setTestMsg(data.message || 'テスト送信に失敗しました');
      }
    } catch {
      setTestState('error');
      setTestMsg('ネットワークエラーが発生しました');
    }
  };

  const selectedMember = members.find(m => m.id === selectedId);

  return (
    <div style={{ minHeight: '100dvh', background: '#F8FAFC', paddingBottom: 80 }}>
      {/* ヘッダー */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/tasks/settings" style={{ textDecoration: 'none', color: '#2563EB', fontSize: 22, lineHeight: 1 }}>‹</Link>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: '#1E293B', margin: 0 }}>🔔 通知設定</h1>
      </div>

      <div style={{ padding: 16, maxWidth: 520, margin: '0 auto' }}>
        {/* 手順説明 */}
        <div style={{ background: '#EFF6FF', borderRadius: 14, border: '1px solid #BFDBFE', padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', margin: '0 0 8px' }}>📋 設定の手順</p>
          <ol style={{ fontSize: 13, color: '#1E40AF', margin: 0, paddingLeft: 18, lineHeight: 2 }}>
            <li>下から自分の名前を選ぶ</li>
            <li>「通知を受け取る」ボタンをタップ</li>
            <li>「テスト通知を送る」で動作確認</li>
          </ol>
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#FFF7ED', borderRadius: 8, border: '1px solid #FED7AA' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', margin: '0 0 3px' }}>📱 iPhoneの方へ（重要）</p>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.7 }}>
              Safariの共有ボタン（□↑）→「ホーム画面に追加」→ホーム画面のアイコンから開き直してから設定してください
            </p>
          </div>
        </div>

        {/* 自分を選ぶ */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: '0 0 12px' }}>このスマホを使うのは誰ですか？</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => selectMember(m.id)}
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{m.role}</div>
                </div>
                {selectedId === m.id && (
                  <span style={{ fontSize: 16, color: m.color, fontWeight: 800 }}>✓</span>
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

            {/* テスト送信ボタン */}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={sendTest}
                disabled={testState === 'sending'}
                style={{
                  width: '100%', padding: '10px 0',
                  background: testState === 'sending' ? '#F8FAFC' : '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: 10, cursor: testState === 'sending' ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 700, color: '#0284C7',
                }}
              >
                {testState === 'sending' ? '送信中...' : '🧪 テスト通知を送る'}
              </button>
              {testState === 'ok' && (
                <p style={{ fontSize: 12, color: '#059669', marginTop: 6, textAlign: 'center', fontWeight: 600 }}>✓ {testMsg}</p>
              )}
              {testState === 'error' && (
                <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6, textAlign: 'center' }}>⚠ {testMsg}</p>
              )}
            </div>
          </div>
        )}

        {loaded && !selectedMember && (
          <div style={{ background: '#FFF7ED', borderRadius: 14, border: '1px solid #FED7AA', padding: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#92400E', margin: 0 }}>↑ 上から自分の名前を選んでください</p>
          </div>
        )}

        {/* 通知が届くタイミング */}
        <div style={{ background: '#F0FDF4', borderRadius: 14, border: '1px solid #BBF7D0', padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#059669', margin: '0 0 10px' }}>🔔 通知が届くタイミング</p>
          <ul style={{ fontSize: 13, color: '#065F46', margin: 0, paddingLeft: 18, lineHeight: 2.2 }}>
            <li>自分にタスクが割り当てられたとき</li>
            <li>担当タスクに確認依頼が来たとき（レビュアーへ）</li>
            <li>完了後の次タスクが自動作成されたとき</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
