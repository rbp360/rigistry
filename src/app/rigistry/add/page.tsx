// Add Gear page for Rigistry, with room selection
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import type { GearDoc, GearKind } from '@/types/schema';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import { createGearItem } from '@/lib/db';
import { useToast } from '@/contexts/ToastContext';

const kinds: GearKind[] = ['guitar','bass','amp','cab','pedal','keyboard','accessory','interface','microphone'];
const rooms = [
  { name: 'Guitar/Amp room', key: 'guitar-amp' },
  { name: 'Control room', key: 'control' },
  { name: 'Drum room', key: 'drum' },
  { name: 'Vocal booth', key: 'vocal' },
  { name: 'Synthzone', key: 'synthzone' },
  { name: 'Live', key: 'live' },
];

export default function AddGearRigistryPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<GearDoc>>({ kind: 'guitar', room: rooms[0].key });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { addToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setMessage('Please sign in to add gear');
      return;
    }
    if (!form.kind || !form.room) {
      setMessage('Please select a gear kind and room');
      return;
    }
    setSaving(true);
    try {
      const saved = await createGearItem({
        ownerId: user.uid,
        kind: form.kind as GearKind,
        brand: form.brand?.trim() || undefined,
        model: form.model?.trim() || undefined,
        serialNumber: form.serialNumber?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
        room: form.room,
      });
      if (saved) {
        setMessage('Gear saved!');
        addToast({ type: 'success', title: 'Gear Added', message: `${saved.brand || 'Gear'} ${saved.model || ''} created.` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save gear';
      setMessage(msg);
      addToast({ type: 'error', title: 'Save Failed', message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-tungstern)' }}>Add Gear</h1>
      <p>Add an instrument or accessory to your collection. Select which room to place it in.</p>
      {!user && (
        <p style={{ color: 'crimson' }}>You must sign in to add gear.</p>
      )}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Room</span>
          <select
            value={form.room as string}
            onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          >
            {rooms.map((r) => (
              <option key={r.key} value={r.key}>{r.name}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Kind</span>
          <select
            value={form.kind as string}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as GearKind }))}
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          >
            {kinds.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Brand</span>
          <input
            type="text"
            value={form.brand ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            placeholder="Fender, Gibson, Boss…"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Model</span>
          <input
            type="text"
            value={form.model ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            placeholder="Stratocaster, Les Paul…"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Serial number</span>
          <input
            type="text"
            value={form.serialNumber ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
            placeholder="Optional (helps for insurance)"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Notes</span>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={4}
            placeholder="Strings, pickups, condition, setup details…"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, resize: 'vertical' }}
          />
        </label>
        <div style={{ display: 'grid', gap: 8 }}>
          <span>Photo (Cloudinary)</span>
          <CloudinaryUploader
            onUploaded={(r) => {
              setForm((f) => ({ ...f, imageUrl: r.secure_url || r.url || '' }));
              addToast({ type: 'success', message: 'Image uploaded', title: 'Upload Complete' });
            }}
          />
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="preview" style={{ maxWidth: 320, borderRadius: 8 }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={!user || saving} style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save gear'}
          </button>
          {message && <span>{message}</span>}
        </div>
      </form>
    </main>
  );
}
