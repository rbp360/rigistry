export type GearKind = 'guitar' | 'bass' | 'amp' | 'cab' | 'pedal' | 'keyboard' | 'accessory';

export interface UserDoc {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  createdAt?: FirebaseFirestoreTimestamp;
  updatedAt?: FirebaseFirestoreTimestamp;
}

export interface GearDoc {
  id?: string; // convenience when reading
  ownerId: string; // users.uid
  kind: GearKind;
  brand?: string;
  model?: string;
  serialNumber?: string;
  notes?: string;
  imageUrl?: string; // hosted image URL (Cloudinary/Firebase Storage/Manufacturer)
  createdAt?: FirebaseFirestoreTimestamp;
  updatedAt?: FirebaseFirestoreTimestamp;
}

export interface RigDoc {
  id?: string;
  ownerId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  createdAt?: FirebaseFirestoreTimestamp;
  updatedAt?: FirebaseFirestoreTimestamp;
}

export interface RigNodeDoc {
  id?: string;
  rigId: string;
  gearRefId?: string; // optional link to GearDoc.id
  kind: GearKind;
  label?: string; // e.g., "Drive", "Rhythm Guitar"
  x: number;
  y: number;
  // Optional block of arbitrary parameters (e.g., for pedals)
  params?: Record<string, number | string | boolean>;
  createdAt?: FirebaseFirestoreTimestamp;
  updatedAt?: FirebaseFirestoreTimestamp;
}

// Define a narrow type to represent Firestore Timestamp without importing heavy types here
export type FirebaseFirestoreTimestamp = {
  toMillis: () => number;
} | null;
