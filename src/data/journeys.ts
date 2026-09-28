import type { Imprisonment, Journey } from '../types'
import data from '../../content/journeys.json' with { type: 'json' }

export const JOURNEYS: Journey[] = data.journeys as Journey[]

export const IMPRISONMENTS: Imprisonment[] = data.imprisonments as Imprisonment[]
