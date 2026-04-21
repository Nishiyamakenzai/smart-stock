'use client';
import { useState, useEffect } from 'react';

interface Props {
  memberId: string;
  memberName: string;
}

export default function PushSetup({ memberId, memberName }: Props) {
  const [state, setState] = useState<'unknown' | 'granted' | 'denied' | 'loading'>('unknown');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('denied');
      return;
    }
    setState(Notification.permission === 'granted' ? 'granted' : 'unknown');
  }, []);

  const enable = async () => {
    setState('loading');
    try {
      // Service worker登録
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setState('denied'); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, subscription: sub.toJSON() }),
      });

      setState('granted');
    } catch (e) {
      console.error(e);
      setState('denied');
    }
  };

  if (state === 'granted') {
    return (
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px' }}>
        <span>🔔</span>
        <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{memberName}さんへの通知が有効です</span>
      </div>
    );
  }

  if (state === 'denied' || state === 'unknown') {
    return (
      <button onClick={enable} style={{
        width: '100%', padding: '11px 0', background: '#FFFBEB', border: '1.5px dashed #FCD34D',
        borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#D97706',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10,
      }}>
        🔔 スマホに通知を受け取る（タップして設定）
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <button disabled style={{
        width: '100%', padding: '11px 0', background: '#FFFBEB', border: '1.5px dashed #FCD34D',
        borderRadius: 10, cursor: 'not-allowed', fontSize: 13, fontWeight: 700, color: '#D97706',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10,
      }}>
        🔔 設定中...
      </button>
    );
  }

  return null;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}
