"use client";
import { useEffect, useMemo, useState } from 'react';
import styles from './Connect.module.css';
import rigistryStyles from '../rigistry/Rigistry.module.css';
import type { GearDoc } from '@/types/schema';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, where, limit as fsLimit, type QueryConstraint, addDoc, serverTimestamp } from 'firebase/firestore';
import BrandAutocomplete from '@/components/BrandAutocomplete';
import KindDetailAutocomplete from '@/components/KindDetailAutocomplete';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { useAuth } from '@/contexts/AuthContext';

export default function ConnectPage() {
  const { user } = useAuth();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [kindDetail, setKindDetail] = useState('');
  const [color, setColor] = useState('');
  // Single year range input supports formats:
  // 1970-1980 (inclusive range), 1970+ or >=1970 (min only), <=1980 or -1980 (max only), single year (exact)
  const [yearRange, setYearRange] = useState('');
  const [scope, setScope] = useState<'worldwide' | 'local'>('worldwide');
  // New scope: national vs worldwide
  const [scope2, setScope2] = useState<'worldwide' | 'national' | 'nearby'>('worldwide');
  const [radiusKm, setRadiusKm] = useState('100');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GearDoc[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name?: string; location?: string; countryCode?: string; latitude?: number; longitude?: number }>>({});
  const [distanceByOwner, setDistanceByOwner] = useState<Record<string, number>>({});
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeTarget, setComposeTarget] = useState<{ ownerId: string; gearId?: string; gearLabel: string } | null>(null);

  const explanation = useMemo(() => (
    "Search for other users who own the same gear. Use brand, model, options, and year range to narrow results (e.g., 'Fender Stratocaster 1970–1980' or 'Fender Stratocaster Floyd Rose'). Choose worldwide for broad results or local to focus near a location (coming soon)."
  ), []);

  function parseYearRange(str: string): { min?: number; max?: number } {
    const s = str.trim();
    if (!s) return {};
    // 1970-1980
    const dashMatch = /^([0-9]{4})\s*[-–]\s*([0-9]{4})$/.exec(s);
    if (dashMatch) {
      const a = parseInt(dashMatch[1], 10);
      const b = parseInt(dashMatch[2], 10);
      if (a && b) return { min: Math.min(a, b), max: Math.max(a, b) };
    }
    // 1970+ or >=1970
    const minMatch = /^(?:>=)?([0-9]{4})\+?$/.exec(s);
    if (minMatch) {
      const y = parseInt(minMatch[1], 10);
      if (y) return { min: y };
    }
    // <=1980 or -1980
    const maxMatch = /^(?:<=|-)?([0-9]{4})$/.exec(s);
    if (maxMatch) {
      const y = parseInt(maxMatch[1], 10);
      if (y) return { max: y };
    }
    // Single year exact
    const singleMatch = /^([0-9]{4})$/.exec(s);
    if (singleMatch) {
      const y = parseInt(singleMatch[1], 10);
      return { min: y, max: y };
    }
    return {};
  }

  async function runSearch() {
    setLoading(true);
    try {
      const db = getDb();
      if (!db) return;
      const gearRef = collection(db, 'gear');
      const clauses: QueryConstraint[] = [];
      if (brand.trim()) clauses.push(where('brand', '==', brand.trim()));
      if (kindDetail.trim()) clauses.push(where('kindDetail', '==', kindDetail.trim()));
      // Firestore cannot do contains; fetch a capped set then filter client-side
      const q = clauses.length ? query(gearRef, ...clauses, fsLimit(500)) : query(gearRef, fsLimit(500));
      const snaps = await getDocs(q);
      let list: GearDoc[] = snaps.docs.map(d => ({ id: d.id, ...(d.data() as GearDoc) }));
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
      const { min: ys, max: ye } = parseYearRange(yearRange);
      if (typeof ys === 'number' || typeof ye === 'number') {
        list = list.filter(g => {
          const year = (g.specs && typeof g.specs.year === 'number') ? (g.specs.year as number) : undefined;
          if (!year) return false; // require a year if filtering
          if (typeof ys === 'number' && year < ys) return false;
          if (typeof ye === 'number' && year > ye) return false;
          return true;
        });
      }
      // Geographical filtering
      if (user && (scope2 === 'national' || scope2 === 'nearby')) {
        try {
          const resMe = await fetch(`/api/profiles?ids=${encodeURIComponent(user.uid)}`);
          const meData = await resMe.json();
          const my = (meData.profiles && meData.profiles[user.uid]) || {};
          const ownerIds = Array.from(new Set(list.map(g => g.ownerId).filter(Boolean))) as string[];
          let profs = profiles;
          if (!ownerIds.every(id => profs[id])) {
            try {
              const res = await fetch(`/api/profiles?ids=${encodeURIComponent(ownerIds.join(','))}`);
              const data = await res.json();
              profs = data.profiles || {};
              setProfiles(profs);
            } catch {}
          }
          // National filter
          if (scope2 === 'national' && my.countryCode) {
            list = list.filter(g => {
              const p = g.ownerId ? profs[g.ownerId] : undefined;
              return (p && p.countryCode) ? (p.countryCode === my.countryCode) : false;
            });
          }
          // Nearby filter (distance within radius)
          if (scope2 === 'nearby' && typeof my.latitude === 'number' && typeof my.longitude === 'number') {
            const rKm = parseFloat(radiusKm) || 0;
            const dMap: Record<string, number> = {};
            function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
              const toRad = (deg: number) => deg * Math.PI / 180;
              const R = 6371; // km
              const dLat = toRad(lat2 - lat1);
              const dLon = toRad(lon2 - lon1);
              const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              return R * c;
            }
            list = list.filter(g => {
              const p = g.ownerId ? profs[g.ownerId] : undefined;
              if (!p || typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return false;
              const dist = haversine(my.latitude, my.longitude, p.latitude, p.longitude);
              dMap[g.ownerId as string] = dist;
              return dist <= rKm;
            });
            setDistanceByOwner(dMap);
          } else if (scope2 !== 'nearby') {
            setDistanceByOwner({});
          }
        } catch {
          if (scope2 !== 'nearby') setDistanceByOwner({});
        }
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

  function openCompose(g: GearDoc) {
    if (!g.ownerId) {
      alert('Owner information unavailable for this item.');
      return;
    }
    const gearLabel = [g.brand, g.model].filter(Boolean).join(' ') || 'Gear';
    setComposeTarget({ ownerId: g.ownerId as string, gearId: g.id, gearLabel });
    setComposeText('');
    setComposeOpen(true);
  }

  async function sendMessage() {
    if (!composeTarget) return;
    if (!user) {
      alert('Please sign in to send a message.');
      return;
    }
    const message = composeText.trim();
    if (!message) return;
    try {
      setComposeSending(true);
      const db = getDb();
      if (!db) throw new Error('Database not initialized');
      await addDoc(collection(db, 'messages'), {
        toUserId: composeTarget.ownerId,
        fromUserId: user.uid,
        body: message,
        gearId: composeTarget.gearId || null,
        gearLabel: composeTarget.gearLabel,
        createdAt: serverTimestamp(),
        read: false,
      });
      setComposeOpen(false);
      setComposeText('');
      setComposeTarget(null);
      alert('Message sent.');
    } catch (e) {
      console.error('Failed to send message', e);
      alert('Could not send your message. Please try again.');
    } finally {
      setComposeSending(false);
    }
  }

  return (
    <main className={rigistryStyles.rigistryMain} style={{ color: '#fff' }}>
      <div className={styles.content}>
        <h1 className={styles.title}>Connect</h1>
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
          <BrandAutocomplete value={brand} onChange={setBrand} placeholder="Brand (e.g., Paul Reed…)" />
          <input placeholder="Model (e.g., Stratocaster)" value={model} onChange={e => setModel(e.target.value)} style={inputStyle} />
          <KindDetailAutocomplete value={kindDetail} onChange={setKindDetail} placeholder="Kind detail / type (e.g., guitar)" />
          <input placeholder="Color / option (e.g., sunburst, Floyd Rose)" value={color} onChange={e => setColor(e.target.value)} style={inputStyle} />
          <input
            placeholder="Year / range (e.g. 1970-1980, 1970+, <=1980)"
            value={yearRange}
            onChange={e => setYearRange(e.target.value)}
            style={inputStyle}
          />
          <select value={scope2} onChange={e => setScope2(e.target.value as 'worldwide' | 'national' | 'nearby')} style={inputStyle}>
            <option value="worldwide">Worldwide</option>
            <option value="national">National (same country)</option>
            <option value="nearby">Nearby (radius km)</option>
          </select>
          {scope2 === 'nearby' && (
            <input
              placeholder="Radius km"
              value={radiusKm}
              onChange={e => setRadiusKm(e.target.value)}
              style={inputStyle}
            />
          )}
          <LocationAutocomplete value={location} onChange={setLocation} placeholder="Location (city, region)" />
          <button type="button" onClick={runSearch} disabled={loading} style={buttonStyle}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Results */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {results.map((g, idx) => {
            const brandLogo = g.brand ? `/api/brand-logo?brand=${encodeURIComponent(g.brand)}` : null;
            const src = g.imageUrl || brandLogo || '/branding/logo1.png';
            const p = (g.ownerId && profiles[g.ownerId]) || {};
            const ownerDisplay = g.ownerId ? `${p.name || 'Unknown user'} — ${p.location || 'Unknown location'}` : 'Unknown user';
            const dist = scope2 === 'nearby' && g.ownerId ? distanceByOwner[g.ownerId] : undefined;
            return (
              <div key={g.id || `${g.ownerId}-${idx}`}
                   style={{ border: '1px solid #333', borderRadius: 8, padding: 12, background: '#1f1f1f' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={g.brand || 'Gear'} width={160} height={160} style={{ borderRadius: 6, objectFit: 'contain', display: 'block', background: '#111' }} />
                <div style={{ marginTop: 8 }}>
                  <strong>{[g.brand, g.model].filter(Boolean).join(' ') || 'Gear'}</strong>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{ownerDisplay}</div>
                  {p.countryCode && (
                    <div style={{ fontSize: 11, opacity: 0.55 }}>Country: {p.countryCode.toUpperCase()} {typeof dist === 'number' ? `• ${dist.toFixed(1)} km` : ''}</div>
                  )}
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{g.kindDetail || g.kind}</div>
                </div>
                <button type="button" onClick={() => openCompose(g)} style={{
                  marginTop: 10,
                  background: '#2563eb',
                  color: '#fff',
                  border: '1px solid #3b82f6',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600
                }}>Contact Owner</button>
              </div>
            );
          })}
          {(!loading && results.length === 0) && (
            <div style={{ opacity: 0.7, gridColumn: '1/-1' }}>No results yet. Try broadening your search or removing filters.</div>
          )}
        </div>
        {scope2 === 'national' && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>Showing users in the same country as your profile. Update your country by selecting a location in Account.</div>
        )}
      </div>
      <ComposeModal
        open={composeOpen}
        onClose={() => { if (!composeSending) setComposeOpen(false); }}
        onSend={sendMessage}
        sending={composeSending}
        value={composeText}
        setValue={setComposeText}
        header={composeTarget ? `Message to owner of ${composeTarget.gearLabel}` : 'Message'}
      />
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

// Simple inline modal styles (keep self-contained here)
function ComposeModal({
  open,
  onClose,
  onSend,
  sending,
  value,
  setValue,
  header,
}: {
  open: boolean;
  onClose: () => void;
  onSend: () => void;
  sending: boolean;
  value: string;
  setValue: (v: string) => void;
  header: string;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1f1f1f', color: '#fff', padding: 20, borderRadius: 10, width: 'min(560px, 92vw)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>{header}</h3>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={6}
          placeholder="Write a brief message…"
          style={{ width: '100%', resize: 'vertical', borderRadius: 8, border: '1px solid #444', padding: 10, background: '#111', color: '#eee' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={sending} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #555', background: '#333', color: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={onSend} disabled={sending || !value.trim()} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #22c55e', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: sending || !value.trim() ? 'not-allowed' : 'pointer' }}>{sending ? 'Sending…' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}
