// Instrument list utilities: load large instrument text list and provide categorization & suggestions.
// Heuristic category mapping will be refined later with curated data.
import type { GearCategory, RoomKey } from '@/types/schema';
import { ROOM_KIND_PRIORITIES } from '@/types/schema';

let instrumentListPromise: Promise<string[]> | null = null;

export async function getInstrumentList(): Promise<string[]> {
  if (!instrumentListPromise) {
    instrumentListPromise = fetch('/instrument-list.txt')
      .then(r => r.text())
      .then(text => text.split(/\r?\n/).map(l => l.trim()).filter(Boolean));
  }
  return instrumentListPromise;
}

// Keyword tables for heuristic classification. These are intentionally broad; overlapping keywords resolved by priority order.
const CATEGORY_KEYWORDS: Array<{ category: GearCategory; keywords: string[] }> = [
  { category: 'guitar', keywords: ['guitar', 'telecaster', 'stratocaster', 'les paul', 'sg'] },
  { category: 'bass', keywords: ['bass guitar', 'bass'] },
  { category: 'drums', keywords: ['drum', 'snare', 'kick', 'tom', 'tom-tom', 'cymbal', 'hi-hat', 'hi hat', 'ride', 'floor tom', 'drum set', 'drum kit'] },
  { category: 'vocals-microphone', keywords: ['microphone', 'mic', 'vocal'] },
  { category: 'piano', keywords: ['piano', 'grand piano', 'upright piano', 'electric grand'] },
  { category: 'decks-dj', keywords: ['turntable', 'cdj', 'mixdeck', 'dj controller', 'dj mixer'] },
  { category: 'laptop-electronic', keywords: ['laptop', 'computer', 'workstation', 'macbook', 'pc'] },
  { category: 'keyboard-synth-sampler', keywords: ['synth', 'synthesizer', 'keyboard', 'sampler', 'workstation', 'analog synthesizer', 'moog', 'korg', 'roland', 'midi controller'] },
  { category: 'percussion', keywords: ['tambourine', 'shaker', 'cowbell', 'triangle', 'bongo', 'bongos', 'conga', 'congas', 'clave'] },
  { category: 'strings', keywords: ['violin', 'viola', 'cello', 'double bass', 'harp', 'mandolin', 'ukulele'] },
  { category: 'woodwind', keywords: ['flute', 'clarinet', 'oboe', 'bassoon', 'piccolo', 'saxophone'] },
  { category: 'brass', keywords: ['trumpet', 'trombone', 'tuba', 'french horn', 'cornet', 'euphonium'] },
  { category: 'live-sound', keywords: [
    'pa', 'line array', 'front of house', 'foh', 'mixing console', 'monitor', 'stage monitor', 'powered speaker', 'active speaker', 'passive speaker',
    'subwoofer', 'fill speaker', 'side fill', 'delay tower', 'crossover', 'speaker management', 'wireless microphone', 'iem', 'in-ear', 'stage box', 'snake',
    'power amplifier', 'powered mixer', 'stage lighting', 'lighting console', 'lighting controller', 'fog machine', 'hazer', 'strobe', 'moving head', 'par can',
    'spotlight', 'fresnel', 'gobo projector', 'dmx', 'truss', 'led par', 'led bar', 'pixel bar', 'blinder', 'laser projector', 'uv fixture', 'blacklight'
  ] },
  { category: 'studio-sound', keywords: [
    'interface', 'audio interface', 'preamp', 'compressor', 'limiter', 'eq', 'equalizer', 'channel strip', 'monitoring', 'studio monitor', 'headphones', 'control surface',
    'daw controller', 'midi controller', 'outboard', 'outboard effects', 'di box', 'patchbay', 'power conditioner', 'acoustic treatment', 'studio furniture', 'recording media',
    'storage', 'clock', 'converter', 'clocks & converters', 'software', 'workstation', 'computer'
  ] },
  { category: 'amplifiers-effects', keywords: ['amp', 'amplifier', 'pedal', 'effects', 'stomp', 'cab', 'cabinet', 'reverb', 'delay', 'distortion', 'overdrive'] },
  { category: 'accessories', keywords: ['stand', 'case', 'bag', 'strap', 'pick', 'string', 'cable', 'capo', 'tuner', 'power distribution unit', 'pdu'] },
];

// Attempt to categorize an instrument name based on keyword heuristics.
export function categorizeInstrument(name: string): GearCategory | 'other' {
  const lower = name.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.category;
  }
  return 'other';
}

interface SuggestOptions {
  query: string;
  kind?: GearCategory; // currently selected category
  room?: RoomKey;
  limit?: number;
}

// Normalize strings for comparison (lowercase, strip parens and extra spaces)
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

// Common instruments always boosted to the top when they match the search
const COMMON_INSTRUMENTS = Array.from(new Set([
  'saxophone',
  'acoustic guitar',
  'ukulele',
  'bass guitar',
  'electric grand piano',
  'electric guitar',
  'grand piano',
  'upright piano',
  'cymbal',
  'drums (drum set)',
  'electronic drum set',
  'percussion',
  'analog synthesizer',
  'keyboard',
  'sampler',
  'synthesizer',
  'turntable',
].map(normalizeName)));
const COMMON_SET = new Set(COMMON_INSTRUMENTS);

