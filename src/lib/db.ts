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
    const { ownerId, kind, brand, model, serialNumber, notes, imageUrl } = d;
    return {
      ownerId,
      kind,
      brand: brand ?? null,
      model: model ?? null,
      serialNumber: serialNumber ?? null,
      notes: notes ?? null,
      imageUrl: imageUrl ?? null,
    } as DocumentData;
  },
  fromFirestore(snap) {
    const d = snap.data()!;
    return {
      id: snap.id,
      ownerId: d.ownerId,
      kind: d.kind,
      brand: d.brand ?? undefined,
      model: d.model ?? undefined,
      serialNumber: d.serialNumber ?? undefined,
      notes: d.notes ?? undefined,
      imageUrl: d.imageUrl ?? undefined,
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
function gearCol(db: Firestore) {
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
