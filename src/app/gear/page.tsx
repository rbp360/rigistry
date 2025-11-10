'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getDb } from '@/lib/firebase';
import type { GearDoc } from '@/types/schema';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AuthButtons from '@/components/AuthButtons';

export default function GearListPage() {
  const { user, loading: authLoading } = useAuth();
  const [gear, setGear] = useState<GearDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');

  useEffect(() => {
    const db = getDb();
    if (!user || !db) return;
    setLoading(true);
    setError(null);
    // Lazy import firestore to keep tree-shaking healthy
    let unsub: (() => void) | undefined;
    (async () => {
      const { collection, query, where, onSnapshot } = await import('firebase/firestore');
      const col = collection(db, 'gear');
      const q = query(col, where('ownerId', '==', user.uid));
      unsub = onSnapshot(
        q,
        (snap) => {
          const items: GearDoc[] = snap.docs.map((d) => {
            const raw = d.data();
            return {
              id: d.id,
              ownerId: raw.ownerId as string,
              kind: raw.kind as GearDoc['kind'],
              brand: (raw.brand ?? undefined) as string | undefined,
              model: (raw.model ?? undefined) as string | undefined,
              serialNumber: (raw.serialNumber ?? undefined) as string | undefined,
              notes: (raw.notes ?? undefined) as string | undefined,
              imageUrl: (raw.imageUrl ?? undefined) as string | undefined,
              specs: (raw.specs ?? undefined) as Record<string, string | number | boolean> | undefined,
              catalogSource: raw.catalogSource ?? undefined,
              archived: raw.archived ?? false,
              createdAt: raw.createdAt ?? null,
              updatedAt: raw.updatedAt ?? null,
            } satisfies GearDoc;
          });
          const active = items.filter((g) => !g.archived);
          active.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
          setGear(active);
          setLoading(false);
        },
        (err) => {
          setError(err.message || 'Realtime update failed');
          setLoading(false);
        }
      );
    })();
    return () => {
      unsub?.();
    };
  }, [user]);

  // This page has been removed. Gear management is now handled in each room.
    <main style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
