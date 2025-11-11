// Clean rebuilt Add Gear page (duplicate/orphaned JSX removed)
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import type { GearDoc, GearKind, GearCategory, RoomKey } from '@/types/schema';
import { GEAR_ADD_CATEGORIES, ROOM_SUGGESTIONS, ROOM_KIND_PRIORITIES, getOrderedCategoriesForRoom } from '@/types/schema';
import { useSearchParams } from 'next/navigation';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import { createGearItem } from '@/lib/db';
import { useToast } from '@/contexts/ToastContext';

// Updated to use 20 unified product categories for gear kind selection (ordered per room via helper)
const rooms = [
  { name: 'Guitar/Amp room', key: 'guitar-amp' },
  { name: 'Control room', key: 'control' },
  { name: 'Drum room', key: 'drum' },
  { name: 'Vocal booth', key: 'vocal' },
  { name: 'Synthzone', key: 'synthzone' },
  { name: 'Stage', key: 'stage' },
  { name: 'DJ booth', key: 'dj-booth' },
  { name: 'Orchestral Pit', key: 'orchestral-pit' },
  { name: 'Live', key: 'live' },
];

// Reverb integration removed

export default function AddGearRigistryPage() {
  const { user } = useAuth();
  const search = useSearchParams();
  const qpRoom = (search?.get('room') ?? '') as RoomKey | '';
  const qpKind = (search?.get('kind') ?? '') as GearCategory | '';
  const initialRoom: string | undefined = qpRoom && rooms.some(r => r.key === qpRoom) ? qpRoom : undefined;
  const initialKind: GearCategory | undefined = qpKind && GEAR_ADD_CATEGORIES.some(c => c.value === qpKind)
    ? qpKind
    : (initialRoom ? (ROOM_KIND_PRIORITIES[initialRoom as RoomKey]?.[0]) : 'guitar');
  const [form, setForm] = useState<Partial<GearDoc>>({
    kind: initialKind,
    room: initialRoom ?? (ROOM_SUGGESTIONS[initialKind as GearCategory] ?? rooms[0].key),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { addToast } = useToast();
  // Third-party search removed; manual entry only

  // Previously supported Reverb.com search removed

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
      <div style={{ marginBottom: 18 }}>
        <div style={{ padding: '10px 12px', border: '1px solid #eee', borderRadius: 10, background: '#fff' }}>
          Third-party search is currently disabled. Please enter gear details manually below.
        </div>
      </div>
      <p>Add an instrument or accessory to your collection. Select which room to place it in.</p>
      {!user && <p style={{ color: 'crimson' }}>You must sign in to add gear.</p>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Kind</span>
          <select
            value={(form.kind as string) || 'guitar'}
            onChange={e => setForm(f => ({
              ...f,
              kind: e.target.value as GearCategory,
              room: ROOM_SUGGESTIONS[e.target.value as GearCategory] ?? f.room ?? ''
            }))}
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          >
            {getOrderedCategoriesForRoom(form.room as RoomKey | undefined).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Suggested room</span>
          <select
            value={(form.room as string) || ''}
            onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          >
            <option value="">Select a room…</option>
            {rooms.map(r => <option key={r.key} value={r.key}>{r.name}</option>)}
          </select>
          <small style={{ opacity: 0.8 }}>
            {form.kind && ROOM_SUGGESTIONS[form.kind as GearCategory]
              ? `Default suggestion based on kind: ${rooms.find(r => r.key === ROOM_SUGGESTIONS[form.kind as GearCategory])?.name}`
              : 'No default for this kind; please choose.'}
          </small>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Brand</span>
          <input type="text" value={form.brand ?? ''} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Fender, Gibson, Boss…" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Model</span>
          <input type="text" value={form.model ?? ''} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Stratocaster, Les Paul…" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Serial number</span>
          <input type="text" value={form.serialNumber ?? ''} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="Optional (helps for insurance)" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Notes</span>
          <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4} placeholder="Strings, pickups, condition, setup details…" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, resize: 'vertical' }} />
        </label>
        <div style={{ display: 'grid', gap: 8 }}>
          <span>Photo (Cloudinary)</span>
          <CloudinaryUploader onUploaded={r => {
            setForm(f => ({ ...f, imageUrl: r.secure_url || r.url || '' }));
            addToast({ type: 'success', title: 'Upload Complete', message: 'Image uploaded' });
          }} />
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
