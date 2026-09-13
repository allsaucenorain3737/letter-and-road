export type AudienceType = 'planted' | 'unvisited' | 'delegate' | 'household'

export type DatingScheme = 'consensus' | 'debated'

export type StoryPhase = 'playing' | 'explore'

export type PeriodId =
  | 'after-first'
  | 'second-journey'
  | 'third-journey'
  | 'caesarea'
  | 'first-roman'
  | 'after-acts'

export type ThemeGroup = 'coming' | 'cross' | 'christ' | 'church'

export type ViewId = 'atlas' | 'compare' | 'about'

export type PlantedFilter = 'all' | 'planted' | 'unvisited' | 'individuals'

export interface ScriptureRef {
  label: string
  search: string
  note?: string
}

export interface OutlineSection {
  ref: string
  heading: string
  summary: string
  search: string
}

export interface NamedPerson {
  name: string
  role: string
  search?: string
}

export interface Dating {
  yearStart: number
  yearEnd: number
  yearDisplay: string
  originId: string
  originLabel: string
  originNote?: string
  period: PeriodId
  debateNote?: string
  altOriginId?: string
  altOriginLabel?: string
}

export interface Letter {
  id: string
  title: string
  shortTitle: string
  sort: number
  book: string
  bibleSearch: string
  destinationId: string
  destinationLabel: string
  audienceType: AudienceType
  audiencePortrait: string
  occasion: string
  outline: OutlineSection[]
  themes: string[]
  themeGroup: ThemeGroup
  narrowedAudience?: string
  people: NamedPerson[]
  datingNote: string
  actsAnchors: ScriptureRef[]
  letterAnchors: ScriptureRef[]
  otherWitness?: ScriptureRef[]
  consensus: Dating
  debated: Dating
  arcBulge: number
}

export interface City {
  id: string
  name: string
  shortLabel: string
  lon: number
  lat: number
  kind: 'city' | 'region'
  planted: boolean
  letterRelevant: boolean
  description: string
}

export interface Journey {
  id: string
  label: string
  years: string
  waypoints: string[]
}

export interface Imprisonment {
  id: string
  cityId: string
  label: string
  years: string
  note: string
  offset: [number, number]
}

export interface PeriodMeta {
  id: PeriodId
  label: string
  years: string
  hint?: string
}

export interface Layers {
  journeys: boolean
  letters: boolean
  imprisonments: boolean
  citiesOnly: boolean
}

export interface Filters {
  plantedFilter: PlantedFilter
  periods: PeriodId[]
  themes: string[]
  datingScheme: DatingScheme
}

export interface ComparePair {
  a: string
  b: string
  insight: string
}
