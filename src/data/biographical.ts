import type { BiographicalEvent } from '../types'
import data from '../../content/biographical.json' with { type: 'json' }

export const BIOGRAPHICAL_EVENTS: BiographicalEvent[] = data.events as BiographicalEvent[]
