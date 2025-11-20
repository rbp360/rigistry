// Clean rebuilt Add Gear page (duplicate/orphaned JSX removed)
'use client';
export const dynamic = 'force-dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import type { GearDoc, GearKind, GearCategory, RoomKey } from '@/types/schema';
import { GEAR_ADD_CATEGORIES, ROOM_SUGGESTIONS, ROOM_KIND_PRIORITIES, getOrderedCategoriesForRoom } from '@/types/schema';
import { useSearchParams } from 'next/navigation';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import { createGearItem } from '@/lib/db';
import { fetchStockImageForBrandModel } from '@/lib/reverb';
import type { CatalogSourceMeta } from '@/types/schema';
import KindDetailAutocomplete from '@/components/KindDetailAutocomplete';
import { useToast } from '@/contexts/ToastContext';
import BrandAutocomplete from '@/components/BrandAutocomplete';

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

function InnerAddPage() {
  const { user } = useAuth();
  const search = useSearchParams();
  const qpRoom = (search?.get('room') ?? '') as RoomKey | '';
  const qpKind = (search?.get('kind') ?? '') as GearCategory | '';
  const router = useRouter();
  const backHref = qpRoom ? `/rigistry/${qpRoom}` : '/rigistry';
  const initialRoom: string | undefined = qpRoom && rooms.some(r => r.key === qpRoom) ? qpRoom : undefined;
  const initialKind: GearCategory | undefined = qpKind && GEAR_ADD_CATEGORIES.some(c => c.value === qpKind)
    ? qpKind
    : (initialRoom ? (ROOM_KIND_PRIORITIES[initialRoom as RoomKey]?.[0]) : 'guitar');
  const [form, setForm] = useState<Partial<GearDoc>>({
    kind: initialKind,
    room: initialRoom ?? (ROOM_SUGGESTIONS[initialKind as GearCategory] ?? rooms[0].key),
  });
  const [saving, setSaving] = useState(false);
  const [fetchingImage, setFetchingImage] = useState(false);
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
        kindDetail: form.kindDetail?.trim() || undefined,
        brand: form.brand?.trim() || undefined,
        model: form.model?.trim() || undefined,
        serialNumber: form.serialNumber?.trim() || undefined,
        color: form.color?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
        room: form.room,
      });
      if (saved) {
        // Navigate directly to the item's home page instead of showing a success message
        router.replace(`/gear/${saved.id}`);
        return;
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
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push(backHref);
            }
          }}
          style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>
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
          <span>Kind detail</span>
          <KindDetailAutocomplete
            value={form.kindDetail ?? ''}
            kind={form.kind as GearCategory}
            room={form.room as RoomKey}
            onChange={v => setForm(f => ({ ...f, kindDetail: v }))}
            placeholder="Start typing (auto-suggest)…"
          />
          <small style={{ opacity: 0.7 }}>Suggestions ranked by matching category and room priority.</small>
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
          <BrandAutocomplete
            value={form.brand ?? ''}
            category={form.kind as string}
            onChange={(v) => setForm(f => ({ ...f, brand: v }))}
            placeholder="Start typing (autocomplete)…"
          />
          <small style={{ opacity: 0.6 }}>Searches curated manufacturer lists (category-specific when available).</small>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Model</span>
          <input type="text" value={form.model ?? ''} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Stratocaster, Les Paul…" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Serial number</span>
          <input type="text" value={form.serialNumber ?? ''} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="Optional (helps for insurance)" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }} />
        </label>
        {(form.kindDetail || form.model) && (
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Color / finish</span>
            <input
              type="text"
              value={form.color ?? ''}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              placeholder="Sunburst, black, cherry red…"
              style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
            />
          </label>
        )}
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
          {!form.imageUrl && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={fetchingImage || !form.brand}
                onClick={async () => {
                  if (!form.brand) return;
                  setFetchingImage(true);
                  let usedFallback = false;
                  if (form.model) {
                    const result = await fetchStockImageForBrandModel(form.brand, form.model, form.color);
                    if (result.url) {
                      const src: CatalogSourceMeta = {
                        source: 'reverb',
                        attribution: result.attribution ?? 'Stock image from Reverb.com',
                        licenseNote: 'Display-only stock image; not for redistribution.',
                      };
                      setForm(f => ({ ...f, imageUrl: result.url ?? undefined, catalogSource: src }));
                    } else {
                      usedFallback = true;
                    }
                  } else {
                    usedFallback = true;
                  }
                  if (usedFallback && form.brand) {
                    const logoUrl = `/api/brand-logo?brand=${encodeURIComponent(form.brand)}`;
                    const src: CatalogSourceMeta = {
                      source: 'guitar-list',
                      attribution: 'Logo from guitar-list.com',
                      licenseNote: 'Logo used with permission via guitar-list.com; display-only.',
                    };
                    setForm(f => ({ ...f, imageUrl: logoUrl, catalogSource: src }));
                  }
                  setFetchingImage(false);
                }}
                style={{ background: '#222', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, border: '1px solid #333', cursor: 'pointer' }}
              >
                {fetchingImage ? 'Fetching image…' : 'Fetch Stock Image'}
              </button>
              <small style={{ alignSelf: 'center', opacity: 0.6 }}>Uses Reverb (if model provided); otherwise falls back to guitar-list brand logo.</small>
            </div>
          )}
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="preview" style={{ maxWidth: 320, borderRadius: 8 }} />
          )}
          {form.catalogSource?.source === 'reverb' && (
            <div style={{ fontSize: 11, opacity: 0.7 }}>Stock image from Reverb.com</div>
          )}
          {form.catalogSource?.source === 'guitar-list' && (
            <div style={{ fontSize: 11, opacity: 0.7 }}>Logo from guitar-list.com</div>
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

export default function AddGearRigistryPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}><p>Loading add form…</p></main>}>
      <InnerAddPage />
    </Suspense>
  );
}
