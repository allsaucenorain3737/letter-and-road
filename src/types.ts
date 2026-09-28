export type AudienceType = 'planted' | 'unvisited' | 'delegate' | 'household'

export type DatingScheme = 'consensus' | 'debated'

export type StoryPhase = 'invite' | 'explore'

export type PeriodId =
  | 'after-first'
  | 'second-journey'
  | 'third-journey'
  | 'caesarea'
  | 'first-roman'
  | 'after-acts'

export type ThemeGroup = 'coming' | 'cross' | 'christ' | 'church'

export type ViewId = 'atlas' | 'compare' | 'about' | 'voices'

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
  imprisonments: boolean
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

export interface BiographicalEvent {
  id: string
  title: string
  yearStart: number
  yearEnd?: number
  yearDisplay: string
  placeId?: string
  summary: string
  actsAnchors?: ScriptureRef[]
  tags?: string[]
}

export type CulturalCategory =
  | 'social'
  | 'religious'
  | 'political'
  | 'theological'
  | 'daily-life'

export type CulturalAssumption = 'western' | 'eastern' | 'both'

export interface CulturalContext {
  id: string
  title: string
  category?: CulturalCategory
  appliesTo: { letterIds?: string[]; cityIds?: string[]; themes?: string[] }
  summary: string
  body: string
  scriptureAnchors?: ScriptureRef[]
  whyItMattersToday?: string
  culturalAssumption?: CulturalAssumption
  relatedIds?: string[]
  sources?: { label: string; url?: string; note?: string }[]
}

export interface JourneyLinks {
  prevCityIds: string[]
  nextCityIds: string[]
}

export interface CityContext {
  id: string
  intro: string
  politicalStatus: string
  culturalDistinctive: string
  paulThere: string
  letterIds: string[]
  themeIds: string[]
  journeyLinks: JourneyLinks
  scriptureAnchors: ScriptureRef[]
  sources?: { label: string; url?: string; note?: string }[]
}
