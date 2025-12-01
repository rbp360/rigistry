'use client';
import React from 'react';
import { getDb } from '@/lib/firebase';
import type { GearDoc, GearSetupSnapshot, DrumPieceSetup, CymbalPieceSetup } from '@/types/schema';
import { GUITAR_TUNINGS, GUITAR_STRING_GAUGES, BASS_TUNINGS, BASS_STRING_GAUGES, STRING_MANUFACTURERS, PICKUP_MANUFACTURERS, GEAR_ADD_CATEGORIES } from '@/types/schema';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import itemStyles from '../../item-pages/ItemPageCommon.module.css';
// ...existing imports...

// Single utility to render notes with clickable snapshot markers
function renderNotesWithSnapshots(notes: string | undefined, gear: GearDoc) {
  if (!notes) return '—';
  const regex = /--Snapshot (\d{2}\/\d{2})--/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(notes)) !== null) {
    const start = match.index;
    const end = regex.lastIndex;
    if (start > lastIdx) parts.push(notes.slice(lastIdx, start));
    const monthYear = match[1];
    const snap = gear.snapshots?.find(s => s.monthYear === monthYear);
    if (snap) {
      parts.push(
        <button
          key={`snapbtn-${idx}`}
          type="button"
          title={`View snapshot from ${monthYear}`}
          style={{
            background: '#fff',
            color: '#b00',
            border: '2px solid #b00',
            borderRadius: 8,
            padding: '2px 8px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            margin: '0 2px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            outline: 'none',
          }}
          onClick={e => {
            e.stopPropagation();
            window.open(`/gear/${gear.id}?snapshot=${snap.savedAt}`, '_blank');
          }}
        >
          {`--Snapshot ${monthYear}--`}
        </button>
      );
      idx++;
    } else {
      parts.push(match[0]);
    }
    lastIdx = end;
  }
  if (lastIdx < notes.length) parts.push(notes.slice(lastIdx));
  return <>{parts}</>;
}
// Removed logo.dev fallback in favor of server-scraped brand logos

export default function GearDetailPage() {
  const params = useParams();
  const gearId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [gear, setGear] = useState<GearDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // Fallback handling for room-based backdrop images
  const [roomBackdropSrc, setRoomBackdropSrc] = useState<string | null>(null);
  const router = useRouter();
  // Toast available in some subcomponents; use alert fallback here if needed

  // Map kind/category to a backdrop image path
  const backdropForKind = (kind: string | undefined): string | null => {
    if (!kind) return null;
    const k = kind.toLowerCase();
    if (k === 'guitar' || k === 'bass') return '/branding/Guitar backdrop.png';
    if (k === 'drums') return '/branding/drum room.png';
    if (k === 'amplifiers-effects' || k === 'amp' || k === 'cab' || k === 'pedal') return '/branding/Amp backdrop.png';
    if (k === 'live-sound' || k === 'vocals-microphone' || k === 'microphone') return '/branding/Live backdrop.png';
    if (k === 'studio-sound' || k === 'interface') return '/branding/Studio backdrop.png';
    if (k === 'decks-dj' || k === 'laptop-electronic') return '/branding/DJbooth.png';
    if (k === 'keyboard-synth-sampler' || k === 'synthesizer' || k === 'keyboard' || k === 'sampler') return '/branding/Synthzone.png';
    if (k === 'strings' || k === 'woodwind' || k === 'brass' || k === 'percussion' || k === 'piano') return '/branding/Orchestra backdrop.png';
    if (k === 'accessories' || k === 'accessory' || k === 'other') return '/branding/Instrument backdrop.png';
    return null;
  };

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
            // Map legacy friendlyName to new nickname field
            nickname: d.nickname ?? d.friendlyName ?? undefined,
            notes: d.notes ?? undefined,
            ampSettings: d.ampSettings ?? undefined,
            settingsFileUrl: d.settingsFileUrl ?? undefined,
            drumHeadDetails: d.drumHeadDetails ?? undefined,
            drumHeadTension: d.drumHeadTension ?? undefined,
            drumHeadChangeDate: d.drumHeadChangeDate ?? undefined,
            drumBody: d.drumBody ?? undefined,
            drumModsMuffles: d.drumModsMuffles ?? undefined,
            drumPieces: Array.isArray(d.drumPieces) ? d.drumPieces : [],
            cymbalPieces: Array.isArray(d.cymbalPieces) ? d.cymbalPieces : [],
            imageUrl: d.imageUrl ?? undefined,
            specs: d.specs ?? undefined,
            catalogSource: d.catalogSource ?? undefined,
            stringManufacturer: d.stringManufacturer ?? undefined,
            pickupManufacturer: d.pickupManufacturer ?? undefined,
            pickupBManufacturer: d.pickupBManufacturer ?? d.pickupManufacturer ?? undefined,
            pickupMManufacturer: d.pickupMManufacturer ?? undefined,
            pickupNManufacturer: d.pickupNManufacturer ?? undefined,
            snapshots: d.snapshots ?? [],
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
  // Normalize various stored/friendly room strings to canonical keys
  const normalizeRoom = (raw: string): string => {
    const s = (raw || '').toString().trim().toLowerCase();
    if (!s) return '';
    if (s === 'live') return 'stage';
    const collapsed = s.replace(/[\s_-]/g, '');
    const dashed = s.replace(/[\s_]+/g, '-');
    if (collapsed === 'controlroom' || dashed === 'control' || dashed === 'control-room' || dashed === 'studio' || dashed === 'studio-room') return 'control';
    if (collapsed === 'djbooth' || dashed === 'dj-booth') return 'dj-booth';
    if (collapsed === 'orchestralpit' || dashed === 'orchestral-pit' || collapsed === 'orchestra' || dashed === 'orchestra-pit') return 'orchestral-pit';
    if (collapsed === 'guitaramp' || dashed === 'guitar-amp') return 'guitar-amp';
    if (collapsed === 'drumroom' || dashed === 'drums' || dashed === 'drum') return 'drum';
    if (dashed === 'synth-zone' || dashed === 'synthzone') return 'synthzone';
    if (dashed === 'stage') return 'stage';
    return dashed; // best-effort
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) setBackHref(`/rigistry/${room}`);
      else setBackHref('/rigistry');
    }
  }, []);

  // Reset backdrop fallback when room changes
  useEffect(() => {
    setRoomBackdropSrc(null);
  }, [gear?.room]);

  // Legacy global event listener removed; modal now opens via URL param `openSnapshot`

  return (
    <main className={itemStyles.itemMain} style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Backdrop overlay: prefer kind-based; fallback to room-based */}
      {!loading && gear && (() => {
        const kindSrc = backdropForKind(gear.kind);
        const r = String(gear.room || '');
        const norm = normalizeRoom(r);
        const valid = ['guitar-amp','control','drum','synthzone','stage','dj-booth','orchestral-pit'] as const;
        const isValid = (valid as readonly string[]).includes(norm);
        const roomPrimary = isValid && (
          norm === 'control' ? '/branding/Studio backdrop.png'
          : (norm === 'stage' || norm === 'synthzone' || norm === 'dj-booth') ? '/branding/Live backdrop.png'
          : norm === 'orchestral-pit' ? '/branding/Orchestra.png'
          : null
        );
        const src = kindSrc ?? (roomBackdropSrc ?? roomPrimary);
        return src ? (
          <div style={{ position: 'absolute', inset: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
            <Image
              src={src}
              alt="Backdrop"
              width={1400}
              height={1400}
              style={{ objectFit: 'contain', opacity: 0.20, maxWidth: '92vw', maxHeight: '92vh', pointerEvents: 'none' }}
              onError={() => {
                if (!kindSrc) {
                  if (norm === 'control' && src !== '/branding/Control room.png') {
                    setRoomBackdropSrc('/branding/Control room.png');
                  } else if ((norm === 'stage' || norm === 'synthzone' || norm === 'dj-booth') && src !== '/branding/Live room.png') {
                    setRoomBackdropSrc('/branding/Live room.png');
                  } else if (norm === 'orchestral-pit' && src !== '/branding/Orchestra backdrop.png') {
                    setRoomBackdropSrc('/branding/Orchestra backdrop.png');
                  }
                }
              }}
              priority
            />
          </div>
        ) : null;
      })()}
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
            {/* Kind (classification) selector */}
            {gear && (
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Classification (kind)</span>
                <select
                  value={gear.kind}
                  style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                  onChange={async (e) => {
                    const newKind = e.target.value as typeof gear.kind;
                    if (newKind === gear.kind) return;
                    if (!gear.id) return;
                    const db = getDb();
                    if (!db) return;
                    try {
                      const { doc, updateDoc } = await import('firebase/firestore');
                      const ref = doc(db, 'gear', gear.id);
                      await updateDoc(ref, { kind: newKind });
                      gear.kind = newKind;
                    } catch (err) {
                      console.error('Failed to update kind', err);
                    }
                  }}
                >
                  {GEAR_ADD_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <small style={{ opacity: 0.7 }}>Change overall item classification (e.g. Guitar → Amplifiers/Effects).</small>
              </label>
            )}
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
                  if (gear.id) params.set('id', gear.id);
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
          <h1 className={itemStyles.itemTitle} style={{ margin: 0, fontSize: 20, lineHeight: 1.2 }}>
            {(() => {
              const brandModel = [gear.brand, gear.model].filter(Boolean).join(' ');
              const parts: string[] = [];
              if (gear.nickname) parts.push(gear.nickname);
              if (brandModel) parts.push(brandModel);
              const base = parts.join(' — ') || brandModel || gear.nickname || 'Gear';
              return base + (gear.serialNumber ? ` — ${gear.serialNumber}` : '');
            })()}
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
        <>
          <div style={{ position: 'absolute', top: 64, left: 12, zIndex: 3, background: 'rgba(0,0,0,0.35)', padding: 6, borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
            {(() => {
              const src = gear.imageUrl || logoUrl || '/branding/logo1.png';
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={gear.brand ? `${gear.brand} ${gear.model ?? ''}` : 'Gear image'}
                  className={itemStyles.itemImage}
                  style={{ width: 154, height: 154 }}
                />
              );
            })()}
          </div>
          {/* Save snapshot button under image */}
          <div style={{ position: 'absolute', top: 230, left: 12, zIndex: 3, padding: '12px 0 0 0' }}>
            {/* Only show if not in snapshot mode and gear is guitar or bass */}
            {['guitar', 'bass'].includes(gear.kind) && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    // Directly request opening the snapshot modal via a custom event
                    window.dispatchEvent(new Event('openGearSnapshot'));
                  }
                }}
                style={{
                  background: '#222',
                  color: '#fff',
                  border: '2px solid #222',
                  padding: '10px 18px',
                  fontSize: 14,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = '#22c55e')}
                onMouseOut={e => (e.currentTarget.style.borderColor = '#222')}
              >
                Save snapshot
              </button>
            )}
          </div>
        </>
      )}
      {!loading && gear && ['guitar', 'bass'].includes(gear.kind) ? (
        <>
          {/* Placeholder spec panel for guitar-specific maintenance fields */}
          {(gear.kind === 'guitar' || gear.kind === 'bass') && (
            <GuitarSetupFields gear={gear} notes={gear.notes} />
          )}
        </>
      ) : !loading && gear && (gear.kind === 'amplifiers-effects' || gear.kind === 'amp') ? (
        <>
          <AmpSetupFields gear={gear} />
        </>
      ) : !loading && gear && gear.kind === 'drums' ? (
        <>
          <DrumSetupFields gear={gear} />
        </>
      ) : (
        // Other gear types: render generic setup with Age (year)
        <>
          {gear && <GenericSetupFields gear={gear} />}
        </>
      )}
    </main>
  );
}


