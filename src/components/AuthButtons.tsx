'use client';

import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '@/lib/firebase';
import Image from 'next/image';

export default function AuthButtons() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, background: '#ddd', borderRadius: '50%' }} />
        <div style={{ width: 80, height: 10, background: '#e2e2e2', borderRadius: 4 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => void signInWithGoogle()}
        style={{
          background: '#111',
          color: '#fff',
          padding: '6px 14px',
          borderRadius: 6,
          fontSize: 14,
          cursor: 'pointer',
          border: '1px solid #222'
        }}
      >
        Sign in
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {user.photoURL && (
        <Image
          src={user.photoURL}
          alt={user.displayName ?? 'avatar'}
          width={32}
          height={32}
          style={{ borderRadius: '50%', objectFit: 'cover' }}
        />
      )}
      <span style={{ fontSize: 13, maxWidth: 120, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {user.displayName || user.email || 'User'}
      </span>
      <button
        onClick={() => void signOutUser()}
        style={{
          background: 'transparent',
          color: '#444',
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 12,
          cursor: 'pointer',
          border: '1px solid #ccc'
        }}
      >
        Sign out
      </button>
    </div>
  );
}
