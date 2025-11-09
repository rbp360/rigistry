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

  return (
    <main style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-tungstern)', letterSpacing: '0.5px', fontSize: 42, margin: 0 }}>My Gear</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {user && (
            <Link
              href="/gear/add"
              style={{
                background: '#111',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid #222',
                fontFamily: 'var(--font-tungstern)',
                textDecoration: 'none',
                fontSize: 16,
              }}
            >
              + New Gear
            </Link>
          )}
        </div>
      </header>

      {user && (
        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brand, model or notes…"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, minWidth: 240 }}
          />
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          >
            <option value="all">All kinds</option>
            <option value="guitar">guitar</option>
            <option value="bass">bass</option>
            <option value="amp">amp</option>
            <option value="cab">cab</option>
            <option value="pedal">pedal</option>
            <option value="keyboard">keyboard</option>
            <option value="accessory">accessory</option>
            <option value="interface">interface</option>
            <option value="microphone">microphone</option>
          </select>
        </div>
      )}

      {!user && !authLoading && (
        <div style={{ marginTop: 32 }}>
          // This page has been removed. Gear management is now handled in each room.
          <AuthButtons />
