'use client';

import { getFirebasePublicConfig, isFirebaseReady, validateFirebaseConfig } from '@/lib/firebase';

function redact(val?: string) {
  if (!val) return '';
  if (val.length <= 8) return '••••';
  return val.slice(0, 4) + '…' + val.slice(-4);
}

export default function FirebaseDebugPage() {
  const cfg = getFirebasePublicConfig();
  const ready = isFirebaseReady();
  const valid = validateFirebaseConfig();

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-tungstern)' }}>Firebase Debug</h1>
      <p>Use this page to verify the client config was loaded in the browser.</p>

      <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        <div><strong>isFirebaseReady:</strong> {String(ready)}</div>
        <div><strong>config valid:</strong> {String(valid.ok)} {valid.ok ? '' : `(missing: ${valid.missing.join(', ')})`}</div>
      </div>

      <h3 style={{ marginTop: 16 }}>Public Config (redacted)</h3>
      <ul style={{ lineHeight: 1.8 }}>
        <li>apiKey: {redact(cfg.apiKey)}</li>
        <li>authDomain: {cfg.authDomain || '(missing)'}</li>
        <li>projectId: {cfg.projectId || '(missing)'}</li>
        <li>storageBucket: {cfg.storageBucket || '(missing)'}</li>
        <li>messagingSenderId: {redact(cfg.messagingSenderId)}</li>
        <li>appId: {redact(cfg.appId)}</li>
        <li>measurementId: {cfg.measurementId || '(optional)'}</li>
      </ul>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        If valid is false or isFirebaseReady is false:
        <ol>
          <li>Check your <code>.env.local</code> has NEXT_PUBLIC_FIREBASE_* values and restart dev server.</li>
          <li>In Firebase Console → Authentication → Sign-in method → Enable Google.</li>
          <li>In Authentication → Settings → Authorized domains → add <code>localhost</code> and <code>127.0.0.1</code>.</li>
        </ol>
      </div>
    </main>
  );
}
