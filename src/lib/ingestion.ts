// Mock catalog ingestion utilities for external sources.
// In a real implementation these would fetch remote APIs (Equipboard/Reverb/etc).
// Here we return static samples and normalize them toward GearDoc creation.

import type { GearDoc, GearKind } from '@/types/schema';

export type IngestionSource = 'equipboard' | 'effectsdb';

export interface RawCatalogItem {
  source: IngestionSource;
  externalId: string;
  brand: string;
  model: string;
  kind: GearKind;
  imageUrl?: string;
  notes?: string;
  attribution?: string;
  license?: string;
}

export interface NormalizedGearPartial extends Omit<GearDoc, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> {
  ownerId?: string; // will be injected later
}

// Mock raw data fetch per source.
export async function fetchRawCatalog(source: IngestionSource, query: string): Promise<RawCatalogItem[]> {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 300));
  const base: RawCatalogItem[] = [
    {
      source: 'equipboard',
      externalId: 'eb-123',
      brand: 'Fender',
      model: 'Stratocaster',
      kind: 'guitar',
      imageUrl: 'https://example.com/strat.jpg',
      notes: 'Classic versatile guitar',
      attribution: 'Equipboard user submission',
    },
    // Reverb samples removed
    {
      source: 'effectsdb',
      externalId: 'edb-789',
      brand: 'Electro-Harmonix',
      model: 'Holy Grail',
      kind: 'pedal',
      imageUrl: 'https://example.com/hg.jpg',
      notes: 'Spring/Hall/Flerb reverb pedal',
      attribution: 'EffectsDB dataset',
    },
  ];
  // Simple query filtering across brand+model
  const needle = query.toLowerCase();
  return base.filter((i) => `${i.brand} ${i.model}`.toLowerCase().includes(needle));
}

// Normalize a raw item into a GearDoc partial suitable for createGearItem.
export function normalizeRawItem(raw: RawCatalogItem): NormalizedGearPartial {
  return {
    kind: raw.kind,
    brand: raw.brand,
    model: raw.model,
    imageUrl: raw.imageUrl,
    notes: raw.notes,
    catalogSource: {
      source: raw.source,
      externalId: raw.externalId,
      attribution: raw.attribution,
      licenseNote: raw.license,
    },
    specs: undefined,
    archived: false,
  };
}

// Bulk normalize convenience.
export function normalizeBatch(rawItems: RawCatalogItem[]): NormalizedGearPartial[] {
  return rawItems.map(normalizeRawItem);
}

// Apply duplicate skip logic given existing user gear list.
export function filterDuplicates(existing: GearDoc[], incoming: NormalizedGearPartial[]): NormalizedGearPartial[] {
  const key = (b?: string, m?: string) => `${(b || '').toLowerCase()}::${(m || '').toLowerCase()}`;
  const existingKeys = new Set(existing.map((g) => key(g.brand, g.model)));
  return incoming.filter((i) => !existingKeys.has(key(i.brand, i.model)));
}
