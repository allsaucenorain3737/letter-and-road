#!/usr/bin/env node
/**
 * Build-time validation for content/*.json against schemas/content.schema.json.
 * Exits 1 on any invalid file or load error.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = join(root, 'schemas', 'content.schema.json')

const FILES = [
  { file: 'letters.json', def: 'LettersFile' },
  { file: 'cities.json', def: 'CitiesFile' },
  { file: 'journeys.json', def: 'JourneysFile' },
  { file: 'story.json', def: 'StoryFile' },
  { file: 'periods.json', def: 'PeriodsFile' },
  { file: 'compare.json', def: 'CompareFile' },
  { file: 'biographical.json', def: 'BiographicalFile' },
  { file: 'cultural.json', def: 'CulturalFile' },
  { file: 'city-contexts.json', def: 'CityContextsFile' },
]

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
ajv.addSchema(schema)

let failed = false

for (const { file, def } of FILES) {
  const path = join(root, 'content', file)
  if (!existsSync(path)) {
    console.error(`FAIL  ${file}: missing`)
    failed = true
    continue
  }
  let data
  try {
    data = JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    console.error(`FAIL  ${file}: invalid JSON — ${err.message}`)
    failed = true
    continue
  }
  const validate = ajv.getSchema(`https://letter-and-road.local/schemas/content.schema.json#/$defs/${def}`)
  if (!validate) {
    console.error(`FAIL  ${file}: schema $defs/${def} not found`)
    failed = true
    continue
  }
  if (validate(data)) {
    console.log(`OK    ${file}`)
  } else {
    failed = true
    console.error(`FAIL  ${file}:`)
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || '(root)'} ${err.message}`)
    }
  }
}

if (failed) {
  console.error('\nContent validation failed.')
  process.exit(1)
}

console.log('\nAll content files valid.')
