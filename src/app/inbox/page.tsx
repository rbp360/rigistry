"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  limit as fsLimit,
  Timestamp,
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface MessageDoc {
  id: string;
  toUserId: string;
  fromUserId: string;
  body: string;
  gearId?: string | null;
  gearLabel?: string | null;
  createdAt?: Timestamp | null;
  read?: boolean;
}

export default function InboxPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, { name?: string; location?: string }>>({});

  const title = useMemo(() => 'Inbox', []);

  useEffect(() => {
    const db = getDb();
    if (!db || !user) return;
    // loading starts as true by default; we'll set it false after first snapshot
    const q = query(
      collection(db, 'messages'),
      where('toUserId', '==', user.uid),
      fsLimit(100)
    );
    const unsub = onSnapshot(q, async (snap) => {
      const list: MessageDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MessageDoc, 'id'>) }));
      // Client-side sort newest first to avoid composite index requirement
      list.sort((a, b) => {
        const am = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bm = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bm - am;
      });
      setMessages(list);
      // fetch sender profiles
      const fromIds = Array.from(new Set(list.map(m => m.fromUserId).filter(Boolean))) as string[];
      if (fromIds.length) {
        try {
          const res = await fetch(`/api/profiles?ids=${encodeURIComponent(fromIds.join(','))}`);
          const data = await res.json();
          setProfiles(data.profiles || {});
        } catch (e) {
          console.error('profiles fetch failed', e);
          setProfiles({});
        }
      } else {
        setProfiles({});
      }
      setLoading(false);
    }, (err) => {
      console.error('inbox subscribe failed', err);
      setMessages([]);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  async function markRead(id: string, read: boolean) {
    try {
      const db = getDb();
      if (!db) return;
      await updateDoc(doc(db, 'messages', id), { read });
    } catch (e) {
      console.error('failed to update read state', e);
    }
  }

  if (!user) {
    return (
      <main style={{ minHeight: '100vh', background: '#0b0b0b', color: '#e5e7eb' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Inbox</h1>
          <p style={{ opacity: 0.7 }}>Please sign in to view your inbox.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0b0b0b', color: '#e5e7eb' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{title}</h1>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>Messages sent to you. Newest first.</p>

        {loading && (
          <div style={{ opacity: 0.7 }}>Loading…</div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ opacity: 0.7 }}>No messages yet.</div>
        )}

        <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
          {messages.map((m) => {
            const sender = (m.fromUserId && profiles[m.fromUserId]) || {};
            const ts = m.createdAt?.toDate ? m.createdAt.toDate() : undefined;
            return (
              <div key={m.id} style={{
                border: '1px solid #262626',
                background: m.read ? '#121212' : '#1a1a1a',
                borderRadius: 10,
                padding: 14
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <div style={{ fontWeight: 700 }}>
                    From: {sender.name || 'Unknown user'}{sender.location ? ` — ${sender.location}` : ''}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {ts ? ts.toLocaleString() : '—'}
                  </div>
                </div>
                {m.gearLabel && (
                  <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                    Regarding: {m.gearId ? (
                      <Link href={`/gear/${m.gearId}`}>{m.gearLabel}</Link>
                    ) : (
                      <span>{m.gearLabel}</span>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{m.body}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {!m.read ? (
                    <button type="button" onClick={() => markRead(m.id, true)} style={btnPrimary}>Mark as read</button>
                  ) : (
                    <button type="button" onClick={() => markRead(m.id, false)} style={btnSecondary}>Mark as unread</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

const btnBase: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid transparent',
  cursor: 'pointer',
  fontWeight: 600,
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: '#16a34a',
  borderColor: '#22c55e',
  color: '#fff'
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: '#0f172a',
  borderColor: '#334155',
  color: '#e5e7eb'
};
