// Common string gauge set names (simplified) by string count
export const GUITAR_STRING_GAUGES: Record<number, string[]> = {
  6: [
    '008-038',
    '009-042',
    '009-046',
    '010-046',
    '010-052',
    '011-048',
    '011-050',
    '012-054',
    '013-056',
    '013-062',
    '014-068',
    '016-070',
    'CUSTOM'
  ]
  // Additional string counts (7,8) can be added later as needed
};
// Common bass string gauge sets (approximate) by string count
export const BASS_STRING_GAUGES: Record<number, string[]> = {
  4: [
    '040-100', // light
    '045-105', // regular
    '050-110',
    '055-115',
    '060-125',
    '065-130',
    'CUSTOM'
  ],
  5: [
    '040-120',
    '045-125',
    '045-130',
    '050-135',
    '055-135',
    '060-140',
    'CUSTOM'
  ],
  6: [
    '030-125',
    '032-130',
    '034-132',
    '036-136',
    'CUSTOM'
  ]
};
// Common guitar tunings by string count
export const GUITAR_TUNINGS: Record<number, Array<{ name: string; notes: string[] }>> = {
   6: [
      { name: 'Standard', notes: ['E', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Eb Standard', notes: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'] },
      { name: 'D Standard', notes: ['D', 'G', 'C', 'F', 'A', 'D'] },
      { name: 'C Standard', notes: ['C', 'F', 'Bb', 'Eb', 'G', 'C'] },
      { name: 'Drop D', notes: ['D', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Drop C', notes: ['C', 'G', 'C', 'F', 'A', 'D'] },
      { name: 'Drop B', notes: ['B', 'F#', 'B', 'E', 'G#', 'C#'] },
      { name: 'Drop A', notes: ['A', 'E', 'A', 'D', 'F#', 'B'] },
      { name: 'Open D', notes: ['D', 'A', 'D', 'F#', 'A', 'D'] },
      { name: 'Open G', notes: ['D', 'G', 'D', 'G', 'B', 'D'] },
      { name: 'Open C', notes: ['C', 'G', 'C', 'G', 'C', 'E'] },
      { name: 'Open E', notes: ['E', 'B', 'E', 'G#', 'B', 'E'] },
      { name: 'Open A', notes: ['E', 'A', 'E', 'A', 'C#', 'E'] },
      { name: 'DADGAD', notes: ['D', 'A', 'D', 'G', 'A', 'D'] },
      { name: 'Double Drop D', notes: ['D', 'A', 'D', 'G', 'B', 'D'] },
      { name: 'Drop Db', notes: ['Db', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'] },
      { name: 'Nashville Tuning', notes: ['E', 'A', 'D', 'G', 'B', 'E'] }, // octave up except B/E
      { name: 'Baritone A Standard', notes: ['A', 'D', 'G', 'C', 'E', 'A'] },
      { name: 'Modal C', notes: ['C', 'G', 'C', 'G', 'C', 'E'] },
      { name: 'Orkney (CGDGAD)', notes: ['C', 'G', 'D', 'G', 'A', 'D'] },
    ],
   7: [
      { name: 'Standard 7', notes: ['B', 'E', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Drop A', notes: ['A', 'E', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Drop G', notes: ['G', 'D', 'G', 'C', 'F', 'A', 'D'] },
      { name: 'Drop Ab/Drop G#', notes: ['Ab', 'Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'] },
      { name: 'A Standard', notes: ['A', 'D', 'G', 'C', 'F', 'A', 'D'] },
      { name: 'G Standard', notes: ['G', 'C', 'F', 'Bb', 'D', 'G', 'C'] },
      { name: 'C Standard 7', notes: ['C', 'F', 'Bb', 'Eb', 'G', 'C', 'F'] },
      { name: 'Low A Variant', notes: ['A', 'E', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Loomis/Archspire', notes: ['Bb', 'F', 'Bb', 'Eb', 'G', 'C', 'F'] },
      { name: 'Misha Mansoor Variant', notes: ['G#', 'D#', 'G#', 'C#', 'F#', 'A#', 'D#'] },
      { name: 'Jazz Variant', notes: ['B', 'E', 'A', 'D', 'F#', 'B', 'E'] },
      { name: 'Open C 7', notes: ['C', 'G', 'C', 'G', 'C', 'E', 'G'] },
      { name: 'Open A 7', notes: ['A', 'E', 'A', 'E', 'A', 'C#', 'E'] },
      { name: 'Open G 7', notes: ['G', 'D', 'G', 'D', 'G', 'B', 'D'] },
      { name: 'Open D 7', notes: ['D', 'A', 'D', 'F#', 'A', 'D', 'F#'] },
      { name: 'DADGAD + Low A', notes: ['A', 'D', 'A', 'D', 'G', 'A', 'D'] },
      { name: 'Nashville 7', notes: ['B', 'E', 'A', 'D', 'G', 'B', 'E'] }, // octave variant
      { name: 'Half-step Down 7', notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'] },
      { name: 'Whole-step Down 7', notes: ['A', 'D', 'G', 'C', 'F', 'A', 'D'] },
      { name: 'Slipknot Style', notes: ['A', 'E', 'A', 'D', 'G', 'B', 'E'] },
    ],
   8: [
      { name: 'Standard 8', notes: ['F#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Drop E', notes: ['E', 'B', 'E', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Drop D#', notes: ['D#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Drop D', notes: ['D', 'A', 'D', 'G', 'C', 'F', 'A', 'D'] },
      { name: 'Eb Standard', notes: ['Eb', 'Ab', 'Db', 'Gb', 'B', 'Eb', 'Ab', 'Db'] },
      { name: 'E Standard', notes: ['E', 'A', 'D', 'G', 'C', 'F', 'A', 'D'] },
      { name: 'F Standard', notes: ['F', 'Bb', 'Eb', 'Ab', 'C', 'F', 'Bb', 'Eb'] },
      { name: 'D Standard', notes: ['D', 'G', 'C', 'F', 'A#', 'D', 'G', 'C'] },
      { name: 'Drop C#', notes: ['C#', 'G#', 'C#', 'F#', 'B', 'E', 'G#', 'C#'] },
      { name: 'Drop C', notes: ['C', 'G', 'C', 'F', 'A#', 'D', 'G', 'C'] },
      { name: 'Drop B', notes: ['B', 'F#', 'B', 'E', 'A', 'D', 'G', 'B'] },
      { name: 'Drop A#', notes: ['A#', 'F', 'A#', 'D#', 'G', 'C', 'F', 'A#'] },
      { name: 'Meshuggah Standard', notes: ['F#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'] },
      { name: 'Animals as Leaders', notes: ['E', 'B', 'E'] },
    ],
  12: [
    { name: 'Standard (EADGBE x2)', notes: ['E', 'E', 'A', 'A', 'D', 'D', 'G', 'G', 'B', 'B', 'E', 'E'] },
    { name: 'Open G', notes: ['D', 'D', 'G', 'G', 'D', 'D', 'G', 'G', 'B', 'B', 'D', 'D'] },
  ],
};
// Common bass tunings by string count
export const BASS_TUNINGS: Record<number, Array<{ name: string; notes: string[] }>> = {
  4: [
    { name: 'Standard', notes: ['E', 'A', 'D', 'G'] },
    { name: 'Drop D', notes: ['D', 'A', 'D', 'G'] },
    { name: 'Eb Standard', notes: ['Eb', 'Ab', 'Db', 'Gb'] },
    { name: 'D Standard', notes: ['D', 'G', 'C', 'F'] },
    { name: 'C Standard', notes: ['C', 'F', 'Bb', 'Eb'] },
    { name: 'E Standard (Alt Octave)', notes: ['E', 'A', 'D', 'G'] },
  ],
  5: [
    { name: 'Standard 5', notes: ['B', 'E', 'A', 'D', 'G'] },
    { name: 'High C Variant', notes: ['E', 'A', 'D', 'G', 'C'] },
    { name: 'Drop A', notes: ['A', 'E', 'A', 'D', 'G'] },
    { name: 'Half-step Down 5', notes: ['Bb', 'Eb', 'Ab', 'Db', 'Gb'] },
    { name: 'Whole-step Down 5', notes: ['A', 'D', 'G', 'C', 'F'] },
  ],
  6: [
    { name: 'Standard 6', notes: ['B', 'E', 'A', 'D', 'G', 'C'] },
    { name: 'Drop A 6', notes: ['A', 'E', 'A', 'D', 'G', 'C'] },
    { name: 'Eb Standard 6', notes: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'] },
    { name: 'Whole-step Down 6', notes: ['A', 'D', 'G', 'C', 'F', 'Bb'] },
  ]
};
// Common string manufacturers for guitar/bass setup fields
export const STRING_MANUFACTURERS = [
  'Ernie Ball',
  'D’Addario',
  'Elixir',
  'DR Strings',
  'GHS',
  'Rotosound',
  'Martin',
  'Gibson',
  'Fender',
  'Cleartone',
  'La Bella',
  'SIT Strings',
  'CUSTOM'
] as const;
export type StringManufacturer = typeof STRING_MANUFACTURERS[number];
// Common pickup manufacturers
export const PICKUP_MANUFACTURERS = [
  'Seymour Duncan',
  'DiMarzio',
  'EMG',
  'Fender',
  'Gibson',
  'Bare Knuckle Pickups',
  'Fishman (Fluence)',
  'Lollar Pickups',
  'TV Jones',
  'Lindy Fralin Pickups',
  'Mojotone',
  'Suhr Pickups',
  'PRS (Paul Reed Smith) Pickups',
  'Railhammer Pickups',
  'Wilkinson',
  'Gretsch Pickups',
  'Kent Armstrong Pickups',
  'Bill Lawrence (Wilde Pickups)',
  'Häussel Pickups',
  'ToneRider Pickups',
  'Not installed',
  'CUSTOM'
] as const;
export type PickupManufacturer = typeof PICKUP_MANUFACTURERS[number];
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
     // User-assigned nickname for the item (previously friendlyName)
     nickname?: string;
     // Optional color/finish descriptor to refine catalog & image searches (e.g., "sunburst", "black")
     color?: string;
     notes?: string;
     // Amplifier / effects specific settings text block (user editable)
     ampSettings?: string;
    // Link to external settings / preset storage (e.g., cloud folder, ToneX, Helix backup)
    settingsFileUrl?: string;
    // Drum-specific fields
    drumHeadDetails?: string; // description of batter/resonant heads
    drumHeadTension?: string; // notes on tuning/tension system values
    drumHeadChangeDate?: string; // date last head was changed (stored as ddmmyyyy string)
    drumBody?: string; // shell material / depth notes
    drumModsMuffles?: string; // modifications, muffling techniques
    drumPieces?: DrumPieceSetup[]; // array of per-piece setups
    cymbalPieces?: CymbalPieceSetup[]; // array of per-cymbal setups
     imageUrl?: string; // hosted image URL (Cloudinary/Firebase Storage/Manufacturer)
    // Number of strings (for guitar/bass features)
    numberOfStrings?: number;
      // String manufacturer / brand for current set (optional)
      stringManufacturer?: string;
      // Legacy single pickup manufacturer (deprecated in UI)
      pickupManufacturer?: string;
      // New separate pickup manufacturer fields (Bridge, Middle, Neck)
      pickupBManufacturer?: string;
      pickupMManufacturer?: string;
      pickupNManufacturer?: string;
    // Optional deeper metadata for search/filtering (extensible)
    specs?: Record<string, string | number | boolean>;
      // Historical setup snapshots allowing user to archive past configurations
      snapshots?: GearSetupSnapshot[];
     catalogSource?: CatalogSourceMeta;
     room?: string; // room assignment (e.g. 'guitar-amp', 'drum', etc.)
     archived?: boolean; // soft delete / hide from active lists
     deleted?: boolean; // new field for recycle bin logic
     createdAt?: FirebaseFirestoreTimestamp;
     updatedAt?: FirebaseFirestoreTimestamp;
   }

  // Snapshot of a gear setup captured by user
  export interface GearSetupSnapshot {
    savedAt: number; // epoch milliseconds
    monthYear: string; // mm/yy string for quick display
    stringManufacturer?: string;
    // Legacy combined
    pickupManufacturer?: string;
    // New separated pickup manufacturers
    pickupBManufacturer?: string;
    pickupMManufacturer?: string;
    pickupNManufacturer?: string;
    numberOfStrings?: number;
    tuning?: string;
    stringGauge?: string;
    notes?: string; // notes field content at time of snapshot
    ampSettings?: string; // amplifier/effects settings text captured at time of snapshot
    settingsFileUrl?: string; // snapshot of external settings file link
    // Drum snapshot fields
    drumHeadDetails?: string;
    drumHeadTension?: string;
    drumHeadChangeDate?: string;
    drumBody?: string;
    drumModsMuffles?: string;
    drumPieces?: DrumPieceSetup[]; // snapshot of per-piece drum setup
    cymbalPieces?: CymbalPieceSetup[]; // snapshot of cymbal setup
    nickname?: string; // nickname captured at time of snapshot
  }

// Per-drum piece setup (e.g. individual snare, tom, kick)
export interface DrumPieceSetup {
  id: string; // client-side uuid
  pieceType?: string; // e.g. snare, kick, rack tom, floor tom
  headDetails?: string; // batter/resonant descriptions
  headTension?: string; // tension metrics
  headChangeDate?: string; // ddmmyyyy
  body?: string; // shell material/depth
  modsMuffles?: string; // gels, rings, tape
}

// Per-cymbal piece setup
export interface CymbalPieceSetup {
  id: string; // uuid
  cymbalType?: string; // ride, crash, hi-hat top, hi-hat bottom, splash, china
  brandModel?: string; // brand + model
  diameter?: string; // e.g. 14", 20"
  changeDate?: string; // ddmmyyyy (purchase or replacement date)
  notes?: string; // optional notes (cracks, tape fixes)
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
