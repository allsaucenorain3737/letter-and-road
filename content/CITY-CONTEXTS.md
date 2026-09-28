# City contexts (Pauline Scholar)

# City Contexts — Letter & Road

Travel-guide city packs for Letter & Road (consensus evangelical framing).

## Batch 1

- File: `city-contexts-batch1.json` (v1.0.1-batch1)
- Count: 11
- IDs: ephesus, corinth, philippi, thessalonica, colossae, galatia, pisidian_antioch, iconium, lystra, derbe, rome

## Batch 2

- File: `city-contexts-batch2.json` (v1.0.0-batch2)
- Count: 25
- IDs: antioch, jerusalem, damascus_road, damascus, caesarea, macedonia, crete, nicopolis, athens, troas, cyprus, salamis, tarsus, perga, miletus, malta, puteoli, berea, sidon, myra, fair_havens, syracuse, rhegium, tyre, cenchreae

`themeIds` match `content/cultural.json` context ids.
`id` values match `content/cities.json` (cyprus = Paphos).
`journeyLinks` derived from `content/journeys.json` waypoints (first / second / third / rome-voyage); empty arrays where a city is not on those routes.

Builder: merge into schema (extend City or a `cityContexts` file). No React. No merge to main until independent reviewer sign-off.


Merged into `city-contexts.json`. Batch 1 + Batch 2 = all cities authored.
