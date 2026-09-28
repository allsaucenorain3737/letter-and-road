import type { CulturalContext } from '../types'
import data from '../../content/cultural.json' with { type: 'json' }

export const CULTURAL_CONTEXTS: CulturalContext[] = data.contexts as CulturalContext[]

export const CULTURAL_CONTEXT_BY_ID: Record<string, CulturalContext> = Object.fromEntries(
  CULTURAL_CONTEXTS.map((c) => [c.id, c]),
)

/** Themes / packs that apply to a letter by id or overlapping theme chips. */
export function culturalContextsForLetter(
  letterId: string,
  letterThemes: string[],
): CulturalContext[] {
  const themeSet = new Set(letterThemes.map((t) => t.toLowerCase()))
  return CULTURAL_CONTEXTS.filter((ctx) => {
    const ids = ctx.appliesTo.letterIds ?? []
    if (ids.includes(letterId)) return true
    const themes = ctx.appliesTo.themes ?? []
    return themes.some((t) => themeSet.has(t.toLowerCase()))
  })
}

/** Cultural packs that apply to a city by id. */
export function culturalContextsForCity(cityId: string): CulturalContext[] {
  return CULTURAL_CONTEXTS.filter((ctx) => {
    const ids = ctx.appliesTo.cityIds ?? []
    return ids.includes(cityId)
  })
}

