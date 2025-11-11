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
  { category: 'bass', keywords: ['bass'] },
  { category: 'drums', keywords: ['drum', 'snare', 'kick', 'tom', 'cymbal', 'hi-hat', 'hi hat', 'ride', 'floor tom'] },
  { category: 'vocals-microphone', keywords: ['microphone', 'mic', 'vocal'] },
  { category: 'piano', keywords: ['piano', 'grand', 'upright'] },
  { category: 'decks-dj', keywords: ['turntable', 'cdj', 'mixdeck', 'dj controller', 'dj mixer'] },
  { category: 'laptop-electronic', keywords: ['laptop', 'computer', 'macbook', 'pc'] },
  { category: 'keyboard-synth-sampler', keywords: ['synth', 'keyboard', 'sampler', 'workstation', 'moog', 'korg', 'roland'] },
  { category: 'percussion', keywords: ['tambourine', 'shaker', 'cowbell', 'triangle', 'bongo', 'bongos', 'conga', 'congas', 'clave'] },
  { category: 'strings', keywords: ['violin', 'viola', 'cello', 'double bass', 'harp', 'mandolin'] },
  { category: 'woodwind', keywords: ['flute', 'clarinet', 'oboe', 'bassoon', 'piccolo'] },
  { category: 'brass', keywords: ['trumpet', 'trombone', 'tuba', 'french horn', 'cornet', 'euphonium'] },
  { category: 'live-sound', keywords: ['pa', 'monitor', 'stage box', 'snake', 'wireless system'] },
  { category: 'studio-sound', keywords: ['interface', 'preamp', 'compressor', 'eq', 'studio monitor', 'headphones', 'dac'] },
  { category: 'amplifiers-effects', keywords: ['amp', 'amplifier', 'pedal', 'effects', 'stomp', 'cab', 'cabinet', 'reverb', 'delay', 'distortion', 'overdrive'] },
  { category: 'accessories', keywords: ['stand', 'case', 'bag', 'strap', 'pick', 'string', 'cable', 'capo', 'tuner'] },
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

export async function suggestInstruments(opts: SuggestOptions): Promise<string[]> {
  const { query, kind, room, limit = 12 } = opts;
  if (!query.trim()) return [];
  const list = await getInstrumentList();
  const q = query.toLowerCase();
  // Basic substring match
  const matched = list.filter(item => item.toLowerCase().includes(q));
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
      const score = commonBoost + (starts * 3 + categoryMatch * 2 + roomScore - lengthPenalty);
      return { item, score, common: commonBoost > 0 };
    })
    .sort((a, b) => {
      if (a.common !== b.common) return a.common ? -1 : 1; // common first
      return b.score - a.score;
    })
    .slice(0, limit)
    .map(r => r.item);
}
