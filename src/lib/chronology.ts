import { BIOGRAPHICAL_EVENTS } from '../data/biographical'
import { LETTERS } from '../data/letters'
import type { Dating, DatingScheme, Filters, Letter, PeriodId } from '../types'

export function datingOf(letter: Letter, scheme: DatingScheme): Dating {
  return scheme === 'debated' ? letter.debated : letter.consensus
}

export function yearBounds(_scheme?: DatingScheme): { min: number; max: number } {
  const bioMin = BIOGRAPHICAL_EVENTS.reduce((min, event) => Math.min(min, event.yearStart), Infinity)
  const bioMax = BIOGRAPHICAL_EVENTS.reduce(
    (max, event) => Math.max(max, event.yearEnd ?? event.yearStart),
    -Infinity,
  )
  const letterMin = LETTERS.reduce(
    (min, letter) => Math.min(min, letter.consensus.yearStart, letter.debated.yearStart),
    Infinity,
  )
  const letterMax = LETTERS.reduce(
    (max, letter) => Math.max(max, letter.consensus.yearEnd, letter.debated.yearEnd),
    -Infinity,
  )

  // Keep the scrubber useful even if a future content edit omits one source.
  return {
    min: Math.min(5, bioMin, letterMin),
    max: Math.max(68, bioMax, letterMax),
  }
}

export function yearPosition(year: number, _scheme?: DatingScheme): number {
  const { min, max } = yearBounds()
  return Math.min(1, Math.max(0, (year - min) / (max - min)))
}

export function yearFromPosition(t: number, _scheme?: DatingScheme): number {
  const { min, max } = yearBounds()
  const clamped = Math.min(1, Math.max(0, t))
  return Math.round(min + clamped * (max - min))
}

export function yearTicks(_scheme?: DatingScheme): number[] {
  const { min, max } = yearBounds()
  const anchors = [min, 15, 30, 40, 48, 57, max]
  return [...new Set(anchors.filter((year) => year >= min && year <= max))]
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
