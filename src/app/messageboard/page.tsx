"use client";
import { useEffect, useMemo, useState } from 'react';
import styles from './Messageboard.module.css';
import type { GearDoc } from '@/types/schema';
import { getDb } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, limit as fsLimit } from 'firebase/firestore';

export default function MessageBoardPage() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [kindDetail, setKindDetail] = useState('');
  const [color, setColor] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');
  const [scope, setScope] = useState<'worldwide' | 'local'>('worldwide');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GearDoc[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name?: string; location?: string }>>({});

  const explanation = useMemo(() => (
    "Search for other users who own the same gear. Use brand, model, options, and year range to narrow results (e.g., 'Fender Stratocaster 1970–1980' or 'Fender Stratocaster Floyd Rose'). Choose worldwide for broad results or local to focus near a location (coming soon)."
  ), []);

  async function runSearch() {
    setLoading(true);
    try {
      const db = getDb();
      if (!db) return;
      const gearRef = collection(db, 'gear');
      const clauses: any[] = [];
      if (brand.trim()) clauses.push(where('brand', '==', brand.trim()));
      if (kindDetail.trim()) clauses.push(where('kindDetail', '==', kindDetail.trim()));
      // Firestore cannot do contains; fetch a capped set then filter client-side
      const q = clauses.length ? query(gearRef, ...clauses, fsLimit(500)) : query(gearRef, fsLimit(500));
      const snaps = await getDocs(q);
      let list = snaps.docs.map(d => d.data() as GearDoc);
      // Client-side narrowing
      if (model.trim()) {
        const m = model.trim().toLowerCase();
        list = list.filter(g => (g.model || '').toLowerCase().includes(m));
      }
      if (color.trim()) {
        const c = color.trim().toLowerCase();
        list = list.filter(g => (g.color || '').toLowerCase().includes(c));
      }
      // Year range using specs.year if present
      const ys = yearStart ? parseInt(yearStart, 10) : undefined;
      const ye = yearEnd ? parseInt(yearEnd, 10) : undefined;
      if (ys || ye) {
        list = list.filter(g => {
          const year = (g.specs && typeof g.specs.year === 'number') ? (g.specs.year as number) : undefined;
          if (!year) return false; // if filtering by year, require a year
          return (ys ? year >= ys : true) && (ye ? year <= ye : true);
        });
      }
      // Local scope placeholder: would require joining a user profile with location
      if (scope === 'local' && location.trim()) {
        // TODO: join with user profiles by ownerId to match approximate location
        // For now, keep worldwide behavior; surface note in UI
      }
      setResults(list);
      // Fetch profiles for owner names/locations
      const ownerIds = Array.from(new Set(list.map(g => g.ownerId).filter(Boolean))) as string[];
      if (ownerIds.length) {
        try {
          const res = await fetch(`/api/profiles?ids=${encodeURIComponent(ownerIds.join(','))}`);
          const data = await res.json();
          setProfiles(data.profiles || {});
        } catch (e) {
          console.error('profiles fetch failed', e);
          setProfiles({});
        }
      } else {
        setProfiles({});
      }
    } catch (e) {
      console.error('Search failed', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial empty search to show something? keep empty
  }, []);

  return (
    <main className={styles.backdrop}>
      <div className={styles.content}>
        <h1 className={styles.title}>Messageboard</h1>
        <p className={styles.subtitle}>{explanation}</p>

        <div style={{
          marginTop: 16,
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          background: 'rgba(24,24,24,0.70)',
          padding: 16,
          borderRadius: 8,
        }}>
          <input placeholder="Brand (e.g., Fender)" value={brand} onChange={e => setBrand(e.target.value)} style={inputStyle} />
          <input placeholder="Model (e.g., Stratocaster)" value={model} onChange={e => setModel(e.target.value)} style={inputStyle} />
          <input placeholder="Kind detail / type (e.g., guitar)" value={kindDetail} onChange={e => setKindDetail(e.target.value)} style={inputStyle} />
          <input placeholder="Color / option (e.g., sunburst, Floyd Rose)" value={color} onChange={e => setColor(e.target.value)} style={inputStyle} />
          <input placeholder="Year start" value={yearStart} onChange={e => setYearStart(e.target.value)} style={inputStyle} />
          <input placeholder="Year end" value={yearEnd} onChange={e => setYearEnd(e.target.value)} style={inputStyle} />
          <select value={scope} onChange={e => setScope(e.target.value as any)} style={inputStyle}>
            <option value="worldwide">Worldwide</option>
            <option value="local">Local (by location)</option>
          </select>
          <input placeholder="Location (city, region)" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
          <button type="button" onClick={runSearch} disabled={loading} style={buttonStyle}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Results */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {results.map((g) => {
            const brandLogo = g.brand ? `/api/brand-logo?brand=${encodeURIComponent(g.brand)}` : null;
            const src = g.imageUrl || brandLogo || '/branding/logo1.png';
            const p = (g.ownerId && profiles[g.ownerId]) || {};
            const ownerDisplay = g.ownerId ? `${p.name || 'Unknown user'} — ${p.location || 'Unknown location'}` : 'Unknown user';
            return (
              <div key={`${g.id}-${g.ownerId}`} style={{ border: '1px solid #333', borderRadius: 8, padding: 12, background: '#1f1f1f' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={g.brand || 'Gear'} width={160} height={160} style={{ borderRadius: 6, objectFit: 'contain', display: 'block', background: '#111' }} />
                <div style={{ marginTop: 8 }}>
                  <strong>{[g.brand, g.model].filter(Boolean).join(' ') || 'Gear'}</strong>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{ownerDisplay}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{g.kindDetail || g.kind}</div>
                </div>
                <button type="button" disabled title="Contact coming soon" style={{
                  marginTop: 10,
                  background: '#444',
                  color: '#fff',
                  border: '1px solid #555',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'not-allowed'
                }}>Contact Owner</button>
              </div>
            );
          })}
          {(!loading && results.length === 0) && (
            <div style={{ opacity: 0.7, gridColumn: '1/-1' }}>No results yet. Try broadening your search or removing filters.</div>
          )}
        </div>
        {scope === 'local' && !location.trim() && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>Tip: enter a location to enable local scoping (profile join coming soon).</div>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #444',
  background: '#222',
  color: '#ddd',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 6,
  border: '1px solid #555',
  background: '#2d6cdf',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};
