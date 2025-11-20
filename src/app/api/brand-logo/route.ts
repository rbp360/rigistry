import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
// Ensure Node.js runtime since cheerio and Buffer are Node-only
export const runtime = 'nodejs';

// If a brand's slug differs from the brand name, list it here.
const BRAND_OVERRIDES: Record<string, string> = {
  // B.C. Rich variants
  'B.C. Rich': 'bc-rich',
  'b.c. rich': 'bc-rich',
  'bc rich': 'bc-rich',
  // G&L variants
  'G&L': 'gl',
  'g&l': 'gl',
  // PRS variants
  'PRS': 'paul-reed-smith-guitars-prs',
  'prs': 'paul-reed-smith-guitars-prs',
  'Paul Reed Smith': 'paul-reed-smith-guitars-prs',
  'paul reed smith': 'paul-reed-smith-guitars-prs',
  // Music Man variants
  'Music Man': 'music-man',
  'music man': 'music-man',
  'Ernie Ball Music Man': 'music-man',
  'ernie ball music man': 'music-man',
  // Extra forgiving variants for B.C. Rich
  'B.C.Rich': 'bc-rich',
  'b.c.rich': 'bc-rich',
  'BCRich': 'bc-rich',
  'bcrich': 'bc-rich',
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toAbsolute(url: string | undefined, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

async function findLogoUrl(html: string, pageUrl: string, brand: string) {
  const $ = cheerio.load(html);
  const candidates: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $('img').each((_: number, el: any) => {
    const src = $(el).attr('src') || '';
    const alt = ($(el).attr('alt') || '').toLowerCase();
    const title = ($(el).attr('title') || '').toLowerCase();
    const srcL = src.toLowerCase();

    const looksLikeLogo =
      alt.includes('logo') ||
      title.includes('logo') ||
      srcL.includes('logo') ||
      alt.includes(brand.toLowerCase());

    if (looksLikeLogo) candidates.push(src);
  });

  // Prefer vector/raster formats and strings that look like brand assets
  const scored = candidates
    .map((u) => ({
      u,
      score:
        (/(\.svg|\.png)$/i.test(u) ? 5 : 0) +
        (u.toLowerCase().includes('brand') ? 2 : 0) +
        (u.toLowerCase().includes(brand.toLowerCase()) ? 2 : 0) +
        (u.toLowerCase().includes('logo') ? 3 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const bestSrc = (scored[0]?.u || $('img').first().attr('src')) || null;
  if (!bestSrc) return null;
  return toAbsolute(bestSrc, pageUrl);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const brandRaw = (searchParams.get('brand') || '').trim();
  if (!brandRaw) {
    return NextResponse.json({ error: 'brand required' }, { status: 400 });
  }

  const override = BRAND_OVERRIDES[brandRaw] || BRAND_OVERRIDES[brandRaw.toLowerCase()];
  const slug = override || toSlug(brandRaw);
  const pageUrl = `https://www.guitar-list.com/brands/${slug}`;

  const pageRes = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'gearhed/1.0 (+https://gearhed.app) brand-logo-fetch',
      'Accept-Language': 'en',
    },
    // Cache the brand page for 1 minute on server to reduce load
    next: { revalidate: 60 },
  });

  if (!pageRes.ok) {
    return NextResponse.json({ error: 'brand page not found' }, { status: 404 });
  }

  const html = await pageRes.text();
  const logoUrl = await findLogoUrl(html, pageUrl, brandRaw);

  if (!logoUrl) {
    return NextResponse.json({ error: 'logo not found' }, { status: 404 });
  }

  const imgRes = await fetch(logoUrl, {
    headers: {
      'User-Agent': 'gearhed/1.0 (+https://gearhed.app) brand-logo-fetch',
    },
    // Cache logo for 7 days. Clients may also cache via Cache-Control below.
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!imgRes.ok) {
    return NextResponse.json({ error: 'logo fetch failed' }, { status: 502 });
  }

  const arrayBuf = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get('content-type') || 'image/png';

  return new NextResponse(Buffer.from(arrayBuf), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Aggressive CDN cache with SWR
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
      'X-Source-Logo': logoUrl,
    },
  });
}
