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

## Gear Kind Detail Autocomplete

The Add Gear forms (`/gear/add`, `/rigistry/add`) and the gear edit page use an autocomplete for the **Kind detail** field. This lets you quickly select specific instruments (e.g. "electric guitar", "alto saxophone") or studio/live equipment (e.g. "Audio Interface", "Line Array").

### Data Sources
1. `public/instrument-list.txt` – large base list of instruments.
2. Curated room lists – additional context-specific items for certain rooms (drum, control, stage) defined in `src/lib/instruments.ts`.
3. Common instruments list – high-frequency items hard-boosted to appear first whenever they match.

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
