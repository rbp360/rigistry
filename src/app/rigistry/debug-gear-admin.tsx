// Debug/admin page to assign room to existing gear
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { listGearByOwner, updateGearItem } from '@/lib/db';
import type { GearDoc } from '@/types/schema';

export default function DebugGearAdmin() {
  const { user } = useAuth();
  const [gear, setGear] = useState<GearDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await listGearByOwner(user.uid);
      setGear(all);
    })();
  }, [user]);

  async function assignRoom(id: string, room: string) {
    setBusy(true);
    try {
      await updateGearItem(id, { room });
      setMessage(`Room updated for gear ${id}`);
      setGear(g => g.map(item => item.id === id ? { ...item, room } : item));
    } catch (err) {
      setMessage('Failed to update room');
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <p>Sign in to view gear.</p>;
  if (gear.length === 0) return <p>No gear found.</p>;

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1>Debug Gear Admin</h1>
      <p>Assign rooms to existing gear items.</p>
      {message && <div style={{ color: 'green', marginBottom: 12 }}>{message}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {gear.map(g => (
          <div key={g.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <strong>{g.brand || 'Unknown'} {g.model || ''}</strong>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{g.kind}</div>
            <div>Current room: {g.room || 'none'}</div>
            <button disabled={busy} style={{ marginTop: 8, background: '#222', color: '#fff', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }} onClick={() => assignRoom(g.id!, 'guitar-amp')}>
              Put in Guitar/Amp room
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
