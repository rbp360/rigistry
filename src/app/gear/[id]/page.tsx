'use client';
import { getDb } from '@/lib/firebase';
import type { GearDoc } from '@/types/schema';
import { GUITAR_TUNINGS } from '@/types/schema';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
// Removed logo.dev fallback in favor of server-scraped brand logos

export default function GearDetailPage() {
  const params = useParams();
  const gearId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [gear, setGear] = useState<GearDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const db = getDb();
    if (!db || !gearId) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const ref = doc(db, 'gear', gearId);
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            setError('Gear not found');
            setLoading(false);
            return;
          }
          const d = snap.data();
          const mapped: GearDoc = {
            id: snap.id,
            ownerId: d.ownerId,
            kind: d.kind,
            kindDetail: d.kindDetail ?? undefined,
            brand: d.brand ?? undefined,
            model: d.model ?? undefined,
            serialNumber: d.serialNumber ?? undefined,
            notes: d.notes ?? undefined,
            imageUrl: d.imageUrl ?? undefined,
            specs: d.specs ?? undefined,
            catalogSource: d.catalogSource ?? undefined,
            archived: d.archived ?? false,
            createdAt: d.createdAt ?? null,
            updatedAt: d.updatedAt ?? null,
          };
          if (mapped.archived) {
            setError('This gear item has been archived.');
          }
          setGear(mapped);
          // Compute logo watermark URL when brand is present using our API
          if (mapped.brand) {
            setLogoUrl(`/api/brand-logo?brand=${encodeURIComponent(mapped.brand)}`);
          } else {
            setLogoUrl(null);
          }
          setLoading(false);
        },
        (err) => {
          setError(err.message || 'Failed to load gear');
          setLoading(false);
        }
      );
    })();
    return () => unsub?.();
  }, [gearId]);

  // Editing and image replacement handlers removed in this simplified view

  // Try to get previous room from query param or fallback
  const [backHref, setBackHref] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) setBackHref(`/rigistry/${room}`);
      else setBackHref('/rigistry');
    }
  }, []);

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#222' }}>
      {/* Back button to return to room */}
      {backHref && (
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = backHref;
            }
          }}
          style={{ position: 'absolute', top: 18, left: 18, zIndex: 10, background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 8, padding: '7px 16px', fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
        >
          ← Back to Room
        </button>
      )}

      {/* Settings cog button top right */}
      <button
        type="button"
        aria-label="Settings"
        style={{ position: 'absolute', top: 18, right: 18, zIndex: 10, background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
        onClick={() => setShowSettings(true)}
      >
        {/* Classic gear/cog SVG icon */}
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16.5A3.5 3.5 0 1 0 13 9.5a3.5 3.5 0 0 0 0 7z" stroke="#fff" strokeWidth="2" fill="none"/>
          <path d="M21.2 14.1c.1-.7.1-1.5 0-2.2l2-1.6c.2-.2.3-.6.1-.9l-1.9-3.3c-.2-.3-.6-.4-.9-.3l-2.3.9a7.2 7.2 0 0 0-1.7-1l-.3-2.4a.7.7 0 0 0-.7-.6h-3.7a.7.7 0 0 0-.7.6l-.3 2.4c-.6.2-1.2.5-1.7 1l-2.3-.9a.7.7 0 0 0-.9.3l-1.9 3.3a.7.7 0 0 0 .1.9l2 1.6c-.1.7-.1 1.5 0 2.2l-2 1.6a.7.7 0 0 0-.1.9l1.9 3.3c.2.3.6.4.9.3l2.3-.9c.5.4 1.1.8 1.7 1l.3 2.4c.1.3.3.6.7.6h3.7c.3 0 .6-.3.7-.6l.3-2.4c.6-.2 1.2-.5 1.7-1l2.3.9c.3.1.7 0 .9-.3l1.9-3.3a.7.7 0 0 0-.1-.9l-2-1.6z" stroke="#fff" strokeWidth="1.5" fill="none"/>
        </svg>
      </button>

      {/* Settings modal popup */}
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.4)', padding: '32px 36px', minWidth: 320, maxWidth: '90vw', color: '#fff', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ margin: 0, fontSize: 22 }}>Settings</h3>
            {/* Number of strings dropdown for guitar and bass */}
            {gear && (gear.kind === 'guitar' || gear.kind === 'bass') && (
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Number of strings</span>
                <select
                  value={gear.numberOfStrings?.toString() || ''}
                  style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                  onChange={async (e) => {
                    const newVal = parseInt(e.target.value, 10);
                    if (!gear.id) return;
                    const db = getDb();
                    if (!db) return;
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const ref = doc(db, 'gear', gear.id);
                    await updateDoc(ref, { numberOfStrings: newVal });
                    gear.numberOfStrings = newVal;
                  }}
                >
                  {gear.kind === 'guitar' ? (
                    <>
                      <option value="6">6 string</option>
                      <option value="7">7 string</option>
                      <option value="8">8 string</option>
                      <option value="12">12 string</option>
                    </>
                  ) : (
                    <>
                      <option value="4">4 string</option>
                      <option value="5">5 string</option>
                      <option value="6">6 string</option>
                      <option value="8">8 string</option>
                      <option value="12">12 string</option>
                    </>
                  )}
                </select>
                <small style={{ opacity: 0.7 }}>Used for future features.</small>
              </label>
            )}
            <button
              type="button"
              style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 18px', fontSize: 16, cursor: 'pointer', fontWeight: 600 }}
              onClick={() => {
                // Pass all gear info to add page via query params
                const params = new URLSearchParams();
                if (gear) {
                  if (gear.kind) params.set('kind', gear.kind);
                  if (gear.kindDetail) params.set('kindDetail', gear.kindDetail);
                  if (gear.brand) params.set('brand', gear.brand);
                  if (gear.model) params.set('model', gear.model);
                  if (gear.serialNumber) params.set('serialNumber', gear.serialNumber);
                  if (gear.color) params.set('color', gear.color);
                  if (gear.notes) params.set('notes', gear.notes);
                  if (gear.imageUrl) params.set('imageUrl', gear.imageUrl);
                }
                router.push(`/gear/add?${params.toString()}`);
              }}
            >
              Change item
            </button>
            <button
              type="button"
              style={{ background: '#333', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 14, cursor: 'pointer', marginTop: 8 }}
              onClick={() => setShowSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Header: Brand + Model + Serial Number */}
      {!loading && gear && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            background: 'rgba(0,0,0,0.45)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 10,
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(2px)'
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, lineHeight: 1.2 }}>
            {([gear.brand, gear.model].filter(Boolean).join(' ') || 'Gear')}
            {gear.serialNumber ? ` — ${gear.serialNumber}` : ''}
          </h1>
        </div>
      )}
      {/* Show error banner if there is a loading error */}
      {error && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 4, background: 'rgba(128,0,0,0.9)', color: '#fff', padding: '6px 10px', borderRadius: 8 }}>
          {error}
        </div>
      )}
      {/* Small top-left image (universal for all gear) - moved down to avoid back button */}
      {!loading && gear && (
        <div style={{ position: 'absolute', top: 64, left: 12, zIndex: 3, background: 'rgba(0,0,0,0.35)', padding: 6, borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
          {(() => {
            const src = gear.imageUrl || logoUrl || '/branding/logo1.png';
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={gear.brand ? `${gear.brand} ${gear.model ?? ''}` : 'Gear image'}
                style={{ width: 192, height: 192, objectFit: 'cover', borderRadius: 8, display: 'block', background: '#111' }}
              />
            );
          })()}
        </div>
      )}
      {!loading && gear && ['guitar', 'bass'].includes(gear.kind) ? (
        <>
          {/* Background watermark */}
          <div style={{ position: 'absolute', inset: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              src="/branding/Guitar backdrop.png"
              alt="Guitar/Bass Backdrop"
              width={900}
              height={900}
              style={{ objectFit: 'contain', opacity: 0.15, maxWidth: '80vw', maxHeight: '80vh' }}
              priority
            />
          </div>
          {/* Placeholder spec panel for guitar-specific maintenance fields */}
          {(gear.kind === 'guitar' || gear.kind === 'bass') && (
            <GuitarSetupFields gear={gear} notes={gear.notes} />
          )}
        </>
      ) : (
        // ...existing code for other gear types...
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ...existing code for non-guitar/bass gear... */}
        </div>
      )}
    </main>
  );
}


