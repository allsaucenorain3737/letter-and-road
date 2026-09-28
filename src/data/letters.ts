import type { Letter } from '../types'
import data from '../../content/letters.json' with { type: 'json' }

export const LETTERS: Letter[] = data.letters as Letter[]

export const LETTER_BY_ID: Record<string, Letter> = Object.fromEntries(
  LETTERS.map((l) => [l.id, l]),
)
