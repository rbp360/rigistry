export type CloudinaryUploadResult = {
  asset_id?: string;
  public_id?: string;
  version?: number;
  version_id?: string;
  signature?: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  created_at?: string;
  tags?: string[];
  bytes?: number;
  type?: string;
  etag?: string;
  placeholder?: boolean;
  url?: string;
  secure_url?: string;
  original_filename?: string;
  [key: string]: unknown;
};

export function getCloudinaryEnv() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  return { cloudName, preset } as const;
}

/**
 * Client-side unsigned upload to Cloudinary.
 * Requires an unsigned upload preset configured to allow unsigned uploads.
 */
export async function uploadToCloudinary(
  file: File,
  opts?: { folder?: string; tags?: string[]; context?: Record<string, string> }
): Promise<CloudinaryUploadResult> {
  const { cloudName, preset } = getCloudinaryEnv();
  if (!cloudName || !preset) {
    throw new Error('Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', preset);
  if (opts?.folder) form.append('folder', opts.folder);
  if (opts?.tags?.length) form.append('tags', opts.tags.join(','));
  if (opts?.context) {
    const ctx = Object.entries(opts.context)
      .map(([k, v]) => `${k}=${v}`)
      .join('|');
    if (ctx) form.append('context', ctx);
  }

  const res = await fetch(endpoint, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} ${text}`);
  }
  return (await res.json()) as CloudinaryUploadResult;
}
