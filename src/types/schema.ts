// High-level gear classification used across catalog & rig nodes
// New top-level categories for Add Gear (20 categories provided by product):
export type GearCategory =
  | 'guitar'
  | 'bass'
  | 'drums'
  | 'vocals-microphone'
  | 'piano'
  | 'decks-dj'
  | 'laptop-electronic'
  | 'keyboard-synth-sampler'
  | 'percussion'
  | 'strings'
  | 'woodwind'
  | 'brass'
  | 'live-sound'
  | 'studio-sound'
  | 'other'
  | 'amplifiers-effects'
  | 'accessories';

// Backward-compatibility for existing data and rig-builder nodes
export type GearKind =
  | GearCategory
  | 'amp'
  | 'cab'
  | 'pedal'
  | 'interface'
  | 'microphone'
  | 'accessory'
  // legacy values preserved for backward compatibility
  | 'synthesizer'
  | 'keyboard'
  | 'sampler';

// Labels for the 20 categories shown in UI selects
export const GEAR_CATEGORY_LABELS: Record<GearCategory, string> = {
  guitar: 'Guitar',
  bass: 'Bass',
  drums: 'Drums',
  'vocals-microphone': 'Vocals/Microphone',
  piano: 'Piano',
  'decks-dj': 'Decks/DJ',
  'laptop-electronic': 'Laptop/Electronic',
  'keyboard-synth-sampler': 'Keyboard/Synth/Sampler',
  percussion: 'Percussion',
  strings: 'Strings',
  woodwind: 'Woodwind',
  brass: 'Brass',
  'live-sound': 'Live sound',
  'studio-sound': 'Studio sound',
  other: 'Other',
  'amplifiers-effects': 'Amplifiers/Effects',
  accessories: 'Accessories', // corrected spelling from source list
};

// Convenience list for Add Gear dropdown
export const GEAR_ADD_CATEGORIES: Array<{ value: GearCategory; label: string }> = (
  Object.entries(GEAR_CATEGORY_LABELS) as Array<[GearCategory, string]>
).map(([value, label]) => ({ value, label }));

// Suggested default room placement for each GearCategory.
// Values are room keys used in the rigistry UI; categories not listed require manual selection.
export const ROOM_SUGGESTIONS: Partial<Record<GearCategory, string>> = {
  guitar: 'guitar-amp',
  bass: 'guitar-amp',
  drums: 'drum',
  'vocals-microphone': 'vocal',
  piano: 'orchestral-pit',
  'decks-dj': 'dj-booth',
  'laptop-electronic': 'dj-booth',
  strings: 'orchestral-pit',
  woodwind: 'orchestral-pit',
  brass: 'orchestral-pit',
  percussion: 'orchestral-pit',
  'keyboard-synth-sampler': 'synthzone',
  'live-sound': 'stage',
  'studio-sound': 'control',
  'amplifiers-effects': 'guitar-amp',
};

// Room keys used across the app
export type RoomKey =
  | 'guitar-amp'
  | 'control'
  | 'drum'
  | 'vocal'
  | 'synthzone'
  | 'stage'
  | 'dj-booth'
  | 'orchestral-pit';

// Priority ordering of categories per room. First entry is the default kind for that room.
export const ROOM_KIND_PRIORITIES: Record<RoomKey, GearCategory[]> = {
  'guitar-amp': ['guitar', 'bass', 'amplifiers-effects'],
  control: ['studio-sound'],
  drum: ['drums'],
  vocal: ['vocals-microphone'],
  synthzone: ['keyboard-synth-sampler'],
  stage: ['live-sound'],
  'dj-booth': ['decks-dj', 'laptop-electronic'],
  'orchestral-pit': ['strings', 'woodwind', 'brass', 'percussion', 'piano'],
};

// Build an ordered list of categories for a room: prioritized first, then all others
export function getOrderedCategoriesForRoom(room?: RoomKey) {
  const base = GEAR_ADD_CATEGORIES.slice();
  if (!room) return base;
  const priorities = ROOM_KIND_PRIORITIES[room] ?? [];
  const prioritySet = new Set<GearCategory>(priorities);
  const prioritized = priorities
    .map((p) => base.find((b) => b.value === p))
    .filter((x): x is { value: GearCategory; label: string } => Boolean(x));
  const rest = base.filter((b) => !prioritySet.has(b.value));
  return [...prioritized, ...rest];
}

export interface UserDoc {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  createdAt?: FirebaseFirestoreTimestamp;
  updatedAt?: FirebaseFirestoreTimestamp;
}

