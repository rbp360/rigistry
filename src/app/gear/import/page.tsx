'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createGearItem, listGearByOwner } from '@/lib/db';
import { fetchRawCatalog, normalizeBatch, filterDuplicates, type IngestionSource } from '@/lib/ingestion';
import type { GearDoc } from '@/types/schema';
import { useEffect, useMemo, useState } from 'react';

export default function ImportGearPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [source, setSource] = useState<IngestionSource>('equipboard');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<GearDoc[]>([]);
  const [results, setResults] = useState<ReturnType<typeof normalizeBatch>>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  useEffect(() => {
    (async () => {
      if (!user) return;
      const mine = await listGearByOwner(user.uid);
      setExisting(mine);
    })();
  }, [user]);

  const filtered = useMemo(() => filterDuplicates(existing, results), [existing, results]);

  async function search() {
    if (!user || !query.trim()) return;
    setBusy(true);
    try {
      const raw = await fetchRawCatalog(source, query.trim());
      const normalized = normalizeBatch(raw);
      setResults(normalized);
      setSelected({});
      if (normalized.length === 0) addToast({ type: 'info', message: 'No results', title: 'Search' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      addToast({ type: 'error', title: 'Search failed', message: msg });
    } finally {
      setBusy(false);
    }
  }

  async function importSelected() {
    if (!user) return;
    const picks = filtered
      .map((item, idx) => ({ item, idx }))
      .filter(({ idx }) => selected[idx])
      .map(({ item }) => item);
    if (picks.length === 0) {
      addToast({ type: 'info', title: 'Nothing selected', message: 'Choose items to import.' });
      return;
    }
    setBusy(true);
    let ok = 0;
    for (const p of picks) {
      try {
        await createGearItem({
          ownerId: user.uid,
          kind: p.kind,
          brand: p.brand,
          model: p.model,
          imageUrl: p.imageUrl,
          notes: p.notes,
          catalogSource: p.catalogSource,
        });
        ok += 1;
      } catch {
        // continue on failure silently
      }
    }
    addToast({ type: 'success', title: 'Import complete', message: `Imported ${ok}/${picks.length} items.` });
    setBusy(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-tungstern)' }}>Import Gear</h1>
      {!user && <p style={{ color: 'crimson' }}>Sign in to import gear into your catalog.</p>}

      {user && (
        <div style={{ display: 'grid', gap: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={source} onChange={(e) => setSource(e.target.value as IngestionSource)} style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}>
              <option value="equipboard">Equipboard</option>
              <option value="reverb">Reverb</option>
              <option value="effectsdb">EffectsDB</option>
            </select>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand/model…"
              style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, minWidth: 280 }}
            />
            <button onClick={() => void search()} disabled={busy || !query.trim()} style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}>
              {busy ? 'Searching…' : 'Search'}
            </button>
          </div>

          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Showing {filtered.length} unique results (duplicates you already own are hidden).
          </div>

          {filtered.length > 0 && (
            <div style={{ display: 'grid', gap: 16 }}>
              {filtered.map((r, idx) => (
                <label key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'center', gap: 12, border: '1px solid #eee', borderRadius: 10, padding: '10px 12px', background: '#fff' }}>
                  <input type="checkbox" checked={!!selected[idx]} onChange={(e) => setSelected((s) => ({ ...s, [idx]: e.target.checked }))} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.brand} {r.model}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{r.kind}</div>
                    {r.notes && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{r.notes}</div>}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7, justifySelf: 'end' }}>{r.catalogSource?.source}</div>
                </label>
              ))}
              <div>
                <button onClick={() => void importSelected()} disabled={busy} style={{ background: '#111', color: '#fff', padding: '10px 16px', borderRadius: 10, border: '1px solid #222', cursor: 'pointer' }}>
                  {busy ? 'Importing…' : 'Import selected'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
