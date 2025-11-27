import { NextResponse } from 'next/server';
import { getDb } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';

// GET /api/profiles?ids=uid1,uid2,uid3
// Returns a map of ownerId -> { name, location }
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids') || '';
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ profiles: {} }, { status: 200 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });

    const profCol = collection(db, 'profiles');
    // Firestore does not support where in array directly; chunk by equality queries
    // Fallback: fetch all requested via multiple queries (small N expected)
    const result: Record<string, { name?: string; location?: string }> = {};
    for (const id of ids) {
      const q = query(profCol, where('ownerId', '==', id));
      const snaps = await getDocs(q);
      const first = snaps.docs[0]?.data() as any;
      if (first) {
        result[id] = { name: first.name || first.displayName || undefined, location: first.location || undefined };
      } else {
        result[id] = {};
      }
    }
    return NextResponse.json({ profiles: result }, { status: 200 });
  } catch (e) {
    console.error('profiles api failed', e);
    return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
  }
}
