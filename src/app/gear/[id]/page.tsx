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
import { buildLogoDevImageUrl } from '@/lib/logoDev';

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
          // Compute logo watermark URL when brand is present
          if (mapped.brand) {
            try {
              setLogoUrl(
                buildLogoDevImageUrl(mapped.brand, {
                  source: 'name',
                  format: 'png',
                  size: 800,
                  retina: true,
                  theme: 'light',
                })
              );
            } catch {
              setLogoUrl(null);
            }
          } else {
            setLogoUrl(null);
          }
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
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#222' }}>
      {!loading && gear && ['guitar', 'bass'].includes(gear.kind) ? (
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
      ) : (
        // ...existing code for other gear types...
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ...existing code for non-guitar/bass gear... */}
        </div>
      )}
    </main>
  );
}
