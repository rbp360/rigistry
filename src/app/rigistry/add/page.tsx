// Clean rebuilt Add Gear page (duplicate/orphaned JSX removed)
'use client';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
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

// Reverb integration removed

export default function AddGearRigistryPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<GearDoc>>({ kind: 'guitar', room: rooms[0].key });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { addToast } = useToast();
  // Wikidata search integration
  type WikiItem = {
    id: string;
    label?: string;
    manufacturer?: string;
    manufacturerId?: string;
    year_first_made?: string;
    image?: string;
    wikidataUrl?: string;
  };
  const [wikiQuery, setWikiQuery] = useState('');
  // Track loading when selecting a suggestion (not currently surfaced in UI, reserved for possible spinner)
  // Removed to satisfy lint until we expose a visual indicator.
  // const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState<string | null>(null);
  const [wikiSuggestions, setWikiSuggestions] = useState<Array<{ id: string; label: string }>>([]);
  const [wikiSuggestLoading, setWikiSuggestLoading] = useState(false);
  const WIKI_API = process.env.NEXT_PUBLIC_WIKIDATA_API_URL || 'http://localhost:8081';

  // Full search happens implicitly when choosing a suggestion (removed manual button search)

  // Autocomplete suggestions (debounced onChange)
  // Fetch lightweight suggestions as the user types
  // Using the /suggest endpoint of the Python API
  // Debounce ~350ms to reduce calls
  useEffect(() => {
    const q = wikiQuery.trim();
    if (q.length < 2) {
      setWikiSuggestions([]);
      setWikiSuggestLoading(false);
      return;
    }
    setWikiSuggestLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${WIKI_API}/suggest?q=${encodeURIComponent(q)}&limit=10`, { headers: { accept: 'application/json' } });
        const data = await res.json();
        const list: Array<{ id: string; label: string }> = Array.isArray(data?.suggestions) ? data.suggestions : [];
        setWikiSuggestions(list.filter((s) => s && s.id && s.label));
      } catch {
        // Suggestions are best-effort; ignore errors silently
      } finally {
        setWikiSuggestLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [wikiQuery, WIKI_API]);

  // When a suggestion is chosen, load richer details and apply
  async function selectSuggestion(sug: { id: string; label: string }) {
    try {
      const res = await fetch(`${WIKI_API}/search?q=${encodeURIComponent(sug.label)}&limit=10`, { headers: { accept: 'application/json' } });
      const data = await res.json();
      const items: WikiItem[] = Array.isArray(data?.results) ? data.results : [];
      const exact = items.find((i) => i.id === sug.id) || items[0];
      if (exact) {
        applyWikiItem(exact);
        // keep the chosen label in the input
        setWikiQuery(exact.label || sug.label);
      } else {
        // fallback: apply minimal label
        applyWikiItem({ id: sug.id, label: sug.label });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lookup failed';
      setWikiError(msg);
    } finally {
      setWikiSuggestions([]);
    }
  }

  function applyWikiItem(item: WikiItem) {
    // Heuristic: brand <- manufacturer, model <- label with brand stripped prefix
    const brand = item.manufacturer || undefined;
    let model = item.label || '';
    if (brand && model.toLowerCase().startsWith((brand + ' ').toLowerCase())) {
      model = model.slice(brand.length).trim();
    }
    setForm((f) => ({
      ...f,
      brand: brand ?? f.brand,
      model: model || f.model,
      imageUrl: item.image || f.imageUrl,
      notes: [f.notes, item.wikidataUrl ? `Wikidata: ${item.wikidataUrl}` : undefined].filter(Boolean).join('\n'),
      // Optional: tag catalog source for provenance
      catalogSource: { source: 'wikidata', externalId: item.id, attribution: 'Wikidata contributors', licenseNote: 'CC0' },
    } as Partial<GearDoc>));
    addToast({ type: 'success', title: 'Prefilled from Wikidata', message: item.label || brand || 'Item' });
  }

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
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Search Wikidata</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={wikiQuery}
                onChange={(e) => setWikiQuery(e.target.value)}
                placeholder="e.g., Stratocaster, Les Paul, JCM800…"
                style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, minWidth: 260 }}
                aria-label="Search Wikidata"
              />
            </div>
          </label>
          {wikiSuggestLoading && <div style={{ fontSize: 12, opacity: 0.7 }}>Suggesting…</div>}
          {wikiSuggestions.length > 0 && (
            <ul role="listbox" aria-label="Wikidata suggestions" style={{ listStyle: 'none', paddingLeft: 0, margin: 0, display: 'grid', gap: 6 }}>
              {wikiSuggestions.map((s) => (
                <li key={s.id} role="option" aria-selected={false}>
                  <button type="button" onClick={() => void selectSuggestion(s)}
                    style={{ width: '100%', textAlign: 'left', background: '#fff', padding: '8px 10px', borderRadius: 8, border: '1px solid #eee', cursor: 'pointer' }}>
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {wikiError && <div role="status" style={{ color: 'crimson' }}>{wikiError}</div>}
        </div>
      </div>
      <p>Add an instrument or accessory to your collection. Select which room to place it in.</p>
      {!user && <p style={{ color: 'crimson' }}>You must sign in to add gear.</p>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Room</span>
          <select value={form.room as string} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}>
            {rooms.map(r => <option key={r.key} value={r.key}>{r.name}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Kind</span>
          <select value={form.kind as string} onChange={e => setForm(f => ({ ...f, kind: e.target.value as GearKind }))} style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}>
            {kinds.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
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
