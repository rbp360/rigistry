'use client';

import { useState } from 'react';
import { uploadToCloudinary, type CloudinaryUploadResult } from '@/lib/cloudinary';

export default function CloudinaryUploader({
  folder = 'rigistry',
  onUploaded,
}: {
  folder?: string;
  onUploaded?: (r: CloudinaryUploadResult) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CloudinaryUploadResult | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const r = await uploadToCloudinary(file, { folder, tags: ['rigistry'] });
      setResult(r);
      onUploaded?.(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <input type="file" onChange={onChange} disabled={busy} />
      {busy && <div>Uploading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {result?.secure_url && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div><strong>URL:</strong> <a href={result.secure_url} target="_blank" rel="noreferrer">{result.secure_url}</a></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.secure_url} alt={result.public_id || 'upload'} style={{ maxWidth: 320, borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
