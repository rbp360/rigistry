'use client';
import { getDb } from '@/lib/firebase';
import type { GearDoc } from '@/types/schema';
import { useParams } from 'next/navigation';
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

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#222' }}>
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
      {/* Small top-left image (universal for all gear) */}
      {!loading && gear && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, background: 'rgba(0,0,0,0.35)', padding: 6, borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
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
