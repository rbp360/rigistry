// Carnet page: view, select, and export gear across rooms
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { listGearByOwner } from '@/lib/db';
import type { GearDoc } from '@/types/schema';

export default function CarnetPage() {
  const { user } = useAuth();
  const [gear, setGear] = useState<GearDoc[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const items = await listGearByOwner(user.uid);
      setGear(items);
    })();
  }, [user]);

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function exportPDF() {
    // TODO: Implement PDF export logic
    alert('PDF export coming soon!');
  }

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-tungstern)' }}>Carnet</h1>
      <p>View and select gear from all rooms. Export your selection as a PDF for travel, insurance, or inventory.</p>
      {gear.length === 0 ? (
        <p>No gear found. Add instruments to your rooms first.</p>
      ) : (
        <form>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {gear.map((g) => (
              <label key={g.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input type="checkbox" checked={!!selected[g.id]} onChange={() => toggleSelect(g.id)} />
                <strong>{g.brand || 'Unknown'} {g.model || ''}</strong>
                <span style={{ fontSize: 13, opacity: 0.7 }}>{g.kind}</span>
                {g.imageUrl && <img src={g.imageUrl} alt={g.brand || 'Gear'} style={{ maxWidth: 120, borderRadius: 6 }} />}
              </label>
            ))}
          </div>
          <button type="button" onClick={exportPDF} style={{ marginTop: 24, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}>
            Export selected as PDF
          </button>
        </form>
      )}
    </main>
  );
}
