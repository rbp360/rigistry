'use client';

import { useMemo, useState } from 'react';
import { getBucket } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function UploadPage() {
  const storage = useMemo(() => getBucket(), []);
  const ready = !!storage;
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storage) {
      setError('Firebase Storage is not configured. Add your keys to .env.local');
      return;
    }

    try {
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setUrl(downloadUrl);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Upload</h1>
      <p>Upload a file to Firebase Storage.</p>

      {!ready && (
        <p style={{ color: 'crimson' }}>
          Firebase not initialized. Configure your .env.local first.
        </p>
      )}

      <input type="file" onChange={onFileChange} disabled={!ready} />

      {url && (
        <p>
          Uploaded: <a href={url} target="_blank" rel="noreferrer">{url}</a>
        </p>
      )}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </main>
  );
}
