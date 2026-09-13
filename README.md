# Letter & Road

**Pauline Atlas** — a public teaching site that treats each of Paul’s letters as a directed object in time and space: when, from where, to whom, why now, and what it actually says.

> See each of Paul’s letters as a message from a place, to a people, at a moment.

This is not another missionary-journey map with letter names sprinkled on. The atomic unit is the letter.

## Run locally

```bash
cd letter-and-road
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

Live preview for friends and critics: **https://tgkoetje.github.io/letter-and-road/**

## Deploy (static)

The build is a static site: GitHub Pages, Cloudflare Pages, Netlify, or any static host.

GitHub Pages (project site) needs a base path:

```bash
# macOS / Linux
BASE_PATH=/letter-and-road/ npm run build

# Windows PowerShell
$env:BASE_PATH="/letter-and-road/"; npm run build
```

Point the host at the `dist/` folder. Routing uses hashes (`#/atlas`, `#/compare`, `#/about`, `#/atlas/letter/romans`), so no server rewrite rules are required.

## What v1 includes

- **Full-page map first** — play Paul’s roads and letters in order, or skip to explore. Timeline, year slider, and filters live in a top menu
- **Travels vs letters** — Acts routes walk/sail along the land and sea; letters fly as arcs from origin to destination
- **ESV only** — every Scripture link opens Bible Gateway in the ESV
- **Letter drawer** — occasion, outline, audience, people, dating note, and deep Bible Gateway links (KJV, NASB, ESV, NIV) into Acts, the letter, and other apostles
- **Compare** — two letters side by side, with presets
- **Filters** — audience, period, theme, Consensus vs Wider Protestant debate
- **About / method** — Scripture as primary source; introductions and archaeology as secondary

All thirteen letters are embedded. There is no backend, no auth, and no runtime API keys. The map is a custom SVG, so the atlas never depends on a tile server.

## Dating

**Consensus** (default) is a narrowed evangelical Protestant reading, reconstructed first from Acts and the letters: early Galatians, Thessalonian letters from Corinth (Acts 18), Corinthian correspondence and Romans on the third journey, prison letters from Rome (Acts 28), Pastorals after Acts.

**Wider debate** stretches the years Protestants still argue about (south vs north Galatia; Rome / Ephesus / Caesarea for prison letters; how 1 Timothy and Titus fit after Acts). It does not delete letters and does not import a late-authorship critical scheme.

Primary sources: the Greek and Hebrew Scriptures as read in KJV, NASB, ESV, and NIV; Acts; the thirteen letters; other apostles (2 Peter 3:15–16). Secondary: introductions, study Bibles, the Gallio inscription.

Not affiliated with a denomination.

## Keyboard

- `←` `→` nudge the year (Atlas)
- `Esc` closes the letter drawer

Reduced-motion preferences skip the play-through animation.
