/**
 * Logo.dev helper utilities
 *
 * Usage:
 * - In client components, use getLogoDevPublicKey() to initialize SDKs that require a publishable key.
 * - In server code (route handlers, server actions), use getLogoDevSecretKey() to call Logo.dev securely.
 */

export function getLogoDevPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY in environment');
  }
  return key;
}

// Do NOT import this into client components.
export function getLogoDevSecretKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('LOGO_DEV_SECRET_KEY is server-only. Do not access it in the browser.');
  }
  const key = process.env.LOGO_DEV_SECRET_KEY;
  if (!key) {
    throw new Error('Missing LOGO_DEV_SECRET_KEY in environment');
  }
  return key;
}

// Example placeholder for a server-side call to Logo.dev API.
// Replace the URL and payload with the real endpoint once ready.
export async function createLogoServerSide(input: { name: string; [k: string]: unknown }): Promise<unknown> {
  const secret = getLogoDevSecretKey();
  const res = await fetch('https://api.logo.dev/v1/logos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
    },
    body: JSON.stringify(input),
    // Ensure this runs only on the server/edge
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Logo.dev API error: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Build a logo.dev image URL for a given brand name using the publishable key.
 * Note: Adjust the endpoint pattern if your logo.dev account uses a different CDN or path.
 * Falls back to a generic text-based SVG via data URI if no key is present.
 */
import { resolveCanonicalBrand } from './brandAliases';

export function buildLogoDevImageUrl(
  brandOrDomain: string,
  opts?: {
    source?: 'name' | 'domain';
    size?: number; // default 800 for watermark
    format?: 'png' | 'jpg' | 'webp';
    theme?: 'auto' | 'light' | 'dark';
    retina?: boolean;
    greyscale?: boolean;
    // If true, do not return fallback SVG when brand name doesn't resolve; return empty string instead.
    // This lets UI hide overlays when we don't have an intentional match.
    strictNameMatchOnly?: boolean;
  }
): string {
  const key = process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY;
  const format = opts?.format ?? 'png';
  const size = typeof opts?.size === 'number' ? Math.min(Math.max(16, Math.floor(opts!.size)), 800) : 800;
  const theme = opts?.theme ?? 'auto';
  const retina = opts?.retina ?? true;
  const greyscale = opts?.greyscale ?? false;
  const isDomain = (opts?.source === 'domain') || /\./.test(brandOrDomain);
  let effectiveBrand = brandOrDomain.trim();
  if (!isDomain) {
    const canonical = resolveCanonicalBrand(effectiveBrand);
    if (canonical) {
      effectiveBrand = canonical; // force canonical display name for consistent logo lookup
    } else if (opts?.strictNameMatchOnly) {
      return '';
    }
  }
  const encoded = encodeURIComponent(effectiveBrand);

  if (key) {
    const path = isDomain ? encoded : `name/${encoded}`;
    const params = new URLSearchParams({
      token: key,
      format,
      size: String(size),
      theme,
      retina: String(retina),
    });
    if (greyscale) params.set('greyscale', 'true');
    return `https://img.logo.dev/${path}?${params.toString()}`;
  }

  // Fallback: simple SVG with brand text as a watermark
  if (opts?.strictNameMatchOnly && !isDomain) {
    // If we requested strict matching and don’t have a canonical brand, return empty (no overlay)
    return '';
  }
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>
      <defs>
        <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
          <stop offset='0' stop-color='#ffffff'/>
          <stop offset='1' stop-color='#f7f7f7'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='140' fill='rgba(0,0,0,0.06)'>${brandOrDomain}</text>
    </svg>`
  );
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}