// Represents a catalog or user-owned gear item. If sourced from external catalog the catalogSource may be set.
   export interface GearDoc {
     id?: string; // convenience when reading
     ownerId: string; // users.uid
     kind: GearKind;
     // Optional specific instrument subtype or detail, e.g., "alto saxophone", "electric guitar".
     kindDetail?: string;
     brand?: string;
     model?: string;
     serialNumber?: string;
     // Optional color/finish descriptor to refine catalog & image searches (e.g., "sunburst", "black")
     color?: string;
     notes?: string;
     imageUrl?: string; // hosted image URL (Cloudinary/Firebase Storage/Manufacturer)
     // Optional deeper metadata for search/filtering (extensible)
     specs?: Record<string, string | number | boolean>;
     catalogSource?: CatalogSourceMeta;
     room?: string; // room assignment (e.g. 'guitar-amp', 'drum', etc.)
     archived?: boolean; // soft delete / hide from active lists
     deleted?: boolean; // new field for recycle bin logic
     createdAt?: FirebaseFirestoreTimestamp;
     updatedAt?: FirebaseFirestoreTimestamp;
   }

export interface RigDoc {
  id?: string;
  ownerId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  // Persisted JSON snapshot of last saved node layout (optional optimization)
  layoutSnapshot?: RigLayoutSnapshot;
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
  // Node sizing for canvas rendering (optional, fallback to defaults)
  width?: number;
  height?: number;
  createdAt?: FirebaseFirestoreTimestamp;
  updatedAt?: FirebaseFirestoreTimestamp;
}

// Represents a directional connection in the signal chain (e.g., guitar -> pedal -> amp)
export interface SignalChainEdge {
  id?: string;
  rigId: string;
  fromNodeId: string;
  toNodeId: string;
  createdAt?: FirebaseFirestoreTimestamp;
  updatedAt?: FirebaseFirestoreTimestamp;
}

// Links an external preset file (kept at external host) to a rig node
export interface PresetLinkDoc {
  id?: string;
  rigId: string;
  nodeId: string; // associated RigNodeDoc.id
  url: string; // external preset or cloud storage link
  provider?: string; // e.g., 'helix', 'kemper', 'tonex', 'axe-fx'
  format?: string; // file extension like hlx, kipr, rig
  notes?: string;
  createdAt?: FirebaseFirestoreTimestamp;
  updatedAt?: FirebaseFirestoreTimestamp;
}

// Catalog data provenance for licensing/attribution audits
export interface CatalogSourceMeta {
  // Include 'guitar-list' for brand logo fallback; keep 'logo-dev' for backward compatibility
  source: 'equipboard' | 'effectsdb' | 'guitarpedaldb' | 'user' | 'reverb' | 'guitar-list' | 'logo-dev';
  externalId?: string; // ID from upstream source
  attribution?: string; // required attribution string
  licenseNote?: string; // summary of licensing constraints
  lastSyncAt?: FirebaseFirestoreTimestamp;
}

// Lightweight layout snapshot to store/restore canvas quickly
export interface RigLayoutSnapshot {
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
  }>;
  edges?: Array<{ from: string; to: string }>;
  savedAt: number; // epoch ms (client side)
}

// Define a narrow type to represent Firestore Timestamp without importing heavy types here
// Timestamp stub compatible with Firestore Timestamp for typing without direct import
export type FirebaseFirestoreTimestamp = {
  toMillis: () => number;
  seconds?: number;
  nanoseconds?: number;
} | null;

// User profile extension beyond auth basic fields
// Expanded instrument taxonomy for user profile primary instrument selection
// These are intentionally broader than GearKind and include performance roles.
export type InstrumentKind =
  | 'guitar'
  | 'bass'
  | 'drums'
  | 'vocals'
  | 'piano'
  | 'decks-dj'
  | 'laptop-electronic'
  | 'synthesizer'
  | 'keyboard'
  | 'sampler'
  | 'percussion'
  | 'strings'
  | 'woodwind'
  | 'brass'
  | 'live-sound'
  | 'studio-sound';

export const INSTRUMENT_KIND_LABELS: Record<InstrumentKind, string> = {
  guitar: 'Guitar',
  bass: 'Bass',
  drums: 'Drums',
  vocals: 'Vocals',
  piano: 'Piano',
  'decks-dj': 'Decks / DJ',
  'laptop-electronic': 'Laptop / Electronic',
  synthesizer: 'Synthesizer',
  keyboard: 'Keyboard',
  sampler: 'Sampler',
  percussion: 'Percussion',
  strings: 'Strings',
  woodwind: 'Woodwind',
  brass: 'Brass',
  'live-sound': 'Live sound',
  'studio-sound': 'Studio sound',
};

export interface UserProfileExtras {
  location?: string;
  bio?: string;
  favoriteGenres?: string[];
  primaryInstrument?: InstrumentKind; // broader creative role vs GearKind catalog classification
  // Maintenance tracking (e.g., last string change). Map gearId -> ISO date string
  maintenance?: Record<string, string>;
}

// Valid preset file extensions list (parsed from env variable NEXT_PUBLIC_ALLOWED_PRESET_EXT)
export function getAllowedPresetExtensions(): string[] {
  if (typeof process !== 'undefined') {
    const raw = process.env.NEXT_PUBLIC_ALLOWED_PRESET_EXT ?? '';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
