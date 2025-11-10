import { getDb } from '@/lib/firebase';
import { gearCol } from '@/lib/db';
import { query, where, getDocs } from 'firebase/firestore';
import type { GearDoc } from '@/types/schema';

export async function listGearByRoom(ownerId: string, room: string): Promise<GearDoc[]> {
  const db = getDb();
  if (!db) return [];
  const q = query(gearCol(db), where('ownerId', '==', ownerId), where('room', '==', room));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => d.data() as GearDoc);
}