// ...existing code...

function GuitarSetupFields({ gear, notes }: { gear: GearDoc; notes?: string }) {
  const [dateStrung, setDateStrung] = useState('');
  const [dateSetup, setDateSetup] = useState('');
  const [dateStrungError, setDateStrungError] = useState('');
  const [dateSetupError, setDateSetupError] = useState('');

  function autocompleteDate(val: string): string {
    // Remove non-digits
    let digits = val.replace(/[^\d]/g, '');
    // Pad to at least 6 digits
    if (digits.length === 5) digits = '0' + digits;
    if (digits.length === 3) digits = '0' + digits;
    // If 4 digits, assume ddmm, add current year
    if (digits.length === 4) {
      const year = String(new Date().getFullYear()).slice(-2);
      digits += year;
    }
    // If 6 or 8 digits, try to parse
    if (digits.length === 6 || digits.length === 8) {
      let day = parseInt(digits.slice(0, 2), 10);
      let month = parseInt(digits.slice(2, 4), 10);
      let year = digits.slice(4);
      // If day > 31 and month <= 12, swap
      if (day > 31 && month <= 12) {
        [day, month] = [month, day];
      }
      // If month > 12 and day <= 31, swap
      if (month > 12 && day <= 31) {
        [day, month] = [month, day];
      }
      // Clamp day/month
      day = Math.max(1, Math.min(day, 31));
      month = Math.max(1, Math.min(month, 12));
      // Expand year if needed
      if (year.length === 2) year = '20' + year;
      return `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
    }
    return digits;
  }

  function formatDateSlashes(val: string): string {
    const digits = val.replace(/[^\d]/g, '');
    if (digits.length === 6) {
      // ddmmyy
      return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,6)}`;
    }
    if (digits.length === 8) {
      // ddmmyyyy
      return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
    }
    return val;
  }

  function validateDate(val: string) {
    // Accept ddmmyy or ddmmyyyy
    const re = /^(\d{2})(\d{2})(\d{2,4})$/;
    if (!val) return '';
    const m = val.match(re);
    if (!m) return 'Format: ddmmyy';
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return 'Invalid date';
    return '';
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 210,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92vw',
        maxWidth: 1400,
        zIndex: 5,
        padding: '0 12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 14,
        alignItems: 'stretch'
      }}
    >
      {/* Tuning dropdown, options based on numberOfStrings */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 500, fontSize: 15 }}>Tuning</span>
        <select
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
          defaultValue={(() => {
            const num = typeof gear?.numberOfStrings === 'number' ? gear.numberOfStrings : 6;
            const tunings = GUITAR_TUNINGS[num] || GUITAR_TUNINGS[6];
            return tunings[0]?.name || '';
          })()}
        >
          {(GUITAR_TUNINGS[(typeof gear?.numberOfStrings === 'number' ? gear.numberOfStrings : 6)] || GUITAR_TUNINGS[6]).map((tuning) => (
            <option key={tuning.name} value={tuning.name}>{tuning.name}</option>
          ))}
        </select>
      </div>
      <FieldButton label="String gauge" value="—" />
      <FieldButton label="String type / manufacturer" value="—" />
      <FieldButton label="Pickups" value="—" />
      <FieldInput
        label="Date strung"
        value={formatDateSlashes(dateStrung)}
        onChange={v => {
          const auto = autocompleteDate(v);
          setDateStrung(auto);
          setDateStrungError(validateDate(auto));
        }}
        error={dateStrungError}
      />
      <FieldInput
        label="Date set-up"
        value={formatDateSlashes(dateSetup)}
        onChange={v => {
          const auto = autocompleteDate(v);
          setDateSetup(auto);
          setDateSetupError(validateDate(auto));
        }}
        error={dateSetupError}
      />
      <FieldButton label="Set-up notes" value="—" wide />
      <FieldButton label="Notes" value={notes || '—'} wide />
      <FieldButton label="Advanced / settings" value="Placeholder (future setup panel)" wide subtle />
    </div>
  );
}

function FieldButton({ label, value, wide, subtle }: { label: string; value: string; wide?: boolean; subtle?: boolean }) {
  return (
    <button
      type="button"
      style={{
        gridColumn: wide ? '1 / -1' : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '14px 16px 18px',
        background: subtle ? 'transparent' : 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10,
        cursor: 'default',
        minHeight: 80,
        textAlign: 'left',
        color: '#eee',
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1.3,
        whiteSpace: 'normal'
      }}
      aria-label={label}
    >
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 600, opacity: value === '—' ? 0.45 : 0.95 }}>{value}</span>
    </button>
  );
}

function FieldInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        padding: '14px 16px 18px',
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10,
        minHeight: 80,
        color: '#eee',
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1.3,
        whiteSpace: 'normal'
      }}
    >
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="ddmmyy or ddmmyyyy"
        style={{
          fontSize: 15,
          fontWeight: 600,
          padding: '6px 10px',
          borderRadius: 6,
          border: error ? '1px solid #c00' : '1px solid #444',
          background: '#222',
          color: '#fff',
          outline: 'none',
          width: '100%'
        }}
        maxLength={8}
        aria-label={label}
      />
      {error && <span style={{ color: '#c00', fontSize: 12 }}>{error}</span>}
    </div>
  );
}
