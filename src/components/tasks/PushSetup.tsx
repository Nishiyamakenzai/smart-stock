'use client';
import { useState, useEffect, useCallback } from 'react';

interface Props {
  memberId: string;
  memberName: string;
  compact?: boolean;
}

type State = 'checking' | 'unsupported' | 'ios-guide' | 'denied' | 'prompt' | 'loading' | 'active';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
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

export default function PushSetup({ memberId, memberName, compact = false }: Props) {
  const [state, setState] = useState<State>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  const checkAndRegister = useCallback(async () => {
    setState('checking');
    setErrorMsg('');

    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      if (isIOS() && !isStandalone()) {
        setState('ios-guide');
      } else {
        setState('unsupported');
      }
      return;
    }

    if (isIOS() && !isStandalone()) {
      setState('ios-guide');
      return;
    }

    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
          });
        }
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: memberId, subscription: sub.toJSON() }),
        });
        setState(res.ok ? 'active' : 'prompt');
      } catch {
        setState('prompt');
      }
      return;
    }

    setState('prompt');
  }, [memberId]);

  useEffect(() => { checkAndRegister(); }, [checkAndRegister]);

  const enable = async () => {
    setState('loading');
    setErrorMsg('');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        });
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, subscription: sub.toJSON() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || '登録に失敗しました');
        setState('prompt');
        return;
      }

      setState('active');
    } catch (e) {
      console.error(e);
      setErrorMsg('通知の設定に失敗しました。もう一度お試しください。');
      setState('prompt');
    }
  };

  const disable = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: memberId, endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
      }
      setState('prompt');
    } catch {
      setState('prompt');
    }
  };

  if (state === 'checking' || state === 'unsupported') return null;

  if (state === 'active') {
    if (compact) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>🔔 {memberName}さんへの通知が有効です</span>
          <button onClick={disable} style={{ fontSize: 11, color: '#94A3B8', background: 'none', border: '1px solid #CBD5E1', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
            無効にする
          </button>
        </div>
      );
    }
    return (
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, margin: '0 0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔔</span>
          <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{memberName}さんへの通知が有効です</span>
        </div>
        <button onClick={disable} style={{ fontSize: 11, color: '#94A3B8', background: 'none', border: '1px solid #CBD5E1', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }}>
          無効にする
        </button>
      </div>
    );
  }

  if (state === 'ios-guide') {
    return (
      <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#C2410C', margin: '0 0 8px' }}>📱 iPhoneで通知を受け取るには</p>
        <ol style={{ fontSize: 13, color: '#92400E', margin: 0, paddingLeft: 18, lineHeight: 2 }}>
          <li>下のバー中央の <strong>共有ボタン（□↑）</strong> をタップ</li>
          <li><strong>「ホーム画面に追加」</strong> を選択</li>
          <li>ホーム画面のアプリアイコンから開き直す</li>
          <li>再度この画面で通知を有効にする</li>
        </ol>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div style={{ background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#BE123C', margin: '0 0 4px' }}>🔕 通知がブロックされています</p>
        <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', lineHeight: 1.6 }}>
          ブラウザの設定でこのサイトの通知を「許可」に変更してから、ページを再読み込みしてください。
        </p>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
          Safari: 設定アプリ → Safari → 通知 → このサイト → 許可<br />
          Chrome: アドレスバーの🔒→ サイトの設定 → 通知 → 許可
        </p>
      </div>
    );
  }

  return (
    <>
      {errorMsg && (
        <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 6, padding: '6px 10px', background: '#FEF2F2', borderRadius: 8 }}>{errorMsg}</p>
      )}
      <button
        onClick={enable}
        disabled={state === 'loading'}
        style={{
          width: '100%', padding: '12px 0',
          background: state === 'loading' ? '#F8FAFC' : '#FFFBEB',
          border: '1.5px dashed #FCD34D',
          borderRadius: 10,
          cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 700, color: '#D97706',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 10,
        }}
      >
        🔔 {state === 'loading' ? '設定中...' : `${memberName}さんのスマホへ通知を受け取る`}
      </button>
    </>
  );
}
