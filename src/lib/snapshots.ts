import type { GearSetupSnapshot } from '@/types/schema';
import { getDb } from '@/lib/firebase';

// Save a setup snapshot for a gear item.
// - Gathers existing snapshots and notes
// - Appends a new snapshot and adds a --Snapshot mm/yy-- marker to notes
// - Optionally updates ampSettings/settingsFileUrl/nickname if provided
// Returns the created snapshot object and the updated notes string.
export async function saveSetupSnapshot(
  gearId: string,
  fields: Partial<{
    // Common
    notes: string;
    nickname: string;
    // Amp/FX
    ampSettings: string;
    settingsFileUrl: string;
    // Guitar/Bass specifics
    stringManufacturer: string | null;
    pickupManufacturer: string | null; // legacy support if needed
    pickupBManufacturer: string | null;
    pickupMManufacturer: string | null;
    pickupNManufacturer: string | null;
    numberOfStrings: number;
    tuning: string;
    stringGauge: string;
  }>
): Promise<{ snapshot: GearSetupSnapshot; updatedNotes: string }> {
  const db = getDb();
  if (!db) throw new Error('Database not initialized');

  const { doc, getDoc, updateDoc } = await import('firebase/firestore');
  const ref = doc(db, 'gear', gearId);
  const snap = await getDoc(ref);
  const data: Record<string, unknown> = snap.exists() ? (snap.data() as Record<string, unknown>) : {};

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const monthYear = `${mm}/${yy}`;

  // Build snapshot object without undefined values
  const snapshot: Partial<GearSetupSnapshot> & { savedAt: number; monthYear: string } = { savedAt: now.getTime(), monthYear };
  const addIf = (key: keyof GearSetupSnapshot, val: unknown) => {
    if (val !== undefined && val !== null && !(typeof val === 'string' && val.trim() === '')) {
      (snapshot as Record<string, unknown>)[key as string] = val as unknown;
    }
  };

  addIf('notes', fields.notes);
  addIf('ampSettings', fields.ampSettings);
  addIf('settingsFileUrl', fields.settingsFileUrl);
  addIf('nickname', fields.nickname);
  addIf('stringManufacturer', fields.stringManufacturer);
  addIf('pickupManufacturer', fields.pickupManufacturer);
  addIf('pickupBManufacturer', fields.pickupBManufacturer);
  addIf('pickupMManufacturer', fields.pickupMManufacturer);
  addIf('pickupNManufacturer', fields.pickupNManufacturer);
  addIf('numberOfStrings', fields.numberOfStrings);
  addIf('tuning', fields.tuning);
  addIf('stringGauge', fields.stringGauge);

  const existingSnapshots: GearSetupSnapshot[] = Array.isArray(data.snapshots) ? (data.snapshots as GearSetupSnapshot[]) : [];
  const baseNotes = ((data.notes as string | undefined) || fields.notes || '').toString().trim();
  const updatedNotes = (baseNotes ? baseNotes + '\n' : '') + `--Snapshot ${monthYear}--`;

  // Build update payload without undefined values
  const updatePayload: Record<string, unknown> = {
    snapshots: [...existingSnapshots, snapshot],
    notes: updatedNotes,
  };
  if (fields.ampSettings !== undefined) {
    updatePayload.ampSettings = fields.ampSettings && fields.ampSettings.trim() !== '' ? fields.ampSettings : null;
  }
  if (fields.settingsFileUrl !== undefined) {
    const trimmed = (fields.settingsFileUrl || '').toString().trim();
    updatePayload.settingsFileUrl = trimmed !== '' ? trimmed : null;
  }
  if (fields.nickname !== undefined) {
    const trimmedNick = (fields.nickname || '').toString().trim();
    updatePayload.nickname = trimmedNick !== '' ? trimmedNick : null;
    updatePayload.friendlyName = updatePayload.nickname; // keep legacy in sync
  }

  await updateDoc(ref, updatePayload);

  return { snapshot, updatedNotes };
}
