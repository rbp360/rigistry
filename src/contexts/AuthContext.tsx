'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type User } from 'firebase/auth';
import { onAuth, ensureUserDocument } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

const Ctx = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        await ensureUserDocument(u);
      }
    });
    return () => {
      unsub?.();
    };
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
