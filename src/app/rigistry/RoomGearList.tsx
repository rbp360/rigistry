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
    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
      {gear.map(g => (
        <div key={g.id} style={{ position: 'relative' }}>
          <a href={`/gear/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={styles.gearCard} style={{ padding: 12, cursor: 'pointer', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              {(() => {
                const brandLogo = g.brand ? `/api/brand-logo?brand=${encodeURIComponent(g.brand)}` : null;
                const src = g.imageUrl || brandLogo || '/branding/logo1.png';
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={g.brand || 'Gear'}
                    width={120}
                    height={120}
                    style={{ borderRadius: 6, objectFit: 'contain', display: 'block', background: '#444', width: '100%', height: 120 }}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.src.endsWith('/branding/logo1.png')) {
                        img.src = '/branding/logo1.png';
                      }
                    }}
                  />
                );
              })()}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 700, color: '#22c55e' }}>
                  {g.nickname && <span>{g.nickname}</span>}
                  {g.serialNumber && <span>{g.nickname ? ' — ' : ''}{g.serialNumber}</span>}
                </div>
                <div style={{ fontWeight: 700 }}>
                  {g.brand || 'Unknown'} {g.model || ''}
                </div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>{g.kind}</div>
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
