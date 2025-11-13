import { NextResponse } from 'next/server';
import { resolveCanonicalBrand } from '@/lib/brandAliases';

// Use Node.js runtime for broader compatibility with external APIs and env vars
export const runtime = 'nodejs';

// Environment variable placeholder for future secure Reverb API token integration
const REVERB_TOKEN = process.env.REVERB_API_TOKEN;

// naive throttle to avoid rapid repeat calls per key within a short window
const recentCalls = new Map<string, number>();
const THROTTLE_MS = 2500;

// Fallback to guitar-list brand logo via our internal scraper route
function guitarListLogoUrl(brand: string) {
  return `/api/brand-logo?brand=${encodeURIComponent(brand)}`;
}

function scoreTitle(title: string, brand: string, model: string): number {
  const t = title.toLowerCase();
  const tokens = `${brand} ${model}`.toLowerCase().split(/\s+/).filter(Boolean);
  let score = 0;
  for (const tok of tokens) if (t.includes(tok)) score += 1;
  // small penalties for words suggesting bundles or accessories
  if (/(bundle|case|cover|manual|cable|set of)/i.test(title)) score -= 0.5;
  return score;
}

async function tryReverb(brand: string, model: string) {
  if (!REVERB_TOKEN) return { error: 'missing-token' }; // no token configured
  try {
    const query = `${brand} ${model}`.trim();
    // Try multiple auth/header/endpoint combinations
    type Attempt = { url: string; auth: 'bearer' | 'token'; path: 'listings' | 'listings-all'; status?: number; body?: string };
    const attempts: Attempt[] = [];

    const paths: Array<{ path: 'listings' | 'listings-all'; url: string }> = [
      { path: 'listings', url: `https://api.reverb.com/api/listings?query=${encodeURIComponent(query)}&page=1&per_page=10` },
      { path: 'listings-all', url: `https://api.reverb.com/api/listings/all?query=${encodeURIComponent(query)}&page=1&per_page=10` },
    ];
    const auths: Array<{ kind: 'bearer' | 'token'; header: string }> = [
      { kind: 'bearer', header: `Bearer ${REVERB_TOKEN}` },
      { kind: 'token', header: `Token token=${REVERB_TOKEN}` },
    ];

    for (const p of paths) {
      for (const a of auths) {
        try {
          const res = await fetch(p.url, {
            headers: {
              'Accept': 'application/hal+json, application/json',
              'Accept-Version': '3.0',
              'User-Agent': 'RigistryApp/0.1 (contact: dev@rigistry.local)',
              'Authorization': a.header,
            },
          });
          if (!res.ok) {
            let bodyText: string | undefined;
            try { bodyText = await res.text(); } catch {}
            attempts.push({ url: p.url, auth: a.kind, path: p.path, status: res.status, body: bodyText?.slice(0, 500) });
            continue;
          }
          // Try parse JSON
          let dataJson: { listings?: Listing[] } | null = null;
          try { dataJson = await res.json() as { listings?: Listing[] }; } catch {
            const bodyText = await res.text();
            attempts.push({ url: p.url, auth: a.kind, path: p.path, status: res.status, body: bodyText?.slice(0, 500) });
            continue;
          }
          type Listing = { title?: string; photos?: Array<{ _links?: { large?: { href: string }, full?: { href: string } } }> };
          const listings: Listing[] = Array.isArray(dataJson?.listings) ? (dataJson.listings as Listing[]) : [];
          if (!listings.length) continue; // try next combo
          const best = listings
            .map((l) => ({ l, s: scoreTitle(String(l?.title ?? ''), brand, model) }))
            .sort((a, b) => b.s - a.s)[0]?.l ?? listings[0];
          const photo = best?.photos?.[0]?._links as
            | { large?: { href: string }; full?: { href: string }; medium?: { href: string }; thumbnail?: { href: string } }
            | undefined;
          const href = photo?.large?.href || photo?.full?.href || photo?.medium?.href || photo?.thumbnail?.href || null;
          if (!href) continue; // try next combo
          return {
            url: href,
            attribution: best?.title ? `Photo: Reverb.com – ${best.title}` : 'Photo: Reverb.com',
            source: 'reverb' as const,
            licenseNote: 'Usage limited to display inside application; not for redistribution.',
            attempts,
            auth: a.kind,
            chosenPath: p.path,
          };
        } catch (err) {
          attempts.push({ url: p.url, auth: a.kind, path: p.path, body: err instanceof Error ? err.message : String(err) });
          continue;
        }
      }
    }

    return { error: 'bad-response', attempts };
  } catch (e) {
    return { error: 'exception', message: e instanceof Error ? e.message : String(e) };
  }
}

async function tryGuitarList(brand: string) {
  if (!brand) return null;
  const canonical = resolveCanonicalBrand(brand);
  if (!canonical) return null; // only serve logos for recognized brands to avoid bad guesses
  return {
    url: guitarListLogoUrl(canonical),
    attribution: 'Logo from guitar-list.com',
    source: 'guitar-list' as const,
    licenseNote: 'Logo used with permission via guitar-list.com; display-only.',
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get('brand') || '';
  const model = searchParams.get('model') || '';
  const color = searchParams.get('color') || '';

  if (!brand && !model) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  // throttle per key
  const key = `${brand}|${model}`.toLowerCase();
  const now = Date.now();
  const prev = recentCalls.get(key) ?? 0;
  if (now - prev < THROTTLE_MS) {
    return NextResponse.json({ error: 'Throttled' }, { status: 429 });
  }
  recentCalls.set(key, now);

  // 1) Try Reverb API (if token present)
  const reverbResult = await tryReverb(brand + (color ? ` ${color}` : ''), model);
  if (reverbResult && 'url' in reverbResult && reverbResult.url) {
    return NextResponse.json(reverbResult, { status: 200 });
  }

  // 2) Fallback to guitar-list brand logo (brand only, strict canonical match). If brand missing, attempt first token of model.
  const fallback = await tryGuitarList(brand || (model.split(' ')[0] || ''));
  if (fallback) {
    return NextResponse.json({ ...fallback, reverbDebug: reverbResult }, { status: 200 });
  }

  return NextResponse.json({ error: 'No stock image found', reverbDebug: reverbResult }, { status: 404 });
}
