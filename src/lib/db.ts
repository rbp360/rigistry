import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type FirestoreDataConverter,
  type Query,
} from 'firebase/firestore';
import type { GearDoc, RigDoc, RigNodeDoc } from '@/types/schema';

const gearConverter: FirestoreDataConverter<GearDoc> = {
  toFirestore(d: GearDoc): DocumentData {
  const { ownerId, kind, kindDetail, brand, model, serialNumber, color, notes, imageUrl, specs, catalogSource, archived, room } = d;
    return {
      ownerId,
      kind,
      kindDetail: kindDetail ?? null,
      brand: brand ?? null,
      model: model ?? null,
      serialNumber: serialNumber ?? null,
  notes: notes ?? null,
  color: color ?? null,
      imageUrl: imageUrl ?? null,
      specs: specs ?? null,
      catalogSource: catalogSource ?? null,
      room: room ?? null,
      archived: archived ?? false,
    } as DocumentData;
  },
  fromFirestore(snap) {
    const d = snap.data()!;
    return {
      id: snap.id,
      ownerId: d.ownerId,
      kind: d.kind,
      kindDetail: d.kindDetail ?? undefined,
      brand: d.brand ?? undefined,
      model: d.model ?? undefined,
      serialNumber: d.serialNumber ?? undefined,
  notes: d.notes ?? undefined,
  color: d.color ?? undefined,
      imageUrl: d.imageUrl ?? undefined,
      specs: d.specs ?? undefined,
      catalogSource: d.catalogSource ?? undefined,
      room: d.room ?? undefined,
      archived: d.archived ?? false,
      createdAt: (d.createdAt as Timestamp) ?? null,
      updatedAt: (d.updatedAt as Timestamp) ?? null,
    } satisfies GearDoc;
  },
};

const rigConverter: FirestoreDataConverter<RigDoc> = {
  toFirestore(d: RigDoc): DocumentData {
    const { ownerId, name, description, coverImageUrl } = d;
    return {
      ownerId,
      name,
      description: description ?? null,
      coverImageUrl: coverImageUrl ?? null,
    } as DocumentData;
  },
  fromFirestore(snap) {
    const d = snap.data()!;
    return {
      id: snap.id,
      ownerId: d.ownerId,
      name: d.name,
      description: d.description ?? undefined,
      coverImageUrl: d.coverImageUrl ?? undefined,
      createdAt: (d.createdAt as Timestamp) ?? null,
      updatedAt: (d.updatedAt as Timestamp) ?? null,
    } satisfies RigDoc;
  },
};

const rigNodeConverter: FirestoreDataConverter<RigNodeDoc> = {
  toFirestore(d: RigNodeDoc): DocumentData {
    const { rigId, gearRefId, kind, label, x, y, params } = d;
    return {
      rigId,
      gearRefId: gearRefId ?? null,
      kind,
      label: label ?? null,
      x,
      y,
      params: params ?? null,
    } as DocumentData;
  },
  fromFirestore(snap) {
    const d = snap.data()!;
    return {
      id: snap.id,
      rigId: d.rigId,
      gearRefId: d.gearRefId ?? undefined,
      kind: d.kind,
      label: d.label ?? undefined,
      x: d.x,
      y: d.y,
      params: d.params ?? undefined,
      createdAt: (d.createdAt as Timestamp) ?? null,
      updatedAt: (d.updatedAt as Timestamp) ?? null,
    } satisfies RigNodeDoc;
  },
};

// Collection helpers
// function usersCol(db: Firestore) {
//   return collection(db, 'users').withConverter(userConverter);
// }
export function gearCol(db: Firestore) {
  return collection(db, 'gear').withConverter(gearConverter);
}
function rigsCol(db: Firestore) {
  return collection(db, 'rigs').withConverter(rigConverter);
}
function rigNodesCol(db: Firestore, rigId: string) {
  return collection(db, 'rigs', rigId, 'nodes').withConverter(rigNodeConverter);
}

export async function getOrCreateDefaultRig(ownerId: string): Promise<RigDoc | null> {
  const db = getDb();
  if (!db) return null;
  const id = `${ownerId}_default`;
  const ref = doc(rigsCol(db), id);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const now = serverTimestamp();
  const data: RigDoc = { id, ownerId, name: 'My First Rig', description: 'Default rig', createdAt: null, updatedAt: null };
  await setDoc(ref, { ...data, createdAt: now, updatedAt: now } as DocumentData);
  return (await getDoc(ref)).data() ?? null;
}

export async function listRigsByOwner(ownerId: string): Promise<RigDoc[]> {
  const db = getDb();
  if (!db) return [];
  const q: Query<RigDoc> = query(rigsCol(db), where('ownerId', '==', ownerId));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => d.data());
}

export async function listGearByOwner(ownerId: string): Promise<GearDoc[]> {
  const db = getDb();
  if (!db) return [];
  const q: Query<GearDoc> = query(gearCol(db), where('ownerId', '==', ownerId));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => d.data());
}

export async function createGearItem(partial: Omit<GearDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<GearDoc | null> {
  const db = getDb();
  if (!db) return null;
  const col = gearCol(db);
  const ref = doc(col);
  const now = serverTimestamp();
  const data: GearDoc = {
    ...partial,
    id: ref.id,
    archived: partial.archived ?? false,
    createdAt: null,
    updatedAt: null,
  };
  await setDoc(ref, { ...data, createdAt: now, updatedAt: now } as DocumentData);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function updateGearItem(id: string, updates: Partial<Omit<GearDoc, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const ref = doc(gearCol(db), id);
  const existing = await getDoc(ref);
  if (!existing.exists()) return false;
  await setDoc(ref, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  return true;
}

export async function archiveGearItem(id: string): Promise<boolean> {
  return updateGearItem(id, { archived: true });
}

export async function loadRigNodes(rigId: string): Promise<RigNodeDoc[]> {
  const db = getDb();
  if (!db) return [];
  const snaps = await getDocs(rigNodesCol(db, rigId));
  return snaps.docs.map((d) => d.data());
}

export async function replaceRigNodes(rigId: string, nodes: RigNodeDoc[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  const colRef = rigNodesCol(db, rigId);
  const batch = writeBatch(db);
  // Delete all existing nodes first
  const existing = await getDocs(colRef);
  existing.forEach((docSnap) => batch.delete(doc(db, 'rigs', rigId, 'nodes', docSnap.id)));
  // Add all provided nodes
  const now = serverTimestamp();
  nodes.forEach((n) => {
    const id = n.id ?? undefined;
    const ref = id ? doc(colRef, id) : doc(colRef);
    batch.set(ref, { ...n, createdAt: now, updatedAt: now } as DocumentData);
  });
  await batch.commit();
}
