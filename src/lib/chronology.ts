import { LETTERS } from '../data/letters'
import type { Dating, DatingScheme, Filters, Letter, PeriodId } from '../types'

export function datingOf(letter: Letter, scheme: DatingScheme): Dating {
  return scheme === 'debated' ? letter.debated : letter.consensus
}

export function yearBounds(_scheme?: DatingScheme): { min: number; max: number } {
  return { min: 48, max: 68 }
}

export function yearPosition(year: number, _scheme?: DatingScheme): number {
  const { min, max } = yearBounds()
  return (year - min) / (max - min)
}

export function yearFromPosition(t: number, _scheme?: DatingScheme): number {
  const clamped = Math.min(1, Math.max(0, t))
  return Math.round(48 + clamped * (68 - 48))
}

export type ArcState = 'future' | 'current' | 'past'

export function arcState(letter: Letter, year: number, scheme: DatingScheme): ArcState {
  const d = datingOf(letter, scheme)
  if (year >= d.yearStart && year <= d.yearEnd) return 'current'
  if (year > d.yearEnd) return 'past'
  return 'future'
}

export function matchesFilters(letter: Letter, filters: Filters): boolean {
  const d = datingOf(letter, filters.datingScheme)

  if (filters.plantedFilter === 'planted' && letter.audienceType !== 'planted') return false
  if (filters.plantedFilter === 'unvisited' && letter.audienceType !== 'unvisited') return false
  if (
    filters.plantedFilter === 'individuals' &&
    letter.audienceType !== 'delegate' &&
    letter.audienceType !== 'household'
  ) {
    return false
  }

  if (filters.periods.length > 0 && !filters.periods.includes(d.period)) return false

  if (filters.themes.length > 0 && !filters.themes.some((t) => letter.themes.includes(t))) {
    return false
  }

  return true
}

export function lettersInPlayOrder(scheme: DatingScheme): Letter[] {
  return [...LETTERS].sort((a, b) => {
    const da = datingOf(a, scheme)
    const db = datingOf(b, scheme)
    if (da.yearStart !== db.yearStart) return da.yearStart - db.yearStart
    if (da.yearEnd !== db.yearEnd) return da.yearEnd - db.yearEnd
    return a.sort - b.sort
  })
}

export function captionFor(letter: Letter, scheme: DatingScheme): string {
  const d = datingOf(letter, scheme)
  const year =
    d.yearStart === d.yearEnd ? `AD ${d.yearStart}` : `AD ${d.yearStart}–${d.yearEnd}`
  return `${year} · ${d.originLabel} → ${letter.destinationLabel} · ${letter.shortTitle}`
}

export function lettersForCity(cityId: string, scheme: DatingScheme): Letter[] {
  return LETTERS.filter((l) => {
    const d = datingOf(l, scheme)
    return d.originId === cityId || l.destinationId === cityId || d.altOriginId === cityId
  })
}

export const FILTERABLE_PERIODS: PeriodId[] = [
  'after-first',
  'second-journey',
  'third-journey',
  'caesarea',
  'first-roman',
  'after-acts',
]
