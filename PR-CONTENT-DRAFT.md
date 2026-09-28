# PR draft (not opened — GitHub write auth pending)

**Branch:** `content-schema-migration` (1 commit ahead of `main`, plus large uncommitted local work)  
**Base:** `main`  
**Suggested title:** Content schema, city/theme packs, life timeline, MapLibre map

---

## Summary

Moves Letter & Road editorial data onto versioned JSON with schema validation, then layers in city context packs, interpretive themes, an expanded compare set, Paul’s life timeline, MapLibre basemap, and a scrubber that covers the full life span (AD 5–68).

**Do not merge without independent human review** of scholarly content (city packs, cultural themes, biographical events, compare insights). UI/infra can be reviewed in the same pass or split later if preferred.

## What’s in this PR

### Content & schema
- Versioned `content/*.json` + `schemas/content.schema.json` + `npm run validate:content` (already started in commit `8f9e31d`)
- **36** city context packs (`content/city-contexts.json`) wired into map city selection / `CityDrawer`
- **36** interpretive cultural contexts (`content/cultural.json`) shown in `LetterDrawer` when they apply
- **33** biographical events (`content/biographical.json`) + Explore → “Paul’s life timeline”
- **12** curated compare presets (`content/compare.json`), including Chains & Suffering pairs (Philippians↔Philemon, Ephesians↔Colossians, Philemon↔2 Timothy, etc.)

### App / UX
- City drawer, life timeline panel, theme blocks under letters
- Year scrubber bounds **AD 5–68** (ticks: 5, 15, 30, 40, 48, 57, 68); letters remain “future” until their dating years
- **MapLibre GL** (OpenFreeMap Liberty, no Mapbox token); SVG atlas retained as `MediterraneanMapSvg.tsx` behind `VITE_USE_MAPLIBRE=false`
- `DEPLOY.md` for dual GitHub Pages + Cloudflare Pages (custom domain letterandroad.com already live in prod)

### Intentionally omit from the commit (or follow-up PR)
- `content/city-contexts.executor-draft.json` — superseded draft; do not ship
- Optional: `docs/*-concept.md` product concepts (not required for runtime)
- Optional: `docs/reviewer-bot.md` / `docs/tech-reviewer-bot.md` (bot mandates; fine to include if you want them versioned)

## Test plan
- [ ] `npm run validate:content`
- [ ] `npm run build`
- [ ] `npm run dev` — MapLibre loads; city click opens city drawer; letter drawer shows cultural packs; Explore → life timeline focuses year/place; scrubber reaches pre-48 years
- [ ] `VITE_USE_MAPLIBRE=false npm run dev` — SVG fallback still works
- [ ] Spot-check compare presets (12) and a sample of city/theme packs for tone and Acts/scripture anchors
- [ ] Confirm GH Pages subpath + CF Pages root still build (`BASE_PATH`)

## Reviewer notes
- Framing: Scripture authoritative; NASB+ESV (ESV default); Consensus vs Wider Protestant dating; 13 Pauline letters (no Hebrews); no late-authorship schemes as default
- Biographical non-Acts material was dropped or constrained to schema-legal `actsAnchors` where required — flag any overclaim
- MapLibre drops papyrus packet animation / travel-dot for this pass; not a content blocker

## Open when auth is ready
```bash
cd /workspace/letter-and-road
# stage carefully (exclude executor-draft)
git add -A
git reset HEAD content/city-contexts.executor-draft.json
# commit, push, gh pr create — needs write auth
```

Paste the title + body below into `gh pr create` or the GitHub UI.

---

### Title
```
Content schema, city/theme packs, life timeline, MapLibre map
```

### Body
```markdown
## Summary
Adds versioned JSON content + schema validation, then ships city context packs (36), interpretive themes (36), Paul’s life timeline (33 events), 12 compare presets, MapLibre basemap (OpenFreeMap; SVG fallback), and a year scrubber spanning AD 5–68.

**Please do not merge without independent review of the scholarly content** (cities, themes, biographical events, compare insights).

## Contents
- Content schema migration (`content/*`, `schemas/content.schema.json`, `validate:content`)
- City packs → map selection / CityDrawer
- Cultural themes → LetterDrawer
- Life timeline in Explore + biographical.json
- Expanded compare presets (incl. Chains & Suffering)
- MapLibre GL (flag `VITE_USE_MAPLIBRE`; SVG kept)
- Scrubber 5–68; DEPLOY.md for dual hosting

## Test plan
- [ ] `npm run validate:content` && `npm run build`
- [ ] Dev: city drawer, themes, life timeline, scrubber pre-48, MapLibre tiles
- [ ] `VITE_USE_MAPLIBRE=false` SVG fallback
- [ ] Dual deploy BASE_PATH sanity

## Notes
- Excludes `city-contexts.executor-draft.json`
- No Mapbox token; OpenFreeMap Liberty
- Packet/travel-dot animations deferred on MapLibre
```