// ...existing code...

function AmpSetupFields({ gear }: { gear: GearDoc }) {
  // Snapshot viewing logic (similar to guitar)
  const [activeSnapshot, setActiveSnapshot] = useState<GearSetupSnapshot | null>(null);
  const hasSnapshotParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).has('snapshot') : false;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const snapshotDate = searchParams.get('snapshot');
    if (snapshotDate && Array.isArray(gear.snapshots)) {
      const found = gear.snapshots.find(s => String(s.savedAt) === snapshotDate);
      setActiveSnapshot(found || null);
    }
  }, [gear.snapshots]);
  const snapshotMode = hasSnapshotParam && Boolean(activeSnapshot);

  // Editable states
  const [notesEdit, setNotesEdit] = useState<string>(gear.notes || '');
  const [settingsEdit, setSettingsEdit] = useState<string>(gear.ampSettings || '');
  const [settingsFileUrl, setSettingsFileUrl] = useState<string>(gear.settingsFileUrl || '');
  const [nickname, setNickname] = useState<string>(gear.nickname || '');
  useEffect(() => {
    if (!snapshotMode) {
      setNotesEdit(gear.notes || '');
      setSettingsEdit(gear.ampSettings || '');
      setNickname(gear.nickname || '');
      setSettingsFileUrl(gear.settingsFileUrl || '');
    }
  }, [gear.notes, gear.ampSettings, gear.nickname, gear.settingsFileUrl, snapshotMode]);

  const [showSnapshotExplain, setShowSnapshotExplain] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
    // Open modal whenever URL has openSnapshot=1 (supports in-page button via popstate)
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const checkAndOpen = () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('openSnapshot') === '1') {
          setShowSnapshotExplain(true);
          params.delete('openSnapshot');
          const url = new URL(window.location.href);
          url.search = params.toString();
          window.history.replaceState({}, '', url.toString());
        }
      };
      checkAndOpen();
      const handler = () => checkAndOpen();
      window.addEventListener('popstate', handler);
      return () => window.removeEventListener('popstate', handler);
    }, []);
  const { addToast } = useToast();

  // Provider detection for settings file URL (simple hostname / substring matching)
  function detectSettingsProvider(rawUrl: string): { id: string; label: string; icon?: string } | null {
    if (!rawUrl) return null;
    let url: URL | null = null;
    try { url = new URL(rawUrl.trim()); } catch { return null; }
    const h = url.hostname.toLowerCase();
    const patterns: Array<{ test: (host: string, full: string) => boolean; id: string; label: string; icon?: string }> = [
      { test: (host) => host.includes('line6'), id: 'helix', label: 'Line 6 Helix', icon: '🎛️' },
      { test: (host) => host.includes('kemper'), id: 'kemper', label: 'Kemper', icon: '🟩' },
      { test: (host) => host.includes('fractal') || host.includes('axe'), id: 'axe-fx', label: 'Fractal / Axe-Fx', icon: '🟪' },
      { test: (host, full) => host.includes('tonex') || full.includes('tonex'), id: 'tonex', label: 'ToneX', icon: '🧪' },
      { test: (host) => host.includes('neural') || host.includes('quad-cortex'), id: 'quad-cortex', label: 'Neural DSP Quad Cortex', icon: '🧠' },
      { test: (host) => host.includes('github'), id: 'github', label: 'GitHub', icon: '🐱' },
      { test: (host) => host.includes('gist.github'), id: 'gist', label: 'GitHub Gist', icon: '📎' },
      { test: (host) => host.includes('drive.google'), id: 'gdrive', label: 'Google Drive', icon: '🟦' },
      { test: (host) => host.includes('dropbox'), id: 'dropbox', label: 'Dropbox', icon: '🟦' },
      { test: (host) => host.includes('onedrive'), id: 'onedrive', label: 'OneDrive', icon: '🟦' },
      { test: (host) => host.includes('mega.nz'), id: 'mega', label: 'Mega', icon: '🟥' },
    ];
    for (const p of patterns) {
      if (p.test(h, rawUrl.toLowerCase())) return { id: p.id, label: p.label, icon: p.icon };
    }
    return { id: 'generic', label: url.hostname, icon: '🔗' };
  }

  return (
    <div
      style={{
        width: '92vw',
        maxWidth: 1400,
        margin: '220px auto 90px',
        padding: '0 12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 16,
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 2
      }}
    >
      {/* Amp-specific content below */}
      {/* Overview banner */}
      <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '18px 20px', color: '#eee', display: 'grid', gap: 14 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px', opacity: .65 }}>Amplifier / Effects Overview</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          {nickname ? `${nickname} — ` : ''}{[gear.brand, gear.model].filter(Boolean).join(' ') || 'Amplifier/Effects'}{gear.serialNumber ? ` — ${gear.serialNumber}` : ''}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, opacity: .8 }}>Use Notes and Settings sections below. Save a snapshot to archive current state.</div>
      </div>
      {/* Age (year) */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Age (year)</span>
        {(() => {
          const currentYear = new Date().getFullYear();
          const years = Array.from({ length: currentYear - 1899 }, (_, i) => 1900 + i);
          const currentVal = snapshotMode ? '' : (gear.specs?.year ?? '');
          return (
            <select
              style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
              value={String(currentVal)}
              disabled={snapshotMode}
              onChange={async (e) => {
                const val = e.target.value ? Number(e.target.value) : '';
                if (gear.id) {
                  const db = getDb();
                  if (db) {
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const ref = doc(db, 'gear', gear.id);
                    await updateDoc(ref, { ['specs.year']: val === '' ? null : val });
                  }
                }
              }}
            >
              <option value="">—</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          );
        })()}
      </div>
      {/* Nickname field */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Nickname</span>
        <input
          type="text"
          value={nickname}
          disabled={snapshotMode}
          onChange={e => setNickname(e.target.value)}
          onBlur={async () => {
            if (snapshotMode || !gear.id) return;
            const db = getDb();
            if (!db) return;
            try {
              const { doc, updateDoc } = await import('firebase/firestore');
              const ref = doc(db, 'gear', gear.id);
              const trimmed = nickname.trim();
              await updateDoc(ref, { nickname: trimmed || null, friendlyName: trimmed || null });
              gear.nickname = trimmed || undefined;
            } catch (err) { console.error('Nickname save failed', err); }
          }}
          placeholder="e.g. 'Main Rig', 'Studio Amp'"
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
        />
      </div>
        {/* Age (year) */}
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Age (year)</span>
          {(() => {
            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: currentYear - 1899 }, (_, i) => 1900 + i);
            const currentVal = snapshotMode ? '' : (gear.specs?.year ?? '');
            return (
              <select
                style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                value={String(currentVal)}
                disabled={snapshotMode}
                onChange={async (e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  if (gear.id) {
                    const db = getDb();
                    if (db) {
                      const { doc, updateDoc } = await import('firebase/firestore');
                      const ref = doc(db, 'gear', gear.id);
                      await updateDoc(ref, { ['specs.year']: val === '' ? null : val });
                    }
                  }
                }}
              >
                <option value="">—</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            );
          })()}
        </div>
      {/* Settings editable */}
      {!snapshotMode && (
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 10 }}>
          <div style={{ background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 16px 12px', color: '#eee', display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Link to settings file</span>
            <input
              type="url"
              value={settingsFileUrl}
              onChange={e => setSettingsFileUrl(e.target.value)}
              onBlur={async () => {
                if (!gear.id) return; const db = getDb(); if (!db) return;
                try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { settingsFileUrl: settingsFileUrl.trim() || null }); (gear as GearDoc).settingsFileUrl = settingsFileUrl.trim() || undefined; } catch (err) { console.error('Settings file URL save failed', err); }
              }}
              placeholder="https://..."
              style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff', fontSize: 15 }}
            />
            <small style={{ opacity: 0.55 }}>For digital gear, enter the URL of where your saved settings are stored.</small>
            {settingsFileUrl && /^https?:\/\//i.test(settingsFileUrl.trim()) && (() => {
              const info = detectSettingsProvider(settingsFileUrl.trim());
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  <a
                    href={settingsFileUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4dabf7', fontSize: 13, wordBreak: 'break-all', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ fontSize: 14 }}>{info?.icon}</span>
                    <span style={{ fontWeight: 600 }}>Open settings file ↗</span>
                  </a>
                  {info && info.id !== 'generic' && (
                    <div style={{ fontSize: 11, opacity: .7, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{info.icon}</span>
                      <span>Detected provider: {info.label}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '14px 16px 12px', color: '#eee' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Settings (editable)</span>
            <textarea
              value={settingsEdit}
              onChange={e => setSettingsEdit(e.target.value)}
              onBlur={async () => {
                if (!gear.id) return;
                const db = getDb();
                if (!db) return;
                try {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const ref = doc(db, 'gear', gear.id);
                  await updateDoc(ref, { ampSettings: settingsEdit || null });
                  (gear as GearDoc).ampSettings = settingsEdit || undefined;
                } catch (err) { console.error('Settings save failed', err); }
              }}
              placeholder="Document dial positions, channel config, pedal order, etc..."
              style={{ marginTop: 6, width: '100%', minHeight: 120, resize: 'vertical', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.4, outline: 'none' }}
            />
            <small style={{ display: 'block', opacity: 0.55, marginTop: 6 }}>Blur (click outside) to auto-save.</small>
          </div>
        </div>
      )}
      {/* Notes editable */}
      {!snapshotMode && (
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 10 }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '14px 16px 12px', color: '#eee' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Notes (editable)</span>
            <textarea
              value={notesEdit}
              onChange={e => setNotesEdit(e.target.value)}
              onBlur={async () => {
                if (!gear.id) return;
                const db = getDb();
                if (!db) return;
                try {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const ref = doc(db, 'gear', gear.id);
                  await updateDoc(ref, { notes: notesEdit || null });
                  gear.notes = notesEdit || undefined;
                } catch (err) { console.error('Notes save failed', err); }
              }}
              placeholder="General maintenance / change log..."
              style={{ marginTop: 6, width: '100%', minHeight: 140, resize: 'vertical', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.4, outline: 'none' }}
            />
            <small style={{ display: 'block', opacity: 0.55, marginTop: 6 }}>Use markers like --Snapshot mm/yy-- to jump to historic states.</small>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '12px 14px 16px', color: '#eee', fontSize: 14, lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>View snapshots</span>
            <div style={{ fontSize: 15, fontWeight: 600, opacity: !notesEdit ? 0.45 : 0.95, marginTop: 6 }}>
              {renderNotesWithSnapshots(notesEdit, gear)}
            </div>
          </div>
        </div>
      )}
      {/* Advanced / settings free text */}
      <div className={itemStyles.advancedBox}>
        <span className={itemStyles.advancedLabel}>Advanced / settings</span>
        <textarea
          value={settingsEdit}
          onChange={e => setSettingsEdit(e.target.value)}
          onBlur={async () => {
            if (!gear.id) return;
            const db = getDb(); if (!db) return;
            try {
              const { doc, updateDoc } = await import('firebase/firestore');
              const ref = doc(db, 'gear', gear.id);
              await updateDoc(ref, { ampSettings: (settingsEdit || '').trim() || null });
              (gear as GearDoc).ampSettings = (settingsEdit || '').trim() || undefined;
            } catch (err) { console.error('Advanced/settings save failed', err); }
          }}
          placeholder="Amplifier or effects settings, chain notes, etc."
          className={itemStyles.advancedTextarea}
        />
      </div>
      {!snapshotMode && (
        <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowSnapshotExplain(true)}
            style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '10px 18px', fontSize: 14, borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 3px 12px rgba(0,0,0,0.35)' }}
          >Save snapshot to archive</button>
        </div>
      )}
      {showSnapshotExplain && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', color: '#fff', padding: '28px 32px', borderRadius: 16, width: 'min(460px,90vw)', display: 'grid', gap: 18, boxShadow: '0 4px 28px rgba(0,0,0,0.45)' }}>
            <h4 style={{ margin: 0, fontSize: 20 }}>Archive Amp/Effects Snapshot</h4>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              Save current nickname, notes and settings into the archive. Nothing is cleared; values stay in place for ongoing editing.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSnapshotExplain(false)}
                style={{ background: '#444', color: '#fff', border: '1px solid #555', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
              >Cancel</button>
              <button
                type="button"
                disabled={snapshotSaving}
                onClick={async () => {
                  if (!gear.id) return;
                  setSnapshotSaving(true);
                  try {
                    const { saveSetupSnapshot } = await import('@/lib/snapshots');
                    const { snapshot, updatedNotes } = await saveSetupSnapshot(gear.id, {
                      notes: notesEdit,
                      ampSettings: settingsEdit,
                      settingsFileUrl: settingsFileUrl,
                      nickname: nickname,
                    });
                    gear.snapshots = Array.isArray(gear.snapshots) ? [...gear.snapshots, snapshot] : [snapshot];
                    gear.notes = updatedNotes;
                    (gear as GearDoc).ampSettings = (settingsEdit || '').trim() || undefined;
                    setNotesEdit(updatedNotes);
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.set('snapshot', String(snapshot.savedAt));
                      window.history.replaceState({}, '', url.toString());
                    }
                    const mm = String(new Date(snapshot.savedAt).getMonth() + 1).padStart(2, '0');
                    const yy = String(new Date(snapshot.savedAt).getFullYear()).slice(-2);
                    addToast({ type: 'success', title: 'Snapshot saved', message: `Saved setup snapshot (${mm}/${yy})` });
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    addToast({ type: 'error', title: 'Snapshot failed', message: msg });
                  } finally {
                    setSnapshotSaving(false);
                    setShowSnapshotExplain(false);
                  }
                }}
                style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >{snapshotSaving ? 'Saving…' : 'Save Snapshot'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GuitarSetupFields({ gear, notes }: { gear: GearDoc; notes?: string }) {
  // Extract snapshot from URL if present
  const [activeSnapshot, setActiveSnapshot] = useState<GearSetupSnapshot | null>(null);
  const hasSnapshotParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).has('snapshot') : false;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const snapshotDate = searchParams.get('snapshot');
    if (snapshotDate && Array.isArray(gear.snapshots)) {
      const found = gear.snapshots.find(s => String(s.savedAt) === snapshotDate);
      setActiveSnapshot(found || null);
    }
  }, [gear.snapshots]);
  const [dateStrung, setDateStrung] = useState('');
  const [dateSetup, setDateSetup] = useState('');
  const [dateStrungError, setDateStrungError] = useState('');
  const [dateSetupError, setDateSetupError] = useState('');
  const [stringBrand, setStringBrand] = useState<string>(() => gear.stringManufacturer || '');
  const [customBrand, setCustomBrand] = useState<string>('');
  const [pickupBBrand, setPickupBBrand] = useState<string>(() => gear.pickupBManufacturer || gear.pickupManufacturer || '');
  const [pickupMBrand, setPickupMBrand] = useState<string>(() => gear.pickupMManufacturer || '');
  const [pickupNBrand, setPickupNBrand] = useState<string>(() => gear.pickupNManufacturer || '');
  const [customPickupB, setCustomPickupB] = useState<string>('');
  const [customPickupM, setCustomPickupM] = useState<string>('');
  const [customPickupN, setCustomPickupN] = useState<string>('');
  const [tuningName, setTuningName] = useState<string>(() => {
    const val = (gear && 'specs' in gear ? (gear as { specs?: { tuning?: string } }).specs?.tuning : undefined);
    return typeof val === 'string' ? val : '';
  });
  const [stringGauge, setStringGauge] = useState<string>(() => {
    const val = (gear && 'specs' in gear ? (gear as { specs?: { stringGauge?: string } }).specs?.stringGauge : undefined);
    return typeof val === 'string' ? val : '';
  });
  const [nickname, setNickname] = useState<string>(gear.nickname || '');
  // Derived display values (override with snapshot if viewing archive)
  const displayStringBrand = activeSnapshot?.stringManufacturer || stringBrand;
  const displayPickupBBrand = activeSnapshot?.pickupBManufacturer || activeSnapshot?.pickupManufacturer || pickupBBrand;
  const displayPickupMBrand = activeSnapshot?.pickupMManufacturer || pickupMBrand;
  const displayPickupNBrand = activeSnapshot?.pickupNManufacturer || pickupNBrand;
  const displayTuningName = activeSnapshot?.tuning || tuningName;
  const displayStringGauge = activeSnapshot?.stringGauge || stringGauge;
  // Editable notes state
  const [notesEdit, setNotesEdit] = useState<string>(notes || '');
  useEffect(() => {
    const isSnapshot = hasSnapshotParam && Boolean(activeSnapshot);
    if (!isSnapshot) {
      setNotesEdit(notes || '');
      setNickname(gear.nickname || '');
    }
  }, [notes, gear.nickname, hasSnapshotParam, activeSnapshot]);
  const snapshotMode = hasSnapshotParam && Boolean(activeSnapshot);

  // Clear snapshot state when param removed so editing works
  useEffect(() => {
    if (!hasSnapshotParam && activeSnapshot) {
      setActiveSnapshot(null);
    }
  }, [hasSnapshotParam, activeSnapshot]);
  const [showSnapshotExplain, setShowSnapshotExplain] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const { addToast } = useToast();
  // Open modal from under-image button via custom event (no URL param)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setShowSnapshotExplain(true);
    window.addEventListener('openGearSnapshot', handler as EventListener);
    return () => window.removeEventListener('openGearSnapshot', handler as EventListener);
  }, []);
  // Open modal when URL has openSnapshot=1 (supports in-page button via popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkAndOpen = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openSnapshot') === '1') {
        setShowSnapshotExplain(true);
        params.delete('openSnapshot');
        const url = new URL(window.location.href);
        url.search = params.toString();
        window.history.replaceState({}, '', url.toString());
      }
    };
    checkAndOpen();
    const handler = () => checkAndOpen();
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

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
      className="gear-detail-page"
      style={{
        width: '92vw',
        maxWidth: 1400,
        margin: '220px auto 90px', // push below header/image, trimmed bottom space
        padding: '0 12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 16,
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 2
      }}
    >
      {/* If viewing a snapshot, show large red date and snapshot settings */}
      {snapshotMode && activeSnapshot && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', margin: '0 0 28px 0', position: 'relative' }}>
          <div style={{ fontSize: 48, color: '#b00', fontWeight: 900, letterSpacing: 2 }}>
            {activeSnapshot.monthYear}
          </div>
          <div style={{ fontSize: 18, color: '#444', marginTop: 8 }}>
            Historic gear setup snapshot (read-only)
          </div>
          <button
            type="button"
            onClick={() => {
              if (gear.id) {
                window.location.href = `/gear/${gear.id}`; // remove snapshot param
              }
            }}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: '#444',
              color: '#fff',
              border: '1px solid #555',
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Exit snapshot view
          </button>
        </div>
      )}
      {/* Friendly name (user nickname) */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Nickname</span>
        <input
          type="text"
          value={nickname}
          disabled={snapshotMode}
          onChange={e => setNickname(e.target.value)}
          onBlur={async () => {
            if (snapshotMode) return;
            if (!gear.id) return;
            const db = getDb();
            if (!db) return;
            const { doc, updateDoc } = await import('firebase/firestore');
            const ref = doc(db, 'gear', gear.id);
            const trimmed = nickname.trim();
            // Write both nickname and legacy friendlyName for backward compatibility
            await updateDoc(ref, { nickname: trimmed || null, friendlyName: trimmed || null });
            gear.nickname = trimmed || undefined;
          }}
          placeholder="e.g. 'Blackie', 'Old Faithful'"
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
        />
      </div>
      {/* Age (year) */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Age (year)</span>
        {(() => {
          const currentYear = new Date().getFullYear();
          const years = Array.from({ length: currentYear - 1899 }, (_, i) => 1900 + i);
          const currentVal = snapshotMode ? '' : (gear.specs?.year ?? '');
          return (
            <select
              style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
              value={String(currentVal)}
              disabled={snapshotMode}
              onChange={async (e) => {
                const val = e.target.value ? Number(e.target.value) : '';
                if (gear.id) {
                  const db = getDb();
                  if (!db) return;
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const ref = doc(db, 'gear', gear.id);
                  await updateDoc(ref, { ['specs.year']: val === '' ? null : val });
                }
              }}
            >
              <option value="">—</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          );
        })()}
      </div>
      {/* Tuning dropdown, options based on numberOfStrings */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Tuning</span>
        {(() => {
          const isBass = gear.kind === 'bass';
          const count = typeof gear?.numberOfStrings === 'number' ? gear.numberOfStrings : (isBass ? 4 : 6);
          const source = isBass ? (BASS_TUNINGS[count] || BASS_TUNINGS[4]) : (GUITAR_TUNINGS[count] || GUITAR_TUNINGS[6]);
          return (
            <select
              style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
              value={snapshotMode ? displayTuningName : tuningName}
              disabled={snapshotMode}
              onChange={e => setTuningName(e.target.value)}
            >
              <option value="">—</option>
              {source.map(tuning => (
                <option key={tuning.name} value={tuning.name}>{tuning.name}</option>
              ))}
            </select>
          );
        })()}
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">String gauge</span>
        {(() => {
          const isBass = gear.kind === 'bass';
          const count = typeof gear?.numberOfStrings === 'number' ? gear.numberOfStrings : (isBass ? 4 : 6);
          const source = isBass ? (BASS_STRING_GAUGES[count] || BASS_STRING_GAUGES[4]) : (GUITAR_STRING_GAUGES[count] || GUITAR_STRING_GAUGES[6]);
          return (
            <select
              style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
              value={snapshotMode ? displayStringGauge : stringGauge}
              disabled={snapshotMode}
              onChange={e => setStringGauge(e.target.value)}
            >
              <option value="">—</option>
              {source.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          );
        })()}
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">String type / manufacturer</span>
        <select
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
          value={snapshotMode ? displayStringBrand : stringBrand}
          disabled={snapshotMode}
          onChange={async (e) => {
            const val = e.target.value;
            setStringBrand(val);
            if (val !== 'CUSTOM') {
              setCustomBrand('');
              if (gear.id) {
                const db = getDb();
                if (db) {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const ref = doc(db, 'gear', gear.id);
                  await updateDoc(ref, { stringManufacturer: val || null });
                  gear.stringManufacturer = val;
                }
              }
            }
          }}
        >
          <option value="">—</option>
          {STRING_MANUFACTURERS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {!snapshotMode && stringBrand === 'CUSTOM' && (
          <input
            type="text"
            placeholder="Enter custom brand"
            value={customBrand}
            onChange={async (e) => {
              const val = e.target.value;
              setCustomBrand(val);
            }}
            onBlur={async () => {
              if (gear.id) {
                const db = getDb();
                if (db) {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const ref = doc(db, 'gear', gear.id);
                  await updateDoc(ref, { stringManufacturer: customBrand || null });
                  gear.stringManufacturer = customBrand || undefined;
                }
              }
            }}
            style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
          />
        )}
      </div>
      {/* Pickups, Date Strung, Date Set-up in one row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, gridColumn: '1 / -1', alignItems: 'start', marginBottom: 8 }}>
        {/* Pickups (Bridge / Middle / Neck) - half width */}
        <div style={{ display: 'grid', gap: 6, background: 'rgba(0,0,0,0.18)', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)' }}>
          <span className="setup-label" style={{ fontWeight: 600, fontSize: 12, letterSpacing: '.5px', textTransform: 'uppercase', opacity: 0.75 }}>Pickups</span>
          <div style={{ display: 'grid', gap: 8 }}>
            {/* Bridge */}
            <div style={{ display: 'grid', gap: 6 }}>
              <span className="setup-label">Pickup B</span>
              <select
                style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                value={snapshotMode ? displayPickupBBrand : pickupBBrand}
                disabled={snapshotMode}
                onChange={async (e) => {
                  const val = e.target.value;
                  setPickupBBrand(val);
                  if (val !== 'CUSTOM') {
                    setCustomPickupB('');
                    if (gear.id) {
                      const db = getDb();
                      if (db) {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const ref = doc(db, 'gear', gear.id);
                        await updateDoc(ref, { pickupBManufacturer: val || null });
                        gear.pickupBManufacturer = val;
                      }
                    }
                  }
                }}
              >
                <option value="">—</option>
                {PICKUP_MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {!snapshotMode && pickupBBrand === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="Custom bridge pickup"
                  value={customPickupB}
                  onChange={e => setCustomPickupB(e.target.value)}
                  onBlur={async () => {
                    if (gear.id) {
                      const db = getDb();
                      if (db) {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const ref = doc(db, 'gear', gear.id);
                        await updateDoc(ref, { pickupBManufacturer: customPickupB || null });
                        gear.pickupBManufacturer = customPickupB || undefined;
                      }
                    }
                  }}
                  style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                />
              )}
            </div>
            {/* Middle */}
            <div style={{ display: 'grid', gap: 6 }}>
              <span className="setup-label">Pickup M</span>
              <select
                style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                value={snapshotMode ? displayPickupMBrand : pickupMBrand}
                disabled={snapshotMode}
                onChange={async (e) => {
                  const val = e.target.value;
                  setPickupMBrand(val);
                  if (val !== 'CUSTOM') {
                    setCustomPickupM('');
                    if (gear.id) {
                      const db = getDb();
                      if (db) {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const ref = doc(db, 'gear', gear.id);
                        await updateDoc(ref, { pickupMManufacturer: val || null });
                        gear.pickupMManufacturer = val;
                      }
                    }
                  }
                }}
              >
                <option value="">—</option>
                {PICKUP_MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {!snapshotMode && pickupMBrand === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="Custom middle pickup"
                  value={customPickupM}
                  onChange={e => setCustomPickupM(e.target.value)}
                  onBlur={async () => {
                    if (gear.id) {
                      const db = getDb();
                      if (db) {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const ref = doc(db, 'gear', gear.id);
                        await updateDoc(ref, { pickupMManufacturer: customPickupM || null });
                        gear.pickupMManufacturer = customPickupM || undefined;
                      }
                    }
                  }}
                  style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                />
              )}
            </div>
            {/* Neck */}
            <div style={{ display: 'grid', gap: 6 }}>
              <span className="setup-label">Pickup N</span>
              <select
                style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                value={snapshotMode ? displayPickupNBrand : pickupNBrand}
                disabled={snapshotMode}
                onChange={async (e) => {
                  const val = e.target.value;
                  setPickupNBrand(val);
                  if (val !== 'CUSTOM') {
                    setCustomPickupN('');
                    if (gear.id) {
                      const db = getDb();
                      if (db) {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const ref = doc(db, 'gear', gear.id);
                        await updateDoc(ref, { pickupNManufacturer: val || null });
                        gear.pickupNManufacturer = val;
                      }
                    }
                  }
                }}
              >
                <option value="">—</option>
                {PICKUP_MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {!snapshotMode && pickupNBrand === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="Custom neck pickup"
                  value={customPickupN}
                  onChange={e => setCustomPickupN(e.target.value)}
                  onBlur={async () => {
                    if (gear.id) {
                      const db = getDb();
                      if (db) {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const ref = doc(db, 'gear', gear.id);
                        await updateDoc(ref, { pickupNManufacturer: customPickupN || null });
                        gear.pickupNManufacturer = customPickupN || undefined;
                      }
                    }
                  }}
                  style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
                />
              )}
            </div>
          </div>
        </div>
        {/* Date strung */}
        <div>
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
        </div>
        {/* Date set-up */}
        <div>
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
        </div>
      </div>
      {/* Notes editable / snapshot */}
      {!snapshotMode && (
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 10 }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '14px 16px 12px', color: '#eee' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Notes (editable)</span>
            <textarea
              value={notesEdit}
              onChange={e => setNotesEdit(e.target.value)}
              onBlur={async () => {
                if (!gear.id) return;
                const db = getDb();
                if (!db) return;
                try {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const ref = doc(db, 'gear', gear.id);
                  await updateDoc(ref, { notes: notesEdit || null });
                  gear.notes = notesEdit || undefined;
                } catch (err) {
                  console.error('Notes save failed', err);
                }
              }}
              placeholder="Enter setup / maintenance notes..."
              style={{
                marginTop: 6,
                width: '100%',
                minHeight: 140,
                resize: 'vertical',
                background: '#222',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: 8,
                padding: '10px 12px',
                fontFamily: 'inherit',
                fontSize: 15,
                lineHeight: 1.4,
                outline: 'none'
              }}
            />
            {/* Removed instructional helper text per request */}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '12px 14px 16px', color: '#eee', fontSize: 14, lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Preview</span>
            <div style={{ fontSize: 15, fontWeight: 600, opacity: !notesEdit ? 0.45 : 0.95, marginTop: 6 }}>
              {renderNotesWithSnapshots(notesEdit, gear)}
            </div>
          </div>
        </div>
      )}
      {/* Advanced / settings free text for generic rooms */}
      <div style={{ gridColumn: '1 / -1' }} className={itemStyles.advancedBox}>
        <span className={itemStyles.advancedLabel}>Advanced / settings</span>
        <textarea
          value={notesEdit}
          onChange={e => setNotesEdit(e.target.value)}
          onBlur={async () => {
            if (!gear.id) return;
            const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { notes: notesEdit || null }); gear.notes = notesEdit || undefined; } catch (err) { console.error('Advanced/settings save failed', err); }
          }}
          placeholder="Technical settings, patch notes, chain details…"
          className={itemStyles.advancedTextarea}
        />
      </div>
      {/* Removed duplicate snapshot button at bottom of page */}
      {showSnapshotExplain && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', color: '#fff', padding: '28px 32px', borderRadius: 16, width: 'min(460px,90vw)', display: 'grid', gap: 18, boxShadow: '0 4px 28px rgba(0,0,0,0.45)' }}>
            <h4 style={{ margin: 0, fontSize: 20 }}>Archive Setup Snapshot</h4>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              Save your current settings (strings, pickups, tuning, gauge and notes) into the archive. This lets you re-set-up your instrument later and keep a record of modifications or past set-ups. Nothing is cleared; the current gear values stay in place.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSnapshotExplain(false)}
                style={{ background: '#444', color: '#fff', border: '1px solid #555', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={snapshotSaving}
                onClick={async () => {
                  if (!gear.id) return;
                  setSnapshotSaving(true);
                  try {
                    const { saveSetupSnapshot } = await import('@/lib/snapshots');
                    const { snapshot, updatedNotes } = await saveSetupSnapshot(gear.id, {
                      notes: notesEdit,
                      nickname: nickname,
                      stringManufacturer: stringBrand === 'CUSTOM' ? (customBrand.trim() || null) : stringBrand,
                      pickupBManufacturer: pickupBBrand === 'CUSTOM' ? (customPickupB.trim() || null) : pickupBBrand,
                      pickupMManufacturer: pickupMBrand === 'CUSTOM' ? (customPickupM.trim() || null) : pickupMBrand,
                      pickupNManufacturer: pickupNBrand === 'CUSTOM' ? (customPickupN.trim() || null) : pickupNBrand,
                      numberOfStrings: gear.numberOfStrings,
                      tuning: tuningName,
                      stringGauge,
                    });
                    gear.snapshots = Array.isArray(gear.snapshots) ? [...gear.snapshots, snapshot] : [snapshot];
                    gear.notes = updatedNotes;
                    setNotesEdit(updatedNotes);
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.set('snapshot', String(snapshot.savedAt));
                      window.history.replaceState({}, '', url.toString());
                    }
                    const mmLoc = String(new Date(snapshot.savedAt).getMonth() + 1).padStart(2, '0');
                    const yyLoc = String(new Date(snapshot.savedAt).getFullYear()).slice(-2);
                    addToast({ type: 'success', title: 'Snapshot saved', message: `Saved setup snapshot (${mmLoc}/${yyLoc})` });
                  } catch (e) {
                    addToast({ type: 'error', title: 'Snapshot failed', message: e instanceof Error ? e.message : 'Unknown error' });
                  } finally {
                    setSnapshotSaving(false);
                    setShowSnapshotExplain(false);
                  }
                }}
                style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                {snapshotSaving ? 'Saving…' : 'Save Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Removed FieldButton placeholder component in favor of free text areas.

function FieldInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  // Detect debug mode via global window (safe on client)
  const debugActive = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).has('debug') : false;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        padding: '14px 16px 18px',
        background: 'rgba(0,0,0,0.25)',
        border: debugActive ? '2px solid #0f0' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10,
        minHeight: 80,
        color: '#eee',
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1.3,
        whiteSpace: 'normal',
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 3
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

// Generic setup for non-guitar/amp/drum kinds (live, studio, orchestral, piano, control, dj, vocal, synthzone)
function GenericSetupFields({ gear }: { gear: GearDoc }) {
  const [activeSnapshot, setActiveSnapshot] = useState<GearSetupSnapshot | null>(null);
  const hasSnapshotParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).has('snapshot') : false;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const snapshotDate = new URLSearchParams(window.location.search).get('snapshot');
    if (snapshotDate && Array.isArray(gear.snapshots)) {
      const found = gear.snapshots.find(s => String(s.savedAt) === snapshotDate);
      setActiveSnapshot(found || null);
    }
  }, [gear.snapshots]);
  const snapshotMode = hasSnapshotParam && Boolean(activeSnapshot);

  const [nickname, setNickname] = useState<string>(gear.nickname || '');
  useEffect(() => { if (!snapshotMode) setNickname(gear.nickname || ''); }, [gear.nickname, snapshotMode]);
  // Free text notes for generic rooms
  const [genericNotes, setGenericNotes] = useState<string>(gear.notes || '');
  useEffect(() => { if (!snapshotMode) setGenericNotes(gear.notes || ''); }, [gear.notes, snapshotMode]);
  const [showSnapshotExplain, setShowSnapshotExplain] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  // Open modal via custom event from under-image button (no URL mutation)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setShowSnapshotExplain(true);
    window.addEventListener('openGearSnapshot', handler as EventListener);
    return () => window.removeEventListener('openGearSnapshot', handler as EventListener);
  }, []);

  const initialYear = (gear && 'specs' in gear ? (gear as { specs?: { year?: number } }).specs?.year : undefined);
  const [yearState, setYearState] = useState<number | ''>(initialYear ?? '');
  useEffect(() => {
    if (!snapshotMode) {
      const y = (gear && 'specs' in gear ? (gear as { specs?: { year?: number } }).specs?.year : undefined);
      setYearState(y ?? '');
    }
  }, [gear, snapshotMode]);

  return (
    <div
      style={{
        width: '92vw',
        maxWidth: 1400,
        margin: '220px auto 90px',
        padding: '0 12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 16,
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 2
      }}
    >
      {/* Open snapshot modal when URL contains openSnapshot=1 (initial and on popstate) */}
      {(() => null)()}
      {snapshotMode && activeSnapshot && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', margin: '0 0 28px 0', position: 'relative' }}>
          <div style={{ fontSize: 48, color: '#b00', fontWeight: 900, letterSpacing: 2 }}>{activeSnapshot.monthYear}</div>
          <div style={{ fontSize: 18, color: '#444', marginTop: 8 }}>Historic setup snapshot (read-only)</div>
          <button type="button" onClick={() => { if (gear.id) window.location.href = `/gear/${gear.id}`; }} style={{ position: 'absolute', top: 4, right: 4, background: '#444', color: '#fff', border: '1px solid #555', padding: '6px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer' }}>Exit snapshot view</button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Nickname</span>
        <input
          type="text"
          value={nickname}
          disabled={snapshotMode}
          onChange={e => setNickname(e.target.value)}
          onBlur={async () => {
            if (snapshotMode || !gear.id) return;
            const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); const trimmed = nickname.trim(); await updateDoc(ref, { nickname: trimmed || null, friendlyName: trimmed || null }); gear.nickname = trimmed || undefined; } catch (err) { console.error('Nickname save failed', err); }
          }}
          placeholder="e.g. 'Main Rig', 'Studio Piece'"
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
        />
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Age (year)</span>
        {(() => {
          const currentYear = new Date().getFullYear();
          const years = Array.from({ length: currentYear - 1899 }, (_, i) => 1900 + i);
          return (
            <select
              style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
              value={yearState}
              disabled={snapshotMode}
              onChange={async (e) => {
                const val = e.target.value ? Number(e.target.value) : '';
                setYearState(val);
                if (gear.id) {
                  const db = getDb(); if (!db) return;
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const ref = doc(db, 'gear', gear.id);
                  await updateDoc(ref, { ['specs.year']: val === '' ? null : val });
                  // Rely on Firestore subscription to refresh local gear state
                }
              }}
            >
              <option value="">—</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          );
        })()}
      </div>

      {/* Advanced / settings free text for generic rooms */}
      <div style={{ gridColumn: '1 / -1' }} className={itemStyles.advancedBox}>
        <span className={itemStyles.advancedLabel}>Advanced / settings</span>
        <textarea
          value={genericNotes}
          onChange={e => setGenericNotes(e.target.value)}
          onBlur={async () => {
            if (!gear.id) return;
            const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { notes: genericNotes || null }); gear.notes = genericNotes || undefined; } catch (err) { console.error('Advanced/settings save failed', err); }
          }}
          placeholder="Technical settings, patch notes, chain details…"
          className={itemStyles.advancedTextarea}
        />
      </div>

      {!snapshotMode && (
        <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowSnapshotExplain(true)}
            style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '10px 18px', fontSize: 14, borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 3px 12px rgba(0,0,0,0.35)' }}
          >Save snapshot to archive</button>
        </div>
      )}
      {showSnapshotExplain && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', color: '#fff', padding: '28px 32px', borderRadius: 16, width: 'min(460px,90vw)', display: 'grid', gap: 18, boxShadow: '0 4px 28px rgba(0,0,0,0.45)' }}>
            <h4 style={{ margin: 0, fontSize: 20 }}>Archive Setup Snapshot</h4>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              Save current nickname and notes into the archive. Values remain for ongoing editing.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSnapshotExplain(false)}
                style={{ background: '#444', color: '#fff', border: '1px solid #555', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
              >Cancel</button>
              <button
                type="button"
                disabled={snapshotSaving}
                onClick={async () => {
                  if (!gear.id) return;
                  setSnapshotSaving(true);
                  try {
                    const { saveSetupSnapshot } = await import('@/lib/snapshots');
                    const { snapshot, updatedNotes } = await saveSetupSnapshot(gear.id, {
                      notes: genericNotes,
                      nickname,
                    });
                    gear.snapshots = Array.isArray(gear.snapshots) ? [...gear.snapshots, snapshot] : [snapshot];
                    gear.notes = updatedNotes;
                    setGenericNotes(updatedNotes);
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.set('snapshot', String(snapshot.savedAt));
                      window.history.replaceState({}, '', url.toString());
                    }
                    const mm = String(new Date(snapshot.savedAt).getMonth() + 1).padStart(2, '0');
                    const yy = String(new Date(snapshot.savedAt).getFullYear()).slice(-2);
                    const { addToast } = await import('@/contexts/ToastContext').then(m => ({ addToast: m.useToast().addToast }));
                    // Fallback toast access pattern; if unavailable, ignore
                    try { addToast({ type: 'success', title: 'Snapshot saved', message: `Saved setup snapshot (${mm}/${yy})` }); } catch {}
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    try { const { addToast } = await import('@/contexts/ToastContext').then(m => ({ addToast: m.useToast().addToast })); addToast({ type: 'error', title: 'Snapshot failed', message: msg }); } catch {}
                  } finally {
                    setSnapshotSaving(false);
                    setShowSnapshotExplain(false);
                  }
                }}
                style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >{snapshotSaving ? 'Saving…' : 'Save Snapshot'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Drum-specific setup component
function DrumSetupFields({ gear }: { gear: GearDoc }) {
  const [activeSnapshot, setActiveSnapshot] = useState<GearSetupSnapshot | null>(null);
  const hasSnapshotParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).has('snapshot') : false;
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const snapshotDate = new URLSearchParams(window.location.search).get('snapshot');
    if (snapshotDate && Array.isArray(gear.snapshots)) {
      const found = gear.snapshots.find(s => String(s.savedAt) === snapshotDate);
      setActiveSnapshot(found || null);
    }
  }, [gear.snapshots]);
  const snapshotMode = hasSnapshotParam && Boolean(activeSnapshot);

  // Editable fields
  const [nickname, setNickname] = useState<string>(gear.nickname || '');
  const [headDetails, setHeadDetails] = useState<string>(gear.drumHeadDetails || '');
  const [headTension, setHeadTension] = useState<string>(gear.drumHeadTension || '');
  const [headChangeDate, setHeadChangeDate] = useState<string>(gear.drumHeadChangeDate || '');
  const [headChangeDateError, setHeadChangeDateError] = useState<string>('');
  const [bodyInfo, setBodyInfo] = useState<string>(gear.drumBody || '');
  const [modsMuffles, setModsMuffles] = useState<string>(gear.drumModsMuffles || '');
  const [notesEdit, setNotesEdit] = useState<string>(gear.notes || '');
  const [drumPieces, setDrumPieces] = useState<Array<{ id: string; pieceType?: string; headDetails?: string; headTension?: string; headChangeDate?: string; body?: string; modsMuffles?: string }>>(
    Array.isArray(gear.drumPieces) ? gear.drumPieces : []
  );
  const [cymbalPieces, setCymbalPieces] = useState<Array<{ id: string; cymbalType?: string; brandModel?: string; diameter?: string; changeDate?: string; notes?: string }>>(
    Array.isArray(gear.cymbalPieces) ? gear.cymbalPieces : []
  );
  const { addToast } = useToast();
  const [showSnapshotExplain, setShowSnapshotExplain] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);

  // Age (year) state for drums
  const drumInitialYear = (gear && 'specs' in gear ? (gear as { specs?: { year?: number } }).specs?.year : undefined);
  const [drumYear, setDrumYear] = useState<number | ''>(drumInitialYear ?? '');
  useEffect(() => {
    if (!snapshotMode) {
      const y = (gear && 'specs' in gear ? (gear as { specs?: { year?: number } }).specs?.year : undefined);
      setDrumYear(y ?? '');
    }
  }, [gear, snapshotMode]);

  useEffect(() => {
    if (!snapshotMode) {
      setNickname(gear.nickname || '');
      setHeadDetails(gear.drumHeadDetails || '');
      setHeadTension(gear.drumHeadTension || '');
      setHeadChangeDate(gear.drumHeadChangeDate || '');
      setBodyInfo(gear.drumBody || '');
      setModsMuffles(gear.drumModsMuffles || '');
      setNotesEdit(gear.notes || '');
      setDrumPieces(Array.isArray(gear.drumPieces) ? gear.drumPieces : []);
      setCymbalPieces(Array.isArray(gear.cymbalPieces) ? gear.cymbalPieces : []);
    }
  }, [gear.nickname, gear.drumHeadDetails, gear.drumHeadTension, gear.drumHeadChangeDate, gear.drumBody, gear.drumModsMuffles, gear.notes, gear.drumPieces, gear.cymbalPieces, snapshotMode]);

  function autocompleteDate(val: string): string {
    let digits = val.replace(/[^\d]/g, '');
    if (digits.length === 5) digits = '0' + digits;
    if (digits.length === 3) digits = '0' + digits;
    if (digits.length === 4) {
      const year = String(new Date().getFullYear()).slice(-2);
      digits += year;
    }
    if (digits.length === 6 || digits.length === 8) {
      let day = parseInt(digits.slice(0, 2), 10);
      let month = parseInt(digits.slice(2, 4), 10);
      let year = digits.slice(4);
      if (day > 31 && month <= 12) [day, month] = [month, day];
      if (month > 12 && day <= 31) [day, month] = [month, day];
      day = Math.max(1, Math.min(day, 31));
      month = Math.max(1, Math.min(month, 12));
      if (year.length === 2) year = '20' + year;
      return `${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}`;
    }
    return digits;
  }
  function formatDate(val: string): string {
    const digits = val.replace(/[^\d]/g, '');
    if (digits.length === 8) return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
    return val;
  }
  function validateDate(val: string) {
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

  async function saveDrumPieces() {
    if (snapshotMode || !gear.id) return;
    const db = getDb(); if (!db) return;
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const ref = doc(db, 'gear', gear.id);
      // Sanitize pieces (remove empty objects)
      const cleaned = drumPieces.map(p => ({
        id: p.id,
        pieceType: p.pieceType || null,
        headDetails: p.headDetails || null,
        headTension: p.headTension || null,
        headChangeDate: p.headChangeDate || null,
        body: p.body || null,
        modsMuffles: p.modsMuffles || null,
      }));
      await updateDoc(ref, { drumPieces: cleaned });
      gear.drumPieces = cleaned as DrumPieceSetup[];
    } catch (err) { console.error('Drum pieces save failed', err); }
  }

  async function saveCymbalPieces() {
    if (snapshotMode || !gear.id) return;
    const db = getDb(); if (!db) return;
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const ref = doc(db, 'gear', gear.id);
      const cleaned = cymbalPieces.map(c => ({
        id: c.id,
        cymbalType: c.cymbalType || null,
        brandModel: c.brandModel || null,
        diameter: c.diameter || null,
        changeDate: c.changeDate || null,
        notes: c.notes || null,
      }));
      await updateDoc(ref, { cymbalPieces: cleaned });
      gear.cymbalPieces = cleaned as CymbalPieceSetup[];
    } catch (err) { console.error('Cymbal pieces save failed', err); }
  }

  return (
    <div
      style={{
        width: '92vw',
        maxWidth: 1400,
        margin: '220px auto 90px',
        padding: '0 12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 16,
        alignItems: 'stretch',
        position: 'relative',
        zIndex: 2
      }}
    >
      {snapshotMode && activeSnapshot && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', margin: '0 0 28px 0', position: 'relative' }}>
          <div style={{ fontSize: 48, color: '#b00', fontWeight: 900, letterSpacing: 2 }}>{activeSnapshot.monthYear}</div>
          <div style={{ fontSize: 18, color: '#444', marginTop: 8 }}>Historic drum setup snapshot (read-only)</div>
          <button
            type="button"
            onClick={() => { if (gear.id) window.location.href = `/gear/${gear.id}`; }}
            style={{ position: 'absolute', top: 4, right: 4, background: '#444', color: '#fff', border: '1px solid #555', padding: '6px 12px', fontSize: 12, borderRadius: 6, cursor: 'pointer' }}
          >Exit snapshot view</button>
        </div>
      )}
      {/* Nickname */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Nickname</span>
        <input
          type="text"
          value={nickname}
          disabled={snapshotMode}
          onChange={e => setNickname(e.target.value)}
          onBlur={async () => {
            if (snapshotMode || !gear.id) return;
            const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); const trimmed = nickname.trim(); await updateDoc(ref, { nickname: trimmed || null, friendlyName: trimmed || null }); gear.nickname = trimmed || undefined; } catch (err) { console.error('Nickname save failed', err); }
          }}
          placeholder="e.g. 'Kick A', 'Studio Snare'"
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
        />
      </div>
      {/* Age (year) */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Age (year)</span>
        {(() => {
          const currentYear = new Date().getFullYear();
          const years = Array.from({ length: currentYear - 1899 }, (_, i) => 1900 + i);
          return (
            <select
              style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
              value={drumYear}
              disabled={snapshotMode}
              onChange={async (e) => {
                const val = e.target.value ? Number(e.target.value) : '';
                setDrumYear(val);
                if (gear.id) {
                  const db = getDb(); if (!db) return;
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const ref = doc(db, 'gear', gear.id);
                  await updateDoc(ref, { ['specs.year']: val === '' ? null : val });
                  // Rely on Firestore subscription to refresh local gear state
                }
              }}
            >
              <option value="">—</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          );
        })()}
      </div>
      {/* Head details */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Head details</span>
        <input
          type="text"
          value={headDetails}
          disabled={snapshotMode}
          onChange={e => setHeadDetails(e.target.value)}
          onBlur={async () => {
            if (snapshotMode || !gear.id) return; const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { drumHeadDetails: headDetails.trim() || null }); gear.drumHeadDetails = headDetails.trim() || undefined; } catch (err) { console.error('Head details save failed', err); }
          }}
          placeholder="Batter: Remo Emperor | Reso: Ambassador"
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
        />
      </div>
      {/* Head tension/tuning */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Head tension / tuning</span>
        <input
          type="text"
          value={headTension}
          disabled={snapshotMode}
          onChange={e => setHeadTension(e.target.value)}
          onBlur={async () => {
            if (snapshotMode || !gear.id) return; const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { drumHeadTension: headTension.trim() || null }); gear.drumHeadTension = headTension.trim() || undefined; } catch (err) { console.error('Head tension save failed', err); }
          }}
          placeholder="Top: 85 | Bottom: 75 (DrumDial)"
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
        />
      </div>
      {/* Head change date */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Head change date</span>
        <input
          type="text"
          value={formatDate(headChangeDate)}
          disabled={snapshotMode}
          onChange={e => {
            const auto = autocompleteDate(e.target.value); setHeadChangeDate(auto); setHeadChangeDateError(validateDate(auto));
          }}
          onBlur={async () => {
            if (snapshotMode || !gear.id) return; const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { drumHeadChangeDate: headChangeDate || null }); gear.drumHeadChangeDate = headChangeDate || undefined; } catch (err) { console.error('Head change date save failed', err); }
          }}
          placeholder="ddmmyy or ddmmyyyy"
          style={{ padding: '8px 10px', border: headChangeDateError ? '1px solid #c00' : '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
          maxLength={10}
        />
        {headChangeDateError && <small style={{ color: '#c00' }}>{headChangeDateError}</small>}
      </div>
      {/* Body info */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Body</span>
        <input
          type="text"
          value={bodyInfo}
          disabled={snapshotMode}
          onChange={e => setBodyInfo(e.target.value)}
          onBlur={async () => {
            if (snapshotMode || !gear.id) return; const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { drumBody: bodyInfo.trim() || null }); gear.drumBody = bodyInfo.trim() || undefined; } catch (err) { console.error('Body save failed', err); }
          }}
          placeholder="Maple 14x5.5 Snare"
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
        />
      </div>
      {/* Mods / muffles */}
      <div style={{ display: 'grid', gap: 6 }}>
        <span className="setup-label">Mods / muffles</span>
        <input
          type="text"
          value={modsMuffles}
          disabled={snapshotMode}
          onChange={e => setModsMuffles(e.target.value)}
          onBlur={async () => {
            if (snapshotMode || !gear.id) return; const db = getDb(); if (!db) return;
            try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { drumModsMuffles: modsMuffles.trim() || null }); gear.drumModsMuffles = modsMuffles.trim() || undefined; } catch (err) { console.error('Mods/muffles save failed', err); }
          }}
          placeholder="MoonGel 2x | Snare wires swapped"
          style={{ padding: '8px 10px', border: '1px solid #444', borderRadius: 8, background: '#222', color: '#fff' }}
        />
      </div>
      {/* Drum pieces list */}
      <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 12, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 16px' }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', opacity: .7 }}>Drum Pieces</span>
        {drumPieces.length === 0 && <div style={{ fontSize: 13, opacity: .6 }}>No pieces added yet.</div>}
        {drumPieces.map((p) => (
          <div key={p.id} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', background: 'rgba(0,0,0,0.18)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.10)' }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Type</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={p.pieceType || ''}
                onChange={e => {
                  const val = e.target.value; setDrumPieces(cur => cur.map(cp => cp.id === p.id ? { ...cp, pieceType: val } : cp));
                }}
                onBlur={async () => { if (snapshotMode) return; await saveDrumPieces(); }}
                placeholder="Snare / Kick / Tom"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Head details</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={p.headDetails || ''}
                onChange={e => { const val = e.target.value; setDrumPieces(cur => cur.map(cp => cp.id === p.id ? { ...cp, headDetails: val } : cp)); }}
                onBlur={async () => { if (snapshotMode) return; await saveDrumPieces(); }}
                placeholder="Batter/Reso"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Tension</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={p.headTension || ''}
                onChange={e => { const val = e.target.value; setDrumPieces(cur => cur.map(cp => cp.id === p.id ? { ...cp, headTension: val } : cp)); }}
                onBlur={async () => { if (snapshotMode) return; await saveDrumPieces(); }}
                placeholder="Top/Bottom values"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Change date</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={formatDate(p.headChangeDate || '')}
                onChange={e => {
                  const raw = e.target.value; const auto = autocompleteDate(raw); setDrumPieces(cur => cur.map(cp => cp.id === p.id ? { ...cp, headChangeDate: auto } : cp));
                }}
                onBlur={async () => { if (snapshotMode) return; await saveDrumPieces(); }}
                placeholder="ddmmyy"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Body</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={p.body || ''}
                onChange={e => { const val = e.target.value; setDrumPieces(cur => cur.map(cp => cp.id === p.id ? { ...cp, body: val } : cp)); }}
                onBlur={async () => { if (snapshotMode) return; await saveDrumPieces(); }}
                placeholder="Shell/depth"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Mods/Muffles</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={p.modsMuffles || ''}
                onChange={e => { const val = e.target.value; setDrumPieces(cur => cur.map(cp => cp.id === p.id ? { ...cp, modsMuffles: val } : cp)); }}
                onBlur={async () => { if (snapshotMode) return; await saveDrumPieces(); }}
                placeholder="Gels, rings..."
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            {!snapshotMode && (
              <button
                type="button"
                onClick={async () => {
                  setDrumPieces(cur => cur.filter(cp => cp.id !== p.id));
                  await saveDrumPieces();
                }}
                style={{ alignSelf: 'flex-start', background: '#b00', color: '#fff', border: '1px solid #900', padding: '6px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer', height: 'fit-content' }}
              >Remove</button>
            )}
          </div>
        ))}
        {!snapshotMode && (
          <button
            type="button"
            onClick={async () => {
              const newPiece = { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random()}`), pieceType: '', headDetails: '', headTension: '', headChangeDate: '', body: '', modsMuffles: '' };
              setDrumPieces(cur => [...cur, newPiece]);
              await saveDrumPieces();
            }}
            style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '8px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.35)', justifySelf: 'start' }}
          >Add Piece</button>
        )}
      </div>
      {/* Cymbal pieces list */}
      <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 12, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '14px 16px' }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', opacity: .7 }}>Cymbals</span>
        {cymbalPieces.length === 0 && <div style={{ fontSize: 13, opacity: .6 }}>No cymbals added yet.</div>}
        {cymbalPieces.map(c => (
          <div key={c.id} style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', background: 'rgba(0,0,0,0.18)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.10)' }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Type</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={c.cymbalType || ''}
                onChange={e => setCymbalPieces(cur => cur.map(cc => cc.id === c.id ? { ...cc, cymbalType: e.target.value } : cc))}
                onBlur={async () => { if (snapshotMode) return; await saveCymbalPieces(); }}
                placeholder="Ride / Crash / Hi-hat top"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Brand + Model</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={c.brandModel || ''}
                onChange={e => setCymbalPieces(cur => cur.map(cc => cc.id === c.id ? { ...cc, brandModel: e.target.value } : cc))}
                onBlur={async () => { if (snapshotMode) return; await saveCymbalPieces(); }}
                placeholder="Zildjian K Custom"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Diameter</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={c.diameter || ''}
                onChange={e => setCymbalPieces(cur => cur.map(cc => cc.id === c.id ? { ...cc, diameter: e.target.value } : cc))}
                onBlur={async () => { if (snapshotMode) return; await saveCymbalPieces(); }}
                placeholder='20"'
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Change date</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={formatDate(c.changeDate || '')}
                onChange={e => {
                  const auto = autocompleteDate(e.target.value);
                  setCymbalPieces(cur => cur.map(cc => cc.id === c.id ? { ...cc, changeDate: auto } : cc));
                }}
                onBlur={async () => { if (snapshotMode) return; await saveCymbalPieces(); }}
                placeholder="ddmmyy"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: .6 }}>Notes</span>
              <input
                type="text"
                disabled={snapshotMode}
                value={c.notes || ''}
                onChange={e => setCymbalPieces(cur => cur.map(cc => cc.id === c.id ? { ...cc, notes: e.target.value } : cc))}
                onBlur={async () => { if (snapshotMode) return; await saveCymbalPieces(); }}
                placeholder="Edge ding / tape patch"
                style={{ padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#222', color: '#fff', fontSize: 13 }}
              />
            </div>
            {!snapshotMode && (
              <button
                type="button"
                onClick={async () => { setCymbalPieces(cur => cur.filter(cc => cc.id !== c.id)); await saveCymbalPieces(); }}
                style={{ alignSelf: 'flex-start', background: '#b00', color: '#fff', border: '1px solid #900', padding: '6px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer', height: 'fit-content' }}
              >Remove</button>
            )}
          </div>
        ))}
        {!snapshotMode && (
          <button
            type="button"
            onClick={async () => {
              const newCymbal = { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random()}`), cymbalType: '', brandModel: '', diameter: '', changeDate: '', notes: '' };
              setCymbalPieces(cur => [...cur, newCymbal]);
              await saveCymbalPieces();
            }}
            style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '8px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.35)', justifySelf: 'start' }}
          >Add Cymbal</button>
        )}
      </div>
      {/* Notes */}
      {!snapshotMode && (
        <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 10 }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '14px 16px 12px', color: '#eee' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Notes (editable)</span>
            <textarea
              value={notesEdit}
              onChange={e => setNotesEdit(e.target.value)}
              onBlur={async () => {
                if (!gear.id) return; const db = getDb(); if (!db) return;
                try { const { doc, updateDoc } = await import('firebase/firestore'); const ref = doc(db, 'gear', gear.id); await updateDoc(ref, { notes: notesEdit || null }); gear.notes = notesEdit || undefined; } catch (err) { console.error('Notes save failed', err); }
              }}
              placeholder="Session notes, mic placement, etc..."
              style={{ marginTop: 6, width: '100%', minHeight: 140, resize: 'vertical', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.4, outline: 'none' }}
            />
            {/* Removed instructional helper text per request */}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '12px 14px 16px', color: '#eee', fontSize: 14, lineHeight: 1.3, whiteSpace: 'pre-wrap' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.65 }}>Preview</span>
            <div style={{ fontSize: 15, fontWeight: 600, opacity: !notesEdit ? 0.45 : 0.95, marginTop: 6 }}>{renderNotesWithSnapshots(notesEdit, gear)}</div>
          </div>
        </div>
      )}
      {/* Snapshot button */}
      {!snapshotMode && (
        <div style={{ position: 'fixed', bottom: 18, right: 18, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowSnapshotExplain(true)}
            style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '10px 18px', fontSize: 14, borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 3px 12px rgba(0,0,0,0.35)' }}
          >Save snapshot to archive</button>
        </div>
      )}
      {showSnapshotExplain && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#222', color: '#fff', padding: '28px 32px', borderRadius: 16, width: 'min(460px,90vw)', display: 'grid', gap: 18, boxShadow: '0 4px 28px rgba(0,0,0,0.45)' }}>
            <h4 style={{ margin: 0, fontSize: 20 }}>Archive Drum Setup Snapshot</h4>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>Save current head details, tension, head change date, body, mods/muffles, nickname and notes. A marker will be appended to notes.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowSnapshotExplain(false)} style={{ background: '#444', color: '#fff', border: '1px solid #555', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button
                type="button"
                disabled={snapshotSaving}
                onClick={async () => {
                  if (!gear.id) return; setSnapshotSaving(true);
                  try {
                    const now = new Date();
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const yy = String(now.getFullYear()).slice(-2);
                    const monthYear = `${mm}/${yy}`;
                    const snapshot: (Partial<GearSetupSnapshot> & { savedAt: number; monthYear: string }) = { savedAt: now.getTime(), monthYear };
                    if (nickname.trim()) snapshot.nickname = nickname.trim();
                    if (headDetails.trim()) snapshot.drumHeadDetails = headDetails.trim();
                    if (headTension.trim()) snapshot.drumHeadTension = headTension.trim();
                    if (headChangeDate) snapshot.drumHeadChangeDate = headChangeDate;
                    if (bodyInfo.trim()) snapshot.drumBody = bodyInfo.trim();
                    if (modsMuffles.trim()) snapshot.drumModsMuffles = modsMuffles.trim();
                    if (notesEdit) snapshot.notes = notesEdit;
                    if (Array.isArray(drumPieces) && drumPieces.length) snapshot.drumPieces = drumPieces.map(p => ({ ...p }));
                    if (Array.isArray(cymbalPieces) && cymbalPieces.length) snapshot.cymbalPieces = cymbalPieces.map(c => ({ ...c }));
                    const db = getDb(); if (db) {
                      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
                      const ref = doc(db, 'gear', gear.id);
                      const existingSnap = await getDoc(ref);
                      const data = existingSnap.exists() ? existingSnap.data() : {};
                      const existingSnapshots = Array.isArray(data.snapshots) ? data.snapshots : [];
                      const baseNotes = (data.notes || notesEdit || '').trim();
                      const updatedNotes = (baseNotes ? baseNotes + '\n' : '') + `--Snapshot ${monthYear}--`;
                      await updateDoc(ref, { snapshots: [...existingSnapshots, snapshot], notes: updatedNotes });
                      gear.snapshots = [...existingSnapshots, snapshot]; gear.notes = updatedNotes;
                    }
                    addToast({ type: 'success', title: 'Snapshot saved', message: `Saved drum snapshot (${monthYear})` });
                  } catch (e) {
                    addToast({ type: 'error', title: 'Snapshot failed', message: e instanceof Error ? e.message : 'Unknown error' });
                  } finally { setSnapshotSaving(false); setShowSnapshotExplain(false); }
                }}
                style={{ background: '#2563eb', color: '#fff', border: '1px solid #144c99', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >{snapshotSaving ? 'Saving…' : 'Save Snapshot'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
