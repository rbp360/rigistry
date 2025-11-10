// Clean rebuilt Add Gear page (duplicate/orphaned JSX removed)
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
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

interface ReverbListing {
  id?: string;
  listing_id?: string;
  title?: string;
  price?: { amount?: string };
  photos?: Array<{ _links?: { large?: { href?: string } } }>;
  _links?: { web?: { href?: string } };
}

export default function AddGearRigistryPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<GearDoc>>({ kind: 'guitar', room: rooms[0].key });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { addToast } = useToast();
  const [searchSource, setSearchSource] = useState<'none' | 'reverb'>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [reverbResults, setReverbResults] = useState<ReverbListing[] | null>(null);
  const [reverbLoading, setReverbLoading] = useState(false);
  const [reverbError, setReverbError] = useState<string | null>(null);

  useEffect(() => {
    const shouldSearch = searchSource === 'reverb' && searchQuery.trim().length > 2;
    if (!shouldSearch) {
      setReverbResults(null);
      setReverbError(null);
      return;
    }
    let cancelled = false;
    setReverbLoading(true);
    setReverbError(null);
    fetch(`/api/reverb/search?q=${encodeURIComponent(searchQuery)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) {
          setReverbError(data.error);
          setReverbResults(null);
        } else {
          const list: ReverbListing[] = Array.isArray(data.listings)
            ? data.listings
            : (data._embedded?.listings || []);
          setReverbResults(list);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setReverbError('Failed to fetch from Reverb');
        setReverbResults(null);
      })
      .finally(() => { if (!cancelled) setReverbLoading(false); });
    return () => { cancelled = true; };
  }, [searchSource, searchQuery]);

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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>Search from</span>
            <select value={searchSource} onChange={e => setSearchSource(e.target.value as 'none' | 'reverb')} style={{ padding: '6px 10px', borderRadius: 8 }}>
              <option value="none">Manual entry</option>
              <option value="reverb">Reverb.com</option>
            </select>
          </label>
          {searchSource === 'reverb' && (
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Reverb.com for gear..."
              style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, minWidth: 220 }}
            />
          )}
        </div>
        {searchSource === 'reverb' && searchQuery.trim().length > 2 && (
          <div style={{ marginTop: 10 }}>
            {reverbLoading && <div>Searching Reverb…</div>}
            {reverbError && <div style={{ color: 'crimson' }}>{reverbError}</div>}
            {reverbResults && (
              <div style={{ marginTop: 8 }}>
                <strong>Results:</strong>
                <ul style={{ paddingLeft: 18 }}>
                  {reverbResults.length === 0 && <li>No results found.</li>}
                  {reverbResults.map(item => (
                    <li key={item.id || item.listing_id} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {item.photos?.[0]?._links?.large?.href && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.photos[0]._links.large.href} alt={item.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.title}</div>
                          <div style={{ color: '#555' }}>{item.price?.amount ? `$${item.price.amount}` : ''}</div>
                          {item._links?.web?.href && (
                            <a href={item._links.web.href} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3' }}>View on Reverb</a>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
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