// Curated, room-specific instruments that should float to the top in that room's search.
const CURATED_ROOM_INSTRUMENTS: Partial<Record<RoomKey, string[]>> = {
  drum: [
    'snare drum','kick drum','bass drum','tom-tom','floor tom','hi-hat','crash cymbal','ride cymbal','drum kit','drum set','electronic drum set','cymbal','tambourine','shaker','cowbell'
  ],
  control: [
    'Audio Interface','Microphone','Preamp','Compressor / Limiter','Equalizer (EQ)','Channel Strip','Monitoring','DAW Controller / Control Surface','MIDI Controller','Outboard Effects','DI box','Power Conditioner','Patchbay','Acoustic Treatment','Studio Furniture','Cables','Recording Media / Storage','Clocks & Converters','Computer / Workstation','Software'
  ],
  stage: [
    // Studio subset also relevant live
    'Audio Interface','Microphone','Preamp','Compressor / Limiter','Equalizer (EQ)','Channel Strip','Monitoring','DAW Controller / Control Surface','MIDI Controller','Outboard Effects','DI box','Power Conditioner','Patchbay','Cables','Computer / Workstation','Software',
    // Live-only / extended
    'Mixing Console','Stage Monitor','Power Amplifier','Crossover / Speaker Management','Wireless Microphone System','IEM (In-Ear Monitor System)','Stage Box / Snake','Outboard Processor','Lighting Controller','Stage Lighting Fixture','Fog / Haze Machine','Power Distribution Unit','Stage Cable / Multicore','Rack Case / Road Case','Speaker Stand / Mount','Mic Stand / Boom Arm','Stage Box','Stage Power Supply / Conditioner','Monitor Controller','Stage Drum Shield / Acoustic Panel','Front of House Speaker','Subwoofer','Fill Speaker','Monitor / Foldback Speaker','Side fill','Delay Tower','Point Source Speaker','Line Array','Curved Array','Column Array','Cardioid Subwoofer Array','Active / Powered Speaker','Passive Speaker','Flown Array','Ground-Stacked Array','Spotlight','Fresnel','Par Can','Profile / Ellipsoidal (ERS)','Floodlight','Blinder','Strobe Light','Moving Head Spot','Moving Head Wash','Moving Head Beam','Hybrid Moving Head','LED PAR / LED Wash','LED Bar / Strip','Pixel Batten / Pixel Bar','COB Light','Pinspot','Blacklight / UV Fixture','Laser Projector','Gobo Projector','Fog Machine','Hazer','Fazer','Snow Machine','Bubble Machine','Confetti / CO₂ / Flame System','Lighting Console / Controller','DMX Controller','DMX Splitter / Booster','Art-Net / sACN Node','Dimmers / Relay Packs','Wireless DMX System','Lighting Truss','Lighting Stand / T-Bar','Clamp / Coupler','Safety Cable','Winch / Hoist / Chain Motor','Rigging Hardware / Accessories','Power Distribution Unit','DMX Cable','Power Cable','Socapex Breakout / Fanout','Power Conditioner','LED Panel / Matrix','LED Tape / Strip Light','Architectural LED Fixture','Media Server'
  ]
};

export async function suggestInstruments(opts: SuggestOptions): Promise<string[]> {
  const { query, kind, room, limit = 12 } = opts;
  if (!query.trim()) return [];
  const baseList = await getInstrumentList();
  const q = query.toLowerCase();
  // Merge curated room instruments so they can suggest even if not present in the base list
  const curatedForRoom = room ? (CURATED_ROOM_INSTRUMENTS[room] ?? []) : [];
  const mergedSet = new Map<string, string>(); // normalized -> original
  for (const item of baseList) mergedSet.set(normalizeName(item), item);
  for (const item of curatedForRoom) {
    const norm = normalizeName(item);
    if (!mergedSet.has(norm)) mergedSet.set(norm, item);
  }
  const mergedList = Array.from(mergedSet.values());
  // Basic substring match
  const matched = mergedList.filter(item => item.toLowerCase().includes(q));
  // Rank: 1) exact startsWith match, 2) category match, 3) room priority match, 4) length closeness
  const roomPriorities = room ? ROOM_KIND_PRIORITIES[room] : [];
  return matched
    .map(item => {
      const lower = item.toLowerCase();
      const category = categorizeInstrument(item);
      const starts = lower.startsWith(q) ? 1 : 0;
      const categoryMatch = kind && category === kind ? 1 : 0;
      const roomScore = roomPriorities.length && categoryMatch === 0 && roomPriorities.includes(category as GearCategory) ? 0.5 : 0;
      const lengthPenalty = Math.abs(item.length - query.length) * 0.01; // prefer closer length when all else equal
      const norm = normalizeName(item);
      const commonBoost = COMMON_SET.has(norm) ? 100 : 0; // ensure common instruments float to the top
      const curatedBoost = curatedForRoom.some(ci => normalizeName(ci) === norm) ? 200 : 0; // highest priority in that room
      // TODO: frequencyBoost: add dynamic weighting based on saved GearDocs with matching kindDetail once dataset grows.
      const score = curatedBoost + commonBoost + (starts * 3 + categoryMatch * 2 + roomScore - lengthPenalty);
      return { item, score, common: commonBoost > 0, curated: curatedBoost > 0 };
    })
    .sort((a, b) => {
      if (a.curated !== b.curated) return a.curated ? -1 : 1; // curated-by-room first
      if (a.common !== b.common) return a.common ? -1 : 1; // then global common
      return b.score - a.score;
    })
    .slice(0, limit)
    .map(r => r.item);
}
