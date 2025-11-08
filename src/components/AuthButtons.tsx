'use client';

import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '@/lib/firebase';

export default function AuthButtons() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <button onClick={() => void signInWithGoogle()}>
        Sign in with Google
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12 }}>Hi, {user.displayName ?? 'user'}</span>
      <button onClick={() => void signOutUser()}>Sign out</button>
    </div>
  );
}
