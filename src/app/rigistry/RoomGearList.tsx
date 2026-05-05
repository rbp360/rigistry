// Universal gear list for any room, with delete/archive feature
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { listGearByOwner } from '@/lib/db';
import type { GearDoc, RoomKey } from '@/types/schema';
// import Image from 'next/image'; // no longer needed after normalization
import { useToast } from '@/contexts/ToastContext';
import styles from './Rigistry.module.css';
// Removed logo.dev fallback to keep image selection identical to gear detail view

export default function RoomGearList({ room }: { room: RoomKey }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [gear, setGear] = useState<GearDoc[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [kindDefaults, setKindDefaults] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/brand-defaults-by-kind.json', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setKindDefaults(data || {});
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await listGearByOwner(user.uid);
  // Only show items in this room that are NOT deleted
  setGear(all.filter(g => g.room === room && !g.deleted));
    })();
  }, [user, room]);

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete (archive) this gear? This action can be undone in admin.')) return;
    setBusyId(id);
    try {
      const { updateGearItem } = await import('@/lib/db');
      const result = await updateGearItem(id, { deleted: true });
      if (!result) {
        console.error('Failed to mark gear item for deletion:', id);
        addToast({ type: 'error', title: 'Error', message: 'Failed to mark gear for deletion.' });
        return;
      }
      setGear(prev => prev.filter(g => g.id !== id));
      addToast({ type: 'success', title: 'Deleted', message: 'Gear marked for deletion.' });
    } catch (err) {
      console.error('Delete handler error:', err);
      addToast({ type: 'error', title: 'Error', message: 'Failed to mark gear for deletion.' });
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return <p>Sign in to view your gear.</p>;
  if (gear.length === 0) return <p>No gear in this room yet.</p>;

  return (
    <div className={styles.gearGrid}>
      {gear.map(g => (
        <div key={g.id} className={styles.gearTile}>
          <a href={`/gear/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={styles.gearCard} style={{ padding: 12, cursor: 'pointer' }}>
              {(() => {
                // Remove brandLogo from fallback chain; only use saved imageUrl or static defaults
                const roomDefault = (() => {
                  switch (room) {
                    case 'guitar-amp': return '/branding/Guitar backdrop.png';
                    case 'control': return '/branding/Studio gear brand default.png';
                    case 'drum': return '/branding/Drum gear brand default.png';
                    case 'synthzone': return '/branding/Keyboard gear brand default.png';
                    case 'stage': return '/branding/Live gear brand default.png';
                    case 'dj-booth': return '/branding/DJbooth.png';
                    case 'orchestral-pit': return '/branding/Orchestra brand default.png';
                    default: return '/branding/logo1.png';
                  }
                })();
                const kindKey = String((g.kind as string) || '').trim().toLowerCase();
                const kindDefault = (kindKey && kindDefaults[kindKey]) ? kindDefaults[kindKey] : '';
                const detailKey = String((g.kindDetail as string) || '').trim().toLowerCase();
                const detailDefault = detailKey.includes('trumpet') ? (kindDefaults['brass'] || kindDefaults[kindKey] || '') : '';
                // Only use saved imageUrl or static defaults
                const src = g.imageUrl || detailDefault || kindDefault || roomDefault;
                if (process.env.NODE_ENV !== 'production') {
                  // Debug fallback selection for troubleshooting
                  console.debug('RoomGearList image select', {
                    id: g.id,
                    kind: g.kind,
                    kindDetail: g.kindDetail,
                    picked: src,
                    imageUrl: g.imageUrl,
                    detailDefault,
                    kindDefault,
                    roomDefault,
                  });
                }
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.gearCardImage}
                    src={src}
                    alt={g.brand || 'Gear'}
                    width={144}
                    height={82}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      // On error, prefer kind default then room default
                      const fallback = detailDefault || kindDefault || roomDefault;
                      if (!img.src.endsWith(fallback)) {
                        img.src = fallback;
                      }
                    }}
                  />
                );
              })()}
              <div className={styles.gearCardText}>
                <div className={styles.gearCardTitle}>
                  {g.nickname && <span>{g.nickname}</span>}
                  {g.serialNumber && <span>{g.nickname ? ' — ' : ''}{g.serialNumber}</span>}
                </div>
                <div className={styles.gearCardModel}>
                  {g.brand || 'Unknown'} {g.model || ''}
                </div>
                <div className={styles.gearCardKind}>{g.kind}</div>
                {/* Notes removed from room listing to hide snapshot markers */}
              </div>
            </div>
          </a>
          <button
            title="Delete"
            disabled={busyId === g.id}
            onClick={() => handleDelete(g.id!)}
            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span
              aria-label="Delete"
              style={{
                display: 'inline-block',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#c00',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
                lineHeight: '28px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
              }}
            >
              ×
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
