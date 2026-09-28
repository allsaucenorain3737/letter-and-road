import type { AudienceType, PeriodMeta, ThemeGroup } from '../types'
import data from '../../content/periods.json' with { type: 'json' }

export const PERIODS: PeriodMeta[] = data.periods as PeriodMeta[]

export const AUDIENCE_META: Record<
  AudienceType,
  { label: string; short: string; color: string; ink: string }
> = data.audienceMeta as Record<
  AudienceType,
  { label: string; short: string; color: string; ink: string }
>

export const THEME_GROUPS: { id: ThemeGroup; label: string; hint: string }[] =
  data.themeGroups as { id: ThemeGroup; label: string; hint: string }[]

export const THEME_FILTERS: string[] = data.themeFilters as string[]
