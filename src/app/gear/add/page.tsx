'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import type { GearDoc, GearKind, GearCategory, CatalogSourceMeta } from '@/types/schema';
import { GEAR_ADD_CATEGORIES } from '@/types/schema';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import { createGearItem } from '@/lib/db';
import { fetchStockImageForBrandModel } from '@/lib/reverb';
import KindDetailAutocomplete from '@/components/KindDetailAutocomplete';
import { useToast } from '@/contexts/ToastContext';

// Use the 20 product categories for kind selection in Add Gear
const kinds = GEAR_ADD_CATEGORIES;

export default function AddGearPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<GearDoc>>({ kind: 'guitar' });
  const [saving, setSaving] = useState(false);
  const [fetchingImage, setFetchingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { addToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setMessage('Please sign in to add gear');
      return;
    }
    if (!form.kind) {
      setMessage('Please select a gear kind');
      return;
    }
    setSaving(true);
    try {
      const saved = await createGearItem({
        ownerId: user.uid,
        kind: form.kind as GearKind,
        kindDetail: form.kindDetail?.trim() || undefined,
        brand: form.brand?.trim() || undefined,
        model: form.model?.trim() || undefined,
        serialNumber: form.serialNumber?.trim() || undefined,
        color: form.color?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
      });
      if (saved) {
        setMessage('Gear saved!');
        addToast({ type: 'success', title: 'Gear Added', message: `${saved.brand || 'Gear'} ${saved.model || ''} created.` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save gear';
      setMessage(msg);
      addToast({ type: 'error', title: 'Save Failed', message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-tungstern)' }}>Add Gear</h1>
      <p>Add an instrument or accessory to your collection.</p>

      {!user && (
        <p style={{ color: 'crimson' }}>You must sign in to add gear.</p>
      )}

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Kind</span>
          <select
            value={(form.kind as string) || 'guitar'}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as GearCategory }))}
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          >
            {kinds.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Kind detail</span>
          <KindDetailAutocomplete
            value={form.kindDetail ?? ''}
            kind={form.kind as GearCategory}
            onChange={(v) => setForm((f) => ({ ...f, kindDetail: v }))}
            placeholder="Start typing (auto-suggest)…"
          />
          <small style={{ opacity: 0.7 }}>Auto-suggests instruments; choose or keep custom text.</small>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Brand</span>
          <input
            type="text"
            value={form.brand ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            placeholder="Fender, Gibson, Boss…"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Model</span>
          <input
            type="text"
            value={form.model ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            placeholder="Stratocaster, Les Paul…"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Serial number</span>
          <input
            type="text"
            value={form.serialNumber ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
            placeholder="Optional (helps for insurance)"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
          />
        </label>
        {(form.kindDetail || form.model) && (
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Color / finish</span>
            <input
              type="text"
              value={form.color ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              placeholder="Sunburst, black, cherry red…"
              style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
            />
          </label>
        )}

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Notes</span>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={4}
            placeholder="Strings, pickups, condition, setup details…"
            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, resize: 'vertical' }}
          />
        </label>

        <div style={{ display: 'grid', gap: 8 }}>
          <span>Photo (Cloudinary)</span>
          <CloudinaryUploader
            onUploaded={(r) => {
              setForm((f) => ({ ...f, imageUrl: r.secure_url || r.url || '' }));
              addToast({ type: 'success', message: 'Image uploaded', title: 'Upload Complete' });
            }}
          />
          {!form.imageUrl && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={fetchingImage || !form.brand || !form.model}
                onClick={async () => {
                  if (!form.brand || !form.model) return;
                  setFetchingImage(true);
                  const result = await fetchStockImageForBrandModel(form.brand, form.model, form.color);
                  if (result.url) {
                    const src: CatalogSourceMeta = {
                      source: 'reverb',
                      attribution: result.attribution ?? 'Stock image from Reverb.com',
                      licenseNote: 'Display-only stock image; not for redistribution.',
                    };
                    setForm(f => ({ ...f, imageUrl: result.url || undefined, catalogSource: src }));
                  }
                  setFetchingImage(false);
                }}
                style={{ background: '#222', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, border: '1px solid #333', cursor: 'pointer' }}
              >
                {fetchingImage ? 'Fetching image…' : 'Fetch Stock Image'}
              </button>
              <small style={{ alignSelf: 'center', opacity: 0.6 }}>Uses Reverb API; falls back to logo if no match.</small>
            </div>
          )}
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt="preview" style={{ maxWidth: 320, borderRadius: 8 }} />
          )}
          {form.catalogSource?.source === 'reverb' && (
            <div style={{ fontSize: 11, opacity: 0.7 }}>Stock image from Reverb.com</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={!user || saving} style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save gear'}
          </button>
          {message && <span>{message}</span>}
        </div>
      </form>
    </main>
  );
}
