import type { City } from '../types'
import data from '../../content/cities.json' with { type: 'json' }

export const CITIES: City[] = data.cities as City[]

export const CITY_BY_ID: Record<string, City> = Object.fromEntries(
  CITIES.map((c) => [c.id, c]),
)
