## Location Autocomplete (OSM)

- Uses OpenStreetMap Nominatim for place suggestions.
- No API key required for light usage. Respect rate limits and usage policy.
- Endpoint: `/api/places-autocomplete?q=<query>&limit=6`.

Notes
- For higher traffic or SLA needs, consider a hosted geocoding provider (e.g., LocationIQ, Geoapify) or self-hosting Nominatim/Pelias. We can make the provider configurable if needed.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deleted Items Management (Recycle Bin)

- Soft-deleted gear items (marked `deleted: true`) are hidden from rooms but kept in Firestore.
- Visit `/settings` to manage deleted items:
	- Select items and click "Restore selected" to bring them back (clears `deleted` and `archived`).
	- Select items and click "Permanently delete selected" to remove them from Firestore.
- Implementation:
	- Client helpers in `src/lib/db.ts`: `listDeletedGearByOwner`, `restoreGearItem`, `permanentlyDeleteGearItem`.
	- UI in `src/app/settings/DeletedItemsManager.tsx` embedded by `src/app/settings/page.tsx`.

## Gear Kind Detail Autocomplete

The Add Gear forms (`/gear/add`, `/rigistry/add`) and the gear edit page use an autocomplete for the **Kind detail** field. This lets you quickly select specific instruments (e.g. "electric guitar", "alto saxophone") or studio/live equipment (e.g. "Audio Interface", "Line Array").

### Data Sources

## Stock Images & Attribution

When a user does not upload a photo, a "Fetch Stock Image" button (add & edit forms) can retrieve a representative image.

### Source Priority
1. Reverb API (brand + model query) – returns first listing photo.
2. Fallback: brand logo via logo.dev (approximate; adjust endpoint if needed).

### Implementation Files
* `src/app/api/stock-image/route.ts` – edge route performs Reverb lookup (if `REVERB_API_TOKEN` is configured) and fallback to logo.dev.
* `src/lib/reverb.ts` – client helper `fetchStockImageForBrandModel` calling the server route.
* UI integration in `gear/add/page.tsx` and `gear/[id]/page.tsx`.

### Watermark & Attribution
Images with `catalogSource.source === 'reverb'` display a small overlay: *"Stock image • Reverb.com"*. Attribution + license note stored in `catalogSource`.

### Schema Extension
`CatalogSourceMeta.source` now supports: `reverb` and `logo-dev` in addition to existing sources. Use `licenseNote` for compliance reminders.

### Future Improvements (TODO)
* Rate-limiting & caching of stock image responses.
* Smarter listing selection (prefer exact model match vs generic bundles).
* Explicit logo.dev response validation & error handling.
* Batch backfill script for existing gear missing images.
* Optional image proxying to avoid hotlinking longevity issues.

### Error Handling
If no image is found, the fallback returns a 404; UI currently remains unchanged. Future enhancement: display inline hint offering manual upload.

### Environment Variables
Set `REVERB_API_TOKEN` in deployment environment for live Reverb integration.
1. `public/instrument-list.txt` – large base list of instruments.
2. Curated room lists – additional context-specific items for certain rooms (drum, control, stage) defined in `src/lib/instruments.ts`.
3. Common instruments list – high-frequency items hard-boosted to appear first whenever they match.

## Logo.dev Integration

Environment variables (add to `.env.local` – already gitignored):

```
NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY=... # safe to expose
LOGO_DEV_SECRET_KEY=...                  # server only
```

Usage examples:

```ts
// Client component
import { getLogoDevPublicKey } from '@/lib/logoDev';
const key = getLogoDevPublicKey();
// Initialize Logo.dev client SDK with key

// Server action / route
import { createLogoServerSide } from '@/lib/logoDev';
export async function action(formData: FormData) {
	const name = String(formData.get('name'));
	const created = await createLogoServerSide({ name });
	return created;
}
```

Security notes:
- Never expose `LOGO_DEV_SECRET_KEY` to the browser or return it in JSON.
- Rotate secrets promptly if leaked; update Vercel/hosting provider env vars.
- Use server actions or route handlers for calls requiring the secret key.
 
### Strict Canonical Brand Matching

To prevent false-positive logo overlays (e.g. showing a generic "Paul Smith" when the intended brand is "Paul Reed Smith"), brand resolution is now **strict**:

* Canonical display names and alias variants live in `src/lib/brandAliases.ts`.
* Input manufacturer strings are normalized (lowercase, punctuation stripped, whitespace collapsed).
* We only return a logo URL when the normalized input matches either:
	1. A normalized canonical brand, or
	2. A normalized alias explicitly mapped to a canonical brand.
* No fuzzy / partial / substring matches are allowed; absence of a match yields an empty string when `strictNameMatchOnly: true` is passed.

Example (hide overlay if unknown):

```ts
import { buildLogoDevImageUrl } from '@/lib/logoDev';

const url = buildLogoDevImageUrl(manufacturerName, { strictNameMatchOnly: true });
if (!url) {
	// No intentional match -> skip rendering logo overlay
}
```

To extend support: add the nice display name to `CANONICAL_BRANDS` and messy variants to `ALIAS_TO_CANONICAL` mapping to point back to that name.

### Ranking Precedence (highest first)
1. Room-curated matches (e.g. "snare drum" in Drum room, "Audio Interface" in Control room, "Line Array" on Stage).
2. Global common instruments (provided list like "electric guitar", "saxophone").
3. Text starts-with query match.
4. Category match (current selected top-level Gear kind).
5. Room priority category alignment (if not already matched above).
6. Length proximity for tie-breaking.

### Category Heuristics
The helper `categorizeInstrument()` uses keyword tables to infer a `GearCategory` from the entered string. Keywords include extended studio and live terms (e.g. `patchbay`, `line array`, `control surface`).

### Curated Room Items
Room-specific lists are merged into the suggestion pool even if they are not present in the base instrument list:
* Drum: core drum set components + auxiliary percussion.
* Control (studio): recording & mixing equipment (interfaces, preamps, outboard, acoustic treatment, etc.).
* Stage (live): full live sound reinforcement, monitoring, lighting, rigging and power distribution.

### Extensibility
* To add or adjust curated items, edit `CURATED_ROOM_INSTRUMENTS` in `src/lib/instruments.ts`.
* To refine categorization, update `CATEGORY_KEYWORDS` (add keywords or new categories if taxonomy expands).
* Future (planned): dynamic frequency-based boost (TODO left in code) using saved Gear documents to elevate most-used kind details.

### Fallback Behavior
If no suggestion fits, the user's custom text is kept verbatim; there is no forced selection. This allows logging niche or bespoke equipment.

### Performance Notes
Instrument list fetch is cached in-memory per session; subsequent queries are filtered client-side with a light debounce (180ms) for responsiveness.

### Contributing
Please keep additions to curated lists concise, canonical, and singular (avoid duplicates differing only by punctuation). When necessary, place synonyms directly in the keyword arrays rather than duplicating curated entries.

---
