import { NextResponse } from 'next/server';

// Server-side proxy to Google Places Autocomplete API.
// Requires GOOGLE_MAPS_API_KEY set in server env (NOT exposed as NEXT_PUBLIC_*).
// Usage: /api/places-autocomplete?q=leeds&session=<token>&limit=6

const GOOGLE_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

export async function GET(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_MAPS_API_KEY not configured' }, { status: 501 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const sessiontoken = (searchParams.get('session') || '').trim();
    const limit = Math.max(1, Math.min(10, parseInt(searchParams.get('limit') || '6', 10)));

    if (!q) return NextResponse.json({ predictions: [] }, { status: 200 });

    const url = new URL(GOOGLE_ENDPOINT);
    url.searchParams.set('input', q);
    url.searchParams.set('key', apiKey);
    // Prefer cities/localities; adjust as needed (geocode covers broader results)
    url.searchParams.set('types', '(cities)');
    if (sessiontoken) url.searchParams.set('sessiontoken', sessiontoken);

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: 'Upstream error', details: text }, { status: 502 });
    }
    const data = await resp.json() as { predictions?: Array<{ description: string; place_id: string; types?: string[] }> };
    const preds: Array<{ description: string; place_id: string; types?: string[] }> = Array.isArray(data.predictions) ? data.predictions.slice(0, limit) : [];
    const items = preds.map((p) => ({
      description: p.description,
      place_id: p.place_id,
      types: p.types,
    }));

    return NextResponse.json({ predictions: items }, { status: 200 });
  } catch (e) {
    console.error('places-autocomplete failed', e);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}
