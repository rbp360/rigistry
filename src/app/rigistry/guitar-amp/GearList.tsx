// Lists gear in the Guitar/Amp room
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { listGearByOwner } from '@/lib/db';
import type { GearDoc } from '@/types/schema';
import Image from 'next/image';

export default function GuitarAmpGearList() {
  const { user } = useAuth();
  const [gear, setGear] = useState<GearDoc[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await listGearByOwner(user.uid);
      setGear(all.filter(g => g.room === 'guitar-amp'));
    })();
  }, [user]);

  if (!user) return <p>Sign in to view your gear.</p>;
  if (gear.length === 0) return <p>No gear in this room yet.</p>;

  return (
    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
      {gear.map(g => (
        <a key={g.id} href={`/gear/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#fafafa', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {g.imageUrl ? (
              <Image src={g.imageUrl} alt={g.brand || 'Gear'} width={120} height={120} style={{ borderRadius: 6 }} />
            ) : (
              <div style={{ width: 120, height: 120, background: '#eee', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>No image</div>
            )}
            <div style={{ marginTop: 8 }}>
              <strong>{g.brand || 'Unknown'} {g.model || ''}</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{g.kind}</div>
              {g.notes && <div style={{ fontSize: 13, marginTop: 4 }}>{g.notes}</div>}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
