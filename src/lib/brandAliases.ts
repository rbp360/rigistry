/**
 * Canonical brand names and alias map for instrument / gear manufacturers.
 *
 * Goal:
 *  - Only show a logo overlay when we have an intentional, canonical match.
 *  - Avoid false positives like matching "Paul Smith" when we really want "Paul Reed Smith".
 *  - Support messy upstream variants ("PRS guitars", "Fender musical instruments corporation", etc.).
 *
 * How it works:
 *  1. Input manufacturer string is normalized (lowercase, strip punctuation & extra whitespace).
 *  2. We first look in ALIAS_TO_CANONICAL for a direct normalized alias hit.
 *  3. Otherwise we test if the normalized string exactly equals one of the canonical normalized names.
 *  4. If neither, we return null (no logo should be shown).
 *
 * Extend it:
 *  - Add new canonical brand to CANONICAL_BRANDS.
 *  - Add any messy variants to ALIAS_TO_CANONICAL mapping to point to the canonical brand.
 */

// List of canonical display names (case preserved for UI usage).
export const CANONICAL_BRANDS: readonly string[] = [
  'Paul Reed Smith',
  'Fender',
  'Gibson',
  'Ibanez',
  'Yamaha',
  'Marshall',
  'Mesa Boogie',
  'Orange',
  'Line 6',
  'Boss',
  'Electro-Harmonix',
  'Roland',
  'Korg',
  'Moog',
  'Novation',
  'Taylor',
  'Martin',
  'Gretsch',
  'Rickenbacker',
];

// Precompute a map of normalized canonical names -> canonical display name for O(1) lookups.
const NORMALIZED_CANONICAL = new Map<string, string>(
  CANONICAL_BRANDS.map((b) => [normalizeBrandKey(b), b])
);

// Aliases & variants (normalized) mapped to canonical display names.
// Only include deliberate mappings—do NOT include overly-generic substrings to avoid false positives.
export const ALIAS_TO_CANONICAL: Record<string, string> = {
  // Paul Reed Smith variants
  [normalizeBrandKey('PRS')]: 'Paul Reed Smith',
  [normalizeBrandKey('PRS Guitars')]: 'Paul Reed Smith',
  [normalizeBrandKey('Paul Reed Smith Guitars')]: 'Paul Reed Smith',
  // Fender variants
  [normalizeBrandKey('Fender Musical Instruments Corporation')]: 'Fender',
  [normalizeBrandKey('Fender Music Corporation')]: 'Fender',
  [normalizeBrandKey('FMIC')]: 'Fender',
  // Mesa/Boogie variants
  [normalizeBrandKey('Mesa/Boogie')]: 'Mesa Boogie',
  [normalizeBrandKey('Mesa Engineering')]: 'Mesa Boogie',
};

/**
 * Normalize a brand/manufacturer string into a lookup key.
 * - Lowercase
 * - Remove punctuation & symbols (retain alphanumerics & spaces)
 * - Collapse multiple spaces
 */
export function normalizeBrandKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') // non-alphanum -> space
    .trim()
    .replace(/\s+/g, ' ');
}

/** Resolve an arbitrary manufacturer string to a canonical brand name or null if no intentional match. */
export function resolveCanonicalBrand(input: string | null | undefined): string | null {
  if (!input) return null;
  const key = normalizeBrandKey(input);
  if (!key) return null;
  // Alias mapping first
  if (ALIAS_TO_CANONICAL[key]) return ALIAS_TO_CANONICAL[key];
  // Exact canonical match (normalized)
  const direct = NORMALIZED_CANONICAL.get(key);
  if (direct) return direct;
  return null; // Explicitly refuse fuzzy/partial matches to prevent false positives.
}

/** Check quickly if an input resolves to a known brand. */
export function hasCanonicalBrand(input: string | null | undefined): boolean {
  return resolveCanonicalBrand(input) !== null;
}

/** Export normalized canonical map ONLY if needed elsewhere (not default). */
export function listCanonicalBrands(): string[] {
  return [...CANONICAL_BRANDS];
}
