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
          <p style={{ fontSize: 18 }}>Sign in to start cataloging your instruments and pedals.</p>
          <AuthButtons />
        </div>
      )}

      {user && (
        <section style={{ marginTop: 32 }}>
          {loading && (
            <div style={{ opacity: 0.7 }}>Loading gear…</div>
          )}
          {error && (
            <div style={{ color: '#b00020', marginBottom: 16 }}>Error: {error}</div>
          )}
          {!loading && !error && gear.length === 0 && (
            <div style={{ marginTop: 12, padding: 24, border: '1px dashed #bbb', borderRadius: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-fibre)', marginTop: 0 }}>No gear yet</h2>
              <p style={{ maxWidth: 520 }}>
                Start by adding a guitar, pedal, amp or any accessory. Building your personal catalog enables future rig diagrams, preset linking, and maintenance tracking.
              </p>
              <Link
                href="/gear/add"
                style={{
                  background: '#111',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #222',
                  textDecoration: 'none',
                  display: 'inline-block',
                  marginTop: 8,
                }}
              >
                Add your first gear ➜
              </Link>
            </div>
          )}
          {!loading && !error && gear.length > 0 && (
            <div
              style={{
                display: 'grid',
                gap: 24,
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                marginTop: 8,
              }}
            >
              {gear
                .filter((g) => {
                  const matchesKind = kindFilter === 'all' || g.kind === (kindFilter as typeof g.kind);
                  if (!q.trim()) return matchesKind;
                  const hay = `${g.brand || ''} ${g.model || ''} ${g.notes || ''}`.toLowerCase();
                  const needle = q.toLowerCase();
                  return matchesKind && hay.includes(needle);
                })
                .map((g) => (
                <article
                  key={g.id || g.model || Math.random()}
                  style={{
                    border: '1px solid #e2e2e2',
                    borderRadius: 14,
                    background: '#fff',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '66%', background: '#f4f4f4' }}>
                    {g.imageUrl ? (
                      <Image
                        src={g.imageUrl}
                        alt={(g.brand || 'Gear') + ' ' + (g.model || '')}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, opacity: 0.5 }}>
                        No image
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h3 style={{ fontSize: 18, margin: 0, fontFamily: 'var(--font-fibre)' }}>
                      {(g.brand || 'Unknown') + (g.model ? ' ' + g.model : '')}
                    </h3>
                    <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>{g.kind}</div>
                    {g.notes && (
                      <p style={{ fontSize: 13, margin: '4px 0 0', lineHeight: 1.4, maxHeight: 56, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {g.notes}
                      </p>
                    )}
                    <Link
                      href={`/gear/${g.id}`}
                      style={{
                        marginTop: 8,
                        alignSelf: 'flex-start',
                        fontSize: 13,
                        padding: '6px 10px',
                        border: '1px solid #222',
                        borderRadius: 6,
                        textDecoration: 'none',
                        background: '#111',
                        color: '#fff',
                      }}
                    >
                      View details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
