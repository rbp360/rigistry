'use client';

import AuthButtons from '@/components/AuthButtons';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <main style={{ padding: 24 }}>
      <h1>Account</h1>
      <p>Sign in to create and manage your rigs.</p>
      <div style={{ marginTop: 12 }}>
        <AuthButtons />
      </div>
      {user && (
        <div style={{ marginTop: 16 }}>
          <h3>Profile</h3>
          <pre style={{ background: '#0b1220', color: '#e5e7eb', padding: 12, borderRadius: 8 }}>
            {JSON.stringify({ uid: user.uid, displayName: user.displayName, email: user.email }, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
