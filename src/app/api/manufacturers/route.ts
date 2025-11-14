import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force Node.js runtime (fs unsupported on edge)
export const runtime = 'nodejs';

// Resolve backend data directory. When dev server runs with --prefix frontend,
// process.cwd() will be the frontend folder. We attempt both sibling and nested paths.
function resolveDataDir() {
  const cwd = process.cwd();
  const sibling = path.join(cwd, '..', 'backend', 'data');
  if (fs.existsSync(sibling)) return sibling;
  const nested = path.join(cwd, 'backend', 'data');
  if (fs.existsSync(nested)) return nested;
  // Fallback: just sibling path (may not exist yet)
  return sibling;
}
const DATA_DIR = resolveDataDir();

function readJsonArray(file: string): string[] {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category')?.toLowerCase().trim();
  const q = searchParams.get('q')?.toLowerCase().trim();

  let list: string[];
  // If data dir missing, short-circuit with empty list + hint
  if (!fs.existsSync(DATA_DIR)) {
    return new Response(JSON.stringify({ total: 0, items: [], error: 'Manufacturer data directory not found', dataDir: DATA_DIR }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
  if (category) {
    const catFile = path.join(DATA_DIR, `manufacturers.${category}.json`);
    list = readJsonArray(catFile);
    if (!list.length) {
      // Fallback to global if category file missing
      list = readJsonArray(path.join(DATA_DIR, 'manufacturers.global.json'));
    }
  } else {
    list = readJsonArray(path.join(DATA_DIR, 'manufacturers.global.json'));
  }

  if (q) {
    // Simple substring filter prioritizing prefix matches
    const lcq = q.toLowerCase();
    const starts: string[] = [];
    const contains: string[] = [];
    for (const name of list) {
      const ln = name.toLowerCase();
      if (ln.startsWith(lcq)) starts.push(name);
      else if (ln.includes(lcq)) contains.push(name);
    }
    list = [...starts, ...contains];
  }

  // Limit response size for autocomplete performance
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const limited = list.slice(0, Math.max(1, Math.min(limit, 200)));

  return new Response(JSON.stringify({ total: list.length, items: limited }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}
