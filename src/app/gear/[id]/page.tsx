'use client';
import { getDb } from '@/lib/firebase';
import { updateGearItem, archiveGearItem } from '@/lib/db';
import type { GearDoc, GearKind, GearCategory, CatalogSourceMeta } from '@/types/schema';
import { fetchStockImageForBrandModel } from '@/lib/reverb';
import KindDetailAutocomplete from '@/components/KindDetailAutocomplete';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CloudinaryUploader from '@/components/CloudinaryUploader';
import type { CloudinaryUploadResult } from '@/lib/cloudinary';
import { useToast } from '@/contexts/ToastContext';

const gearKinds: GearKind[] = ['guitar','bass','amp','cab','pedal','keyboard','accessory','interface','microphone'];

export default function GearDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gearId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const { addToast } = useToast();
  const [gear, setGear] = useState<GearDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<GearDoc>>({});
  const [replacingImage, setReplacingImage] = useState(false);

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
            if (editing === false) {
              setForm({
                kind: mapped.kind,
                kindDetail: mapped.kindDetail,
                brand: mapped.brand,
                model: mapped.model,
                serialNumber: mapped.serialNumber,
                notes: mapped.notes,
              });
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
  }, [gearId, editing]);

  async function saveChanges() {
    if (!gear || !gear.id) return;
    setSaving(true);
    try {
      const payload: Partial<GearDoc> = {
        kind: form.kind ?? gear.kind,
        kindDetail: form.kindDetail ?? gear.kindDetail,
        brand: form.brand ?? gear.brand,
        model: form.model ?? gear.model,
        serialNumber: form.serialNumber ?? gear.serialNumber,
        notes: form.notes ?? gear.notes,
      };
      await updateGearItem(gear.id, payload);
      setEditing(false);
      addToast({ type: 'success', title: 'Saved', message: 'Gear updated successfully.' });
    } finally {
      setSaving(false);
    }
  }

  async function doArchive() {
    if (!gear || !gear.id) return;
    if (!confirm('Archive this gear? It will be hidden from lists but can be restored manually in Firestore.')) return;
    await archiveGearItem(gear.id);
    addToast({ type: 'success', title: 'Archived', message: 'Gear archived.' });
    router.push('/gear');
  }

  function onImageUploaded(result: CloudinaryUploadResult) {
    if (!gear || !gear.id) return;
    void (async () => {
      setReplacingImage(true);
      try {
        await updateGearItem(gear.id!, { imageUrl: result.secure_url });
        addToast({ type: 'success', title: 'Image Updated', message: 'Cover image replaced.' });
      } finally {
        setReplacingImage(false);
      }
    })();
  }

  return (
    <main style={{ padding: '32px 26px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-tungstern)', margin: 0 }}>Gear Detail</h1>
        <Link href="/gear" style={{ fontSize: 14 }}>← Back to list</Link>
      </div>
      {loading && <p style={{ opacity: 0.7, marginTop: 24 }}>Loading…</p>}
      {error && !loading && <p style={{ color: '#b00020', marginTop: 24 }}>{error}</p>}
      {!loading && gear && (
        <section style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32 }}>
          <div>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', background: '#f4f4f4', borderRadius: 12, overflow: 'hidden' }}>
              {gear.imageUrl ? (
                <Image src={gear.imageUrl} alt={(gear.brand || 'Gear') + ' ' + (gear.model || '')} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, opacity: 0.55 }}>
                  No image
                </div>
              )}
              {gear.catalogSource?.source === 'reverb' && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 11, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '2px 6px', textAlign: 'right' }}>
                  Stock image • Reverb.com
                </div>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <CloudinaryUploader onUploaded={onImageUploaded} />
              {replacingImage && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Updating image…</div>}
            </div>
            <button
              onClick={() => doArchive()}
              style={{ marginTop: 16, background: '#550000', color: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #330000', cursor: 'pointer', fontSize: 13 }}
            >
              Archive
            </button>
          </div>
          <div>
            {!editing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h2 style={{ fontFamily: 'var(--font-fibre)', margin: '0 0 8px' }}>
                  {(gear.brand || 'Unknown') + (gear.model ? ' ' + gear.model : '')}
                </h2>
                <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>{gear.kind}</div>
                {gear.serialNumber && <div style={{ fontSize: 13, opacity: 0.7 }}>Serial: {gear.serialNumber}</div>}
                {gear.notes && <p style={{ fontSize: 14, lineHeight: 1.5 }}>{gear.notes}</p>}
                <button
                  onClick={() => setEditing(true)}
                  style={{ alignSelf: 'flex-start', background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}
                >
                  Edit
                </button>
                {gear.kindDetail && <div style={{ fontSize: 13, opacity: 0.7 }}>Kind detail: {gear.kindDetail}</div>}
              </div>
            )}
            {editing && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveChanges();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span>Kind</span>
                  <select
                    value={form.kind as string || gear.kind}
                    onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as GearKind }))}
                    style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
                  >
                    {gearKinds.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span>Kind detail</span>
                  <KindDetailAutocomplete
                    value={form.kindDetail ?? gear.kindDetail ?? ''}
                    kind={(form.kind ?? gear.kind) as GearCategory}
                    onChange={(v) => setForm((f) => ({ ...f, kindDetail: v }))}
                    placeholder="Start typing (auto-suggest)…"
                  />
                  <small style={{ opacity: 0.7 }}>Use suggestions or custom text.</small>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span>Brand</span>
                  <input
                    type="text"
                    value={form.brand ?? gear.brand ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
                    placeholder="e.g. Fender"
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span>Model</span>
                  <input
                    type="text"
                    value={form.model ?? gear.model ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
                    placeholder="e.g. Stratocaster"
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span>Serial Number</span>
                  <input
                    type="text"
                    value={form.serialNumber ?? gear.serialNumber ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
                    placeholder="Optional"
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span>Notes</span>
                  <textarea
                    rows={4}
                    value={form.notes ?? gear.notes ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, resize: 'vertical' }}
                    placeholder="Tone settings, year, modifications, etc."
                  />
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setForm({}); }}
                    style={{ background: '#444', color: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #333', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  {!gear.imageUrl && (form.brand || gear.brand) && (form.model || gear.model) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const brand = (form.brand ?? gear.brand ?? '').trim();
                        const model = (form.model ?? gear.model ?? '').trim();
                        if (!brand || !model) return;
                        const result = await fetchStockImageForBrandModel(brand, model);
                        if (result.url) {
                          const src: CatalogSourceMeta = {
                            source: 'reverb',
                            attribution: result.attribution ?? 'Stock image from Reverb.com',
                            licenseNote: 'Display-only stock image; not for redistribution.',
                          };
                          setForm(f => ({ ...f, imageUrl: result.url ?? undefined, catalogSource: src }));
                        }
                      }}
                      style={{ background: '#222', color: '#fff', padding: '8px 14px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}
                    >
                      Fetch Stock Image
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
