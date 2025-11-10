import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_TOKEN = process.env.REVERB_API_KEY;
const BASE_URL = 'https://api.reverb.com/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Missing or too-short search query' }, { status: 400 });
  }
  if (!API_TOKEN) {
    return NextResponse.json({ error: 'Missing Reverb API token' }, { status: 500 });
  }

  const url = `${BASE_URL}/listings?query=${encodeURIComponent(query)}`;
  const headers: Record<string, string> = {
    // Reverb API supports X-Auth-Token for simple token auth; OAuth tokens use Bearer
    'X-Auth-Token': API_TOKEN,
    'Accept': 'application/hal+json',
    'Accept-Version': '3.0',
    'User-Agent': 'gearhed-app/0.1 (+https://example.com)'
  };

  try {
    const res = await fetch(url, { headers });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      const body = contentType.includes('application/json') ? await res.json() : await res.text();
      return NextResponse.json({
        error: 'Upstream Reverb error',
        status: res.status,
        statusText: res.statusText,
        body
      }, { status: res.status >= 400 && res.status < 600 ? res.status : 502 });
    }
    const data = contentType.includes('application/json') ? await res.json() : await res.text();
    // If response is text fallback, wrap it to avoid client crashes
    return NextResponse.json(typeof data === 'string' ? { raw: data } : data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch from Reverb', message: msg }, { status: 502 });
  }
}
