import { NextResponse } from 'next/server';

// Server-side Places Autocomplete using OpenStreetMap Nominatim only (no API key required).
// Usage: /api/places-autocomplete?q=leeds&limit=6

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.max(1, Math.min(10, parseInt(searchParams.get('limit') || '6', 10)));

    if (!q) return NextResponse.json({ predictions: [] }, { status: 200 });

    const osm = await fetchOSMSuggestions(q, limit);
    return NextResponse.json({ predictions: osm.predictions, provider: 'osm' }, { status: 200 });
  } catch (e) {
    console.error('places-autocomplete failed', e);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  }
}

async function fetchOSMSuggestions(q: string, limit: number): Promise<{ predictions: Array<{ description: string; place_id: string }> }> {
  const osmUrl = new URL('https://nominatim.openstreetmap.org/search');
  osmUrl.searchParams.set('format', 'jsonv2');
  osmUrl.searchParams.set('q', q);
  osmUrl.searchParams.set('limit', String(limit));
  osmUrl.searchParams.set('addressdetails', '0');
  osmUrl.searchParams.set('accept-language', 'en');

  const resp = await fetch(osmUrl.toString(), {
    headers: {
      // Identify the application per OSM usage policy; customize as needed
      'User-Agent': 'RigistryApp/1.0 (places-autocomplete)'
    }
  });
  if (!resp.ok) {
    return { predictions: [] };
  }
  const data = await resp.json() as Array<{ display_name: string; place_id: number; osm_type?: string; osm_id?: number }>;
  const items = (Array.isArray(data) ? data : []).map((d) => ({
    description: d.display_name,
    place_id: `osm:${d.osm_type ?? 'N'}:${d.osm_id ?? d.place_id}`,
  }));
  return { predictions: items };
}
