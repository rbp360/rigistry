'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { GearDoc } from '@/types/schema';
import { listDeletedGearByOwner, permanentlyDeleteGearItem, restoreGearItem } from '@/lib/db';

export default function DeletedItemsManager() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<GearDoc[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const rows = await listDeletedGearByOwner(user.uid);
        setItems(rows);
      } catch (e) {
        console.error('Failed to load deleted items', e);
        addToast({ type: 'error', title: 'Error', message: 'Failed to load deleted items.' });
      }
    })();
  }, [user, addToast]);

  const allSelected = useMemo(() => items.length > 0 && items.every(i => selected.has(i.id!)), [items, selected]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(prev => {
      if (items.length === 0) return new Set();
      if (prev.size === items.length) return new Set();
      return new Set(items.map(i => i.id!));
    });
  }

  async function handleRestoreSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const ids = Array.from(selected);
      let okCount = 0;
      for (const id of ids) {
        const ok = await restoreGearItem(id);
        if (ok) okCount++;
      }
      setItems(prev => prev.filter(i => !selected.has(i.id!)));
      setSelected(new Set());
      addToast({ type: 'success', title: 'Restored', message: `Restored ${okCount} item(s).` });
    } catch (e) {
      console.error('Restore failed', e);
      addToast({ type: 'error', title: 'Error', message: 'Failed to restore one or more items.' });
    } finally {
      setBusy(false);
    }
  }

  async function handlePermanentDeleteSelected() {
    if (selected.size === 0) return;
    if (!window.confirm('Permanently delete selected item(s)? This cannot be undone.')) return;
    setBusy(true);
    try {
      const ids = Array.from(selected);
      let okCount = 0;
      for (const id of ids) {
        const ok = await permanentlyDeleteGearItem(id);
        if (ok) okCount++;
      }
      setItems(prev => prev.filter(i => !selected.has(i.id!)));
      setSelected(new Set());
      addToast({ type: 'success', title: 'Deleted', message: `Permanently deleted ${okCount} item(s).` });
    } catch (e) {
      console.error('Permanent delete failed', e);
      addToast({ type: 'error', title: 'Error', message: 'Failed to permanently delete one or more items.' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Sign in to manage deleted items.</div>;

  return (
    <div>
      {items.length === 0 ? (
        <div style={{ opacity: 0.8 }}>No deleted items.</div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <button onClick={toggleAll} disabled={busy}>
              {allSelected ? 'Clear selection' : 'Select all'}
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={handleRestoreSelected} disabled={busy || selected.size === 0}>
              Restore selected
            </button>
            <button onClick={handlePermanentDeleteSelected} disabled={busy || selected.size === 0} style={{ marginLeft: 8, background: '#b91c1c', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 4 }}>
              Permanently delete selected
            </button>
          </div>
          <div style={{ border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111' }}>
                  <th style={{ textAlign: 'left', padding: 8, width: 40 }}></th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Item</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Kind</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Brand/Model</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Nickname / Serial</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} style={{ borderTop: '1px solid #333' }}>
                    <td style={{ padding: 8 }}>
                      <input
                        type="checkbox"
                        checked={selected.has(it.id!)}
                        onChange={() => toggle(it.id!)}
                        disabled={busy}
                        aria-label={`Select ${it.nickname ?? it.serialNumber ?? it.model ?? it.id}`}
                      />
                    </td>
                    <td style={{ padding: 8 }}>
                      <div style={{ fontWeight: 700 }}>{it.nickname || it.serialNumber || it.model || 'Untitled'}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{it.id}</div>
                    </td>
                    <td style={{ padding: 8 }}>{it.kind}</td>
                    <td style={{ padding: 8 }}>{[it.brand, it.model].filter(Boolean).join(' ') || '—'}</td>
                    <td style={{ padding: 8 }}>
                      {it.nickname ? <span style={{ fontWeight: 600 }}>{it.nickname}</span> : null}
                      {it.nickname && it.serialNumber ? ' · ' : null}
                      {it.serialNumber ? <span style={{ opacity: 0.9 }}>{it.serialNumber}</span> : (!it.nickname ? '—' : null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
