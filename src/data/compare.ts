import type { ComparePair, DatingScheme, Letter } from '../types'
import { datingOf } from '../lib/chronology'
import data from '../../content/compare.json' with { type: 'json' }

export const PRESET_COMPARISONS: ComparePair[] = data.presets as ComparePair[]

export function compareInsight(a: Letter, b: Letter, scheme: DatingScheme): string {
  const ids = [a.id, b.id].sort().join('|')
  const preset = PRESET_COMPARISONS.find((p) => [p.a, p.b].sort().join('|') === ids)
  if (preset) return preset.insight

  const da = datingOf(a, scheme)
  const db = datingOf(b, scheme)
  const bits: string[] = []

  if (a.audienceType !== b.audienceType) {
    bits.push(
      `${a.shortTitle} speaks to a ${labelAudience(a)}; ${b.shortTitle} speaks to a ${labelAudience(b)}. When the room changes, the letter’s job changes with it.`,
    )
  }

  const aChains = da.period === 'first-roman' || da.period === 'after-acts' || a.id === '2timothy'
  const bChains = db.period === 'first-roman' || db.period === 'after-acts' || b.id === '2timothy'
  if (aChains !== bChains) {
    const chained = aChains ? a.shortTitle : b.shortTitle
    const road = aChains ? b.shortTitle : a.shortTitle
    bits.push(
      `${chained} is written from custody; ${road} is written from the road. Chains slow the writer and raise the stakes of every name he still dares to send.`,
    )
  }

  if (a.themeGroup !== b.themeGroup) {
    bits.push(
      `Dominant pressure differs: ${a.shortTitle} leans toward ${groupWord(a.themeGroup)}; ${b.shortTitle} toward ${groupWord(b.themeGroup)}.`,
    )
  }

  if (scheme === 'debated' && (da.debateNote || db.debateNote)) {
    bits.push('Wider Protestant dating stretches the year-window; the from/to of the letter in the text stays in view.')
  }

  if (bits.length === 0) {
    bits.push(
      `Both are ${labelAudience(a)} letters. Read the occasions side by side: even the same kind of audience, in a different year and city, is not the same document.`,
    )
  }

  bits.push(
    'What changes when the audience shrinks or the writer is in chains is never only tone. It is who must do something when the letter is read aloud.',
  )

  return bits.join(' ')
}

function labelAudience(letter: Letter): string {
  switch (letter.audienceType) {
    case 'planted':
      return 'planted congregation'
    case 'unvisited':
      return 'church he had not visited'
    case 'delegate':
      return 'coworker / delegate'
    case 'household':
      return 'household'
  }
}

function groupWord(group: Letter['themeGroup']): string {
  switch (group) {
    case 'coming':
      return 'the Coming'
    case 'cross':
      return 'the Cross'
    case 'christ':
      return 'Christ’s person and union'
    case 'church':
      return 'the Church’s order and life'
  }
}
