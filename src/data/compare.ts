import type { ComparePair, DatingScheme, Letter } from '../types'
import { datingOf } from '../lib/chronology'

export const PRESET_COMPARISONS: ComparePair[] = [
  {
    a: 'romans',
    b: '1corinthians',
    insight:
      'Romans is a reasoned gospel for an unvisited mixed church in the capital; 1 Corinthians is crisis care for a plant Paul knew too well. Write strangers and you argue. Write your own and you intervene. Corinth gets the word of the cross as a rebuke to factions; Rome gets the same gospel as a charter for Jew and Gentile who have never met the apostle.',
  },
  {
    a: 'ephesians',
    b: 'philemon',
    insight:
      'Same prison, same courier circle, utterly different scale. Ephesians addresses the church as a cosmic body and a walk worthy of the calling. Philemon asks one host to take a runaway back as a brother. Chains can produce both the high ecclesiology and the household appeal — the audience decides which letter you get. That is why Philemon is not a miniature Ephesians.',
  },
  {
    a: '1thessalonians',
    b: '2timothy',
    insight:
      'Dawn versus dusk. 1 Thessalonians steadies a young planted church grieving the dead before the parousia; the “you” is plural, the future is shared. 2 Timothy is a last dispatch to one protégé from a cell: names of deserters, a cloak, come before winter. Both are pastoral. Only one is a farewell. Imprisonment and a shrinking audience change the temperature of hope.',
  },
  {
    a: '1timothy',
    b: 'romans',
    insight:
      'Romans theologically builds a people Paul has not met; 1 Timothy tells a delegate how to appoint overseers among people already gathered. Shrink the audience from a capital church to one coworker, and the genre becomes a charge. Church order in 1 Timothy is a field manual. Justification in Romans is a shared confession for strangers about to host a mission to Spain.',
  },
]

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
