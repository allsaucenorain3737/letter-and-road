/**
 * One-shot migration: import existing TS data modules and write content/*.json
 * Run with: npx tsx scripts/extract-content.mjs  (tsx can load .ts via dynamic import below)
 * Actually we use a companion .ts file for clean imports.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'content')
mkdirSync(outDir, { recursive: true })

const { LETTERS } = await import('../src/data/letters.ts')
const { CITIES } = await import('../src/data/cities.ts')
const { JOURNEYS, IMPRISONMENTS } = await import('../src/data/journeys.ts')
const { STORY, START_LABEL_IDS } = await import('../src/data/story.ts')
const { PERIODS, AUDIENCE_META, THEME_GROUPS, THEME_FILTERS } = await import('../src/data/periods.ts')
const { PRESET_COMPARISONS } = await import('../src/data/compare.ts')

function write(name, data) {
  const path = join(outDir, name)
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`wrote ${name}`)
}

write('letters.json', { letters: LETTERS })
write('cities.json', { cities: CITIES })
write('journeys.json', { journeys: JOURNEYS, imprisonments: IMPRISONMENTS })
write('story.json', {
  story: STORY,
  startLabelIds: [...START_LABEL_IDS],
})
write('periods.json', {
  periods: PERIODS,
  audienceMeta: AUDIENCE_META,
  themeGroups: THEME_GROUPS,
  themeFilters: THEME_FILTERS,
})
write('compare.json', { presets: PRESET_COMPARISONS })
write('biographical.json', { events: [] })
write('cultural.json', { contexts: [] })

console.log(`letters: ${LETTERS.length}, cities: ${CITIES.length}, journeys: ${JOURNEYS.length}, story: ${STORY.length}`)
