# Content schema migration

Editorial data that used to live as inline TypeScript arrays under `src/data/` now lives as versioned JSON under `content/`, validated at build time against `schemas/content.schema.json`.

Geo assets (`src/data/land-rings.json`, `src/data/coastline.ts`) are unchanged — they are map geometry, not editorial content.

## Layout

```
content/
  letters.json          # { "letters": Letter[] }
  cities.json           # { "cities": City[] }
  journeys.json         # { "journeys": Journey[], "imprisonments": Imprisonment[] }
  story.json            # { "story": StoryEvent[], "startLabelIds": string[] }
  periods.json          # { "periods", "audienceMeta", "themeGroups", "themeFilters" }
  compare.json          # { "presets": ComparePair[] }
  biographical.json     # { "events": BiographicalEvent[] }  (new; start empty)
  cultural.json         # { "contexts": CulturalContext[] } (new; start empty)
schemas/
  content.schema.json   # JSON Schema 2020-12 with $defs for every content type
scripts/
  validate-content.mjs  # Ajv validator; exits 1 on failure
  extract-content.mjs   # one-shot helper to re-dump TS → JSON (dev only)
src/data/*.ts           # thin loaders that import JSON and re-export the same symbols
```

## Schema overview

`schemas/content.schema.json` defines `$defs` for:

| Def | Used by |
|-----|---------|
| `Letter`, `Dating`, `OutlineSection`, `NamedPerson`, `ScriptureRef` | `letters.json` |
| `City` | `cities.json` |
| `Journey`, `Imprisonment` | `journeys.json` |
| `StoryEvent` (`travel` / `letter` / `stay`), `TravelMode` | `story.json` |
| `PeriodMeta`, `AudienceMetaEntry`, `ThemeGroupMeta` | `periods.json` |
| `ComparePair` | `compare.json` |
| `BiographicalEvent` | `biographical.json` |
| `CulturalContext` | `cultural.json` |

Each content file has a matching `*File` def (e.g. `LettersFile`) that wraps the array(s). Enums (`PeriodId`, `AudienceType`, `ThemeGroup`) match `src/types.ts`.

New TypeScript interfaces (also in `src/types.ts`):

- **BiographicalEvent** — life/timeline events (id, title, year range, optional place, summary, Acts anchors, tags).
- **CulturalContext** — background notes keyed by letter/city/theme (`appliesTo`), with summary, body, optional sources.

## Old TS → new mapping

| Former export (`src/data/…`) | JSON path | Notes |
|------------------------------|-----------|-------|
| `LETTERS` | `content/letters.json` → `letters` | Full letter records preserved |
| `CITIES` | `content/cities.json` → `cities` | |
| `JOURNEYS` | `content/journeys.json` → `journeys` | |
| `IMPRISONMENTS` | `content/journeys.json` → `imprisonments` | |
| `STORY` | `content/story.json` → `story` | **Already-timed** durations (~2 min total); `timed()` not re-applied |
| `START_LABEL_IDS` (Set) | `content/story.json` → `startLabelIds` (array) | Loader rebuilds `Set` |
| `PERIODS` | `content/periods.json` → `periods` | |
| `AUDIENCE_META` | `content/periods.json` → `audienceMeta` | |
| `THEME_GROUPS` | `content/periods.json` → `themeGroups` | |
| `THEME_FILTERS` | `content/periods.json` → `themeFilters` | |
| `PRESET_COMPARISONS` | `content/compare.json` → `presets` | `compareInsight()` and helpers stay in `src/data/compare.ts` |

`LETTER_BY_ID` / `CITY_BY_ID` are still derived in the TypeScript loaders.

## How to add a letter

1. Copy an existing object in `content/letters.json` and edit every required field (`id`, `title`, `shortTitle`, `sort`, `book`, `bibleSearch`, destination, audience, outline, themes, dating, anchors, `arcBulge`, etc.).
2. Ensure `destinationId` / dating `originId` exist in `content/cities.json`.
3. If the letter appears in the guided story, add a `{ "type": "letter", … }` event to `content/story.json` (set `duration` in milliseconds consistent with neighboring events; total story duration should stay near 120000 ms).
4. Optionally add a compare preset in `content/compare.json`.
5. Run `npm run validate:content` — it must pass before `npm run build`.

## How to add a city

1. Append an object to `content/cities.json` → `cities` with `id`, `name`, `shortLabel`, `lon`, `lat`, `kind` (`city` \| `region`), `planted`, `letterRelevant`, `description`.
2. Reference the new `id` from letters, journeys, imprisonments, or story waypoints as needed.
3. If the city should show a start label on the map, add its `id` to `startLabelIds` in `content/story.json`.
4. Run `npm run validate:content`.

## How to add biographical / cultural content

These collections start empty and are ready for future UI.

- **Biographical:** append to `content/biographical.json` → `events`. Loader: `src/data/biographical.ts` → `BIOGRAPHICAL_EVENTS`.
- **Cultural:** append to `content/cultural.json` → `contexts`. Loader: `src/data/cultural.ts` → `CULTURAL_CONTEXTS`.

## Validation and build

```bash
npm run validate:content   # Ajv against schemas/content.schema.json
npm run lint               # tsc --noEmit
npm run build              # validate:content && tsc -b && vite build
```

`build` fails if any content file is missing, malformed, or fails schema checks.

## App wiring

Components and state still import from `src/data/*` (`LETTERS`, `CITIES`, `STORY`, etc.). Those modules are thin re-exports from JSON, so hash routes, map, timeline, compare, and letter drawer behave the same as before the migration.
