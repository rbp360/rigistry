'use client';

import AuthButtons from '@/components/AuthButtons';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { useAuth } from '@/contexts/AuthContext';
import { getDb } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { InstrumentKind } from '@/types/schema';
import { INSTRUMENT_KIND_LABELS } from '@/types/schema';
import { listGearByOwner } from '@/lib/db';

type ProfileForm = {
  displayName: string;
  location: string;
  bio: string;
  primaryInstrument: InstrumentKind | '';
};

const instrumentKinds: InstrumentKind[] = [
  'guitar',
  'bass',
  'drums',
  'vocals',
  'piano',
  'decks-dj',
  'laptop-electronic',
  'synthesizer',
  'keyboard',
  'sampler',
  'percussion',
  'strings',
  'woodwind',
  'brass',
  'live-sound',
  'studio-sound',
];

interface UserProfileDoc {
  displayName?: string | null;
  location?: string | null;
  bio?: string | null;
  primaryInstrument?: InstrumentKind | null;
}

export default function AccountPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm>({ displayName: '', location: '', bio: '', primaryInstrument: '' });
  const [saving, setSaving] = useState(false);
  const [gearCount, setGearCount] = useState<number>(0);

  const db = useMemo(() => getDb(), []);

  // Load profile
  useEffect(() => {
    if (!user || !db) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as UserProfileDoc | undefined;
      setForm({
        displayName: (d?.displayName ?? user.displayName ?? '') as string,
        location: (d?.location ?? '') as string,
        bio: (d?.bio ?? '') as string,
  primaryInstrument: (d?.primaryInstrument ?? '') as InstrumentKind | '',
      });
    });
    return () => unsub();
  }, [user, db]);

  // Load owned gear count
  useEffect(() => {
    (async () => {
      if (!user) return;
      const list = await listGearByOwner(user.uid);
      setGearCount(list.length);
    })();
  }, [user]);

  async function saveProfile() {
    if (!user || !db) return;
    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(
        ref,
        {
          uid: user.uid,
          displayName: form.displayName || null,
          location: form.location || null,
          bio: form.bio || null,
          primaryInstrument: form.primaryInstrument || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-tungstern)' }}>Account</h1>
      <p>Sign in to create and manage your rigs.</p>
      <div style={{ marginTop: 12 }}>
        <AuthButtons />
      </div>

      {user && (
        <section style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName ?? 'avatar'} width={160} height={160} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 160, height: 160, borderRadius: '50%', background: '#e5e7eb' }} />
            )}
            <small style={{ opacity: 0.7 }}>
              Avatar managed via your Google Account
            </small>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              Owned gear: {gearCount}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveProfile();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span>Name</span>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Your display name"
                style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span>Location</span>
              <LocationAutocomplete
                value={form.location}
                onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                placeholder="City, Country"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span>Primary instrument</span>
              <select
                value={form.primaryInstrument}
                onChange={(e) => setForm((f) => ({ ...f, primaryInstrument: e.target.value as InstrumentKind }))}
                style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
              >
                <option value="">Select…</option>
                {instrumentKinds.map((k) => (
                  <option key={k} value={k}>
                    {INSTRUMENT_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span>Bio</span>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell others about your rig preferences, influences, and current projects."
                rows={5}
                style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, resize: 'vertical' }}
              />
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="submit"
                disabled={saving}
                style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
