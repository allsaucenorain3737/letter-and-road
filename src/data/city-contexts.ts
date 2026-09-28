import type { CityContext } from '../types'
import data from '../../content/city-contexts.json' with { type: 'json' }

export const CITY_CONTEXTS: CityContext[] = data.cityContexts as CityContext[]

export const CITY_CONTEXT_BY_ID: Record<string, CityContext> = Object.fromEntries(
  CITY_CONTEXTS.map((c) => [c.id, c]),
)
