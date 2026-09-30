import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { BIOGRAPHICAL_EVENTS } from '../data/biographical'
import { STORY, type StoryEvent } from '../data/story'
import { LETTER_BY_ID } from '../data/letters'
import { useReducedMotion } from '../hooks'
import { trackPageView } from '../lib/analytics'
import { yearBounds } from '../lib/chronology'
import type { DatingScheme, Filters, Layers, PeriodId, PlantedFilter, StoryPhase, ViewId } from '../types'

const STORAGE_KEY = 'letter-and-road:v4'
const INVITE_SEEN_KEY = 'letter-and-road:invite-seen'

interface Persisted {
  datingScheme?: string
  layers?: Layers
  showTimeline?: boolean
  showLifeTimeline?: boolean
  showScrubber?: boolean
  showTeachingNotes?: boolean
}

interface AppState {
  view: ViewId
  phase: StoryPhase
  storyIndex: number
  selectedLetterId: string | null
  year: number
  layers: Layers
  filters: Filters
  compare: [string | null, string | null]
  menuOpen: boolean
  showTimeline: boolean
  showLifeTimeline: boolean
  showScrubber: boolean
  showTeachingNotes: boolean
  cityId: string | null
}

type Action =
  | { type: 'hydrate'; persisted: Persisted; skipInvite: boolean }
  | { type: 'setView'; view: ViewId }
  | { type: 'selectLetter'; id: string | null }
  | { type: 'setYear'; year: number }
  | { type: 'nudgeYear'; delta: number }
  | { type: 'dismissInvite' }
  | { type: 'storyAdvance' }
  | { type: 'skipStory' }
  | { type: 'beginStory' }
  | { type: 'setLayer'; key: keyof Layers; value: boolean }
  | { type: 'setPlantedFilter'; value: PlantedFilter }
  | { type: 'togglePeriod'; id: PeriodId }
  | { type: 'toggleTheme'; theme: string }
  | { type: 'clearFilters' }
  | { type: 'setCompare'; slot: 0 | 1; id: string | null }
  | { type: 'setComparePair'; a: string; b: string }
  | { type: 'enterComparePair'; a: string; b: string }
  | { type: 'enterExploreCities' }
  | { type: 'enterExploreTimeline' }
  | { type: 'enterExploreThemes'; theme?: string }
  | { type: 'enterBeforePaul' }
  | { type: 'enterAfterPaul' }
  | { type: 'enterVoices' }
  | { type: 'setMenuOpen'; open: boolean }
  | { type: 'setShowTimeline'; value: boolean }
  | { type: 'setShowLifeTimeline'; value: boolean }
  | { type: 'setShowScrubber'; value: boolean }
  | { type: 'setShowTeachingNotes'; value: boolean }
  | { type: 'setCity'; id: string | null }
  | { type: 'applyRoute'; view: ViewId; letterId: string | null; compare: [string | null, string | null] }

const defaultLayers: Layers = {
  imprisonments: false,
}

const defaultFilters: Filters = {
  plantedFilter: 'all',
  periods: [],
  themes: [],
  datingScheme: 'consensus',
}

const initialState: AppState = {
  view: 'atlas',
  phase: 'invite',
  storyIndex: 0,
  selectedLetterId: null,
  year: 48,
  layers: defaultLayers,
  filters: defaultFilters,
  compare: [null, null],
  menuOpen: false,
  showTimeline: false,
  showLifeTimeline: false,
  showScrubber: true,
  showTeachingNotes: false,
  cityId: null,
}

function normalizeScheme(_raw?: string): DatingScheme {
  // Atlas is consensus-only; ignore any persisted alternate scheme.
  return 'consensus'
}

function normalizeLayers(raw: Layers | undefined): Layers {
  if (!raw) return defaultLayers
  return {
    imprisonments: Boolean(raw.imprisonments),
  }
}

function toExplore(state: AppState, patch: Partial<AppState> = {}): AppState {
  return {
    ...state,
    phase: 'explore',
    menuOpen: false,
    ...patch,
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate': {
      const p = action.persisted
      return {
        ...state,
        phase: action.skipInvite ? 'explore' : state.phase,
        menuOpen: false,
        filters: {
          ...state.filters,
          datingScheme: normalizeScheme(p.datingScheme),
        },
        layers: normalizeLayers(p.layers),
        showTimeline: p.showTimeline ?? false,
        showLifeTimeline: p.showLifeTimeline ?? false,
        showScrubber: p.showScrubber ?? true,
        showTeachingNotes: p.showTeachingNotes ?? false,
      }
    }
    case 'setView':
      return { ...state, view: action.view, cityId: null, phase: 'explore' }
    case 'selectLetter':
      return { ...state, selectedLetterId: action.id, cityId: action.id ? null : state.cityId }
    case 'setYear': {
      const { min, max } = yearBounds()
      return { ...state, year: Math.min(max, Math.max(min, action.year)) }
    }
    case 'nudgeYear': {
      const { min, max } = yearBounds()
      return { ...state, year: Math.min(max, Math.max(min, state.year + action.delta)) }
    }

    case 'beginStory': {
      const first = STORY[0]
      return {
        ...state,
        phase: 'playing',
        storyIndex: 0,
        year: first?.year ?? 34,
        menuOpen: false,
        selectedLetterId: null,
        // Keep city drawer closed while the journey animates; map highlights via story event.
        cityId: null,
        view: 'atlas',
        showScrubber: true,
      }
    }
    case 'skipStory':
      return {
        ...state,
        phase: 'explore',
        storyIndex: STORY.length,
        year: 67,
        menuOpen: true,
        view: 'atlas',
        selectedLetterId: null,
        cityId: null,
      }
    case 'storyAdvance': {
      const next = state.storyIndex + 1
      if (next >= STORY.length) {
        return {
          ...state,
          phase: 'explore',
          storyIndex: STORY.length,
          year: 67,
          menuOpen: true,
          cityId: null,
        }
      }
      const ev = STORY[next]
      return {
        ...state,
        storyIndex: next,
        year: ev.year,
        // Do not select a city during playback — that opens CityDrawer over the map.
        cityId: null,
        selectedLetterId: null,
      }
    }
    case 'dismissInvite':
      return toExplore(state, { menuOpen: false, view: 'atlas' })
    case 'enterComparePair':
      return toExplore(state, {
        view: 'compare',
        compare: [action.a, action.b],
        menuOpen: false,
        selectedLetterId: null,
        cityId: null,
      })
    case 'enterExploreCities':
      return toExplore(state, {
        view: 'atlas',
        menuOpen: false,
        showScrubber: true,
        selectedLetterId: null,
      })
    case 'enterExploreTimeline':
      return toExplore(state, {
        view: 'atlas',
        menuOpen: false,
        showTimeline: true,
        showLifeTimeline: true,
        showScrubber: true,
        selectedLetterId: null,
      })
    case 'enterExploreThemes': {
      const themes = action.theme
        ? state.filters.themes.includes(action.theme)
          ? state.filters.themes
          : [...state.filters.themes, action.theme]
        : state.filters.themes
      return toExplore(state, {
        view: 'atlas',
        menuOpen: false,
        showTimeline: true,
        showScrubber: true,
        filters: { ...state.filters, themes },
        selectedLetterId: null,
      })
    }
    case 'enterBeforePaul':
      // Existing bio: Stephen persecution → Damascus road (Acts 7–9 era). No new narrative.
      return toExplore(state, {
        view: 'atlas',
        menuOpen: false,
        showLifeTimeline: true,
        showScrubber: true,
        year: 34,
        cityId: 'damascus_road',
        selectedLetterId: null,
      })
    case 'enterAfterPaul':
      // Acts open end + late Rome / 2 Timothy era via existing timeline + city. Tradition not asserted as Scripture.
      return toExplore(state, {
        view: 'atlas',
        menuOpen: false,
        showLifeTimeline: true,
        showScrubber: true,
        year: 62,
        cityId: 'rome',
        selectedLetterId: null,
      })
    case 'enterVoices':
      return toExplore(state, {
        view: 'voices',
        menuOpen: false,
        selectedLetterId: null,
        cityId: null,
      })
    case 'setLayer': {
      const layers = { ...state.layers, [action.key]: action.value }
      return { ...state, layers }
    }
    case 'setPlantedFilter':
      return { ...state, filters: { ...state.filters, plantedFilter: action.value } }
    case 'togglePeriod': {
      const has = state.filters.periods.includes(action.id)
      const periods = has
        ? state.filters.periods.filter((p) => p !== action.id)
        : [...state.filters.periods, action.id]
      return { ...state, filters: { ...state.filters, periods } }
    }
    case 'toggleTheme': {
      const has = state.filters.themes.includes(action.theme)
      const themes = has
        ? state.filters.themes.filter((t) => t !== action.theme)
        : [...state.filters.themes, action.theme]
      return { ...state, filters: { ...state.filters, themes } }
    }
    case 'clearFilters':
      return {
        ...state,
        filters: { ...defaultFilters },
      }
    case 'setCompare': {
      const compare: [string | null, string | null] = [...state.compare]
      compare[action.slot] = action.id
      return { ...state, compare, view: 'compare', menuOpen: false, phase: 'explore' }
    }
    case 'setComparePair':
      return {
        ...state,
        compare: [action.a, action.b],
        view: 'compare',
        menuOpen: false,
        phase: 'explore',
      }
    case 'setMenuOpen':
      return { ...state, menuOpen: action.open }
    case 'setShowTimeline':
      return { ...state, showTimeline: action.value }
    case 'setShowLifeTimeline':
      return { ...state, showLifeTimeline: action.value }
    case 'setShowScrubber':
      return { ...state, showScrubber: action.value }
    case 'setShowTeachingNotes':
      return { ...state, showTeachingNotes: action.value }
    case 'setCity': {
      const hasBioPlace =
        Boolean(action.id) &&
        BIOGRAPHICAL_EVENTS.some((ev) => ev.placeId === action.id)
      return {
        ...state,
        cityId: action.id,
        selectedLetterId: action.id ? null : state.selectedLetterId,
        ...(hasBioPlace ? { showLifeTimeline: true } : {}),
      }
    }
    case 'applyRoute': {
      const deep = action.view !== 'atlas' || Boolean(action.letterId) || Boolean(action.compare[0])
      return {
        ...state,
        view: action.view,
        selectedLetterId: action.letterId,
        compare: action.compare,
        ...(deep ? { phase: 'explore' as const } : {}),
      }
    }
  }
}

interface AppContextValue extends AppState {
  selectLetter: (id: string | null) => void
  setView: (view: ViewId) => void
  setYear: (year: number) => void
  nudgeYear: (delta: number) => void
  dismissInvite: () => void
  beginStory: () => void
  skipStory: () => void
  currentStoryEvent: StoryEvent | null
  enterComparePair: (a: string, b: string) => void
  enterExploreCities: () => void
  enterExploreTimeline: () => void
  enterExploreThemes: (theme?: string) => void
  enterBeforePaul: () => void
  enterAfterPaul: () => void
  enterVoices: () => void
  setLayer: (key: keyof Layers, value: boolean) => void
  setPlantedFilter: (value: PlantedFilter) => void
  togglePeriod: (id: PeriodId) => void
  toggleTheme: (theme: string) => void
  clearFilters: () => void
  setCompare: (slot: 0 | 1, id: string | null) => void
  setComparePair: (a: string, b: string) => void
  setMenuOpen: (open: boolean) => void
  setShowTimeline: (value: boolean) => void
  setShowLifeTimeline: (value: boolean) => void
  setShowScrubber: (value: boolean) => void
  setShowTeachingNotes: (value: boolean) => void
  setCity: (id: string | null) => void
  filterActive: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

function parseHash(): {
  view: ViewId
  letterId: string | null
  compare: [string | null, string | null]
} {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const parts = raw.split('/').filter(Boolean)
  const views: ViewId[] = ['atlas', 'compare', 'about', 'voices']
  let view: ViewId = 'atlas'
  let letterId: string | null = null
  const compare: [string | null, string | null] = [null, null]
  let i = 0
  if (parts[0] === 'timeline') {
    view = 'atlas'
    i = 1
  } else if (parts[0] && views.includes(parts[0] as ViewId)) {
    view = parts[0] as ViewId
    i = 1
  }
  if (parts[i] === 'letter' && parts[i + 1] && LETTER_BY_ID[parts[i + 1]]) {
    letterId = parts[i + 1]
  } else if (view === 'compare' && parts[1] && parts[2]) {
    compare[0] = LETTER_BY_ID[parts[1]] ? parts[1] : null
    compare[1] = LETTER_BY_ID[parts[2]] ? parts[2] : null
  }
  return { view, letterId, compare }
}

function writeHash(state: AppState) {
  let hash = `#/${state.view}`
  if (state.view === 'compare' && state.compare[0] && state.compare[1]) {
    hash = `#/compare/${state.compare[0]}/${state.compare[1]}`
  } else if (state.selectedLetterId) {
    hash = `#/${state.view}/letter/${state.selectedLetterId}`
  }
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', hash)
  }
}

function markInviteSeen() {
  try {
    localStorage.setItem(INVITE_SEEN_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const reduced = useReducedMotion()

  useEffect(() => {
    let inviteSeen = false
    try {
      inviteSeen = localStorage.getItem(INVITE_SEEN_KEY) === '1'
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('letter-and-road:v3')
      const persisted = raw ? (JSON.parse(raw) as Persisted) : {}
      const route = parseHash()
      const deepLink =
        route.view !== 'atlas' || Boolean(route.letterId) || Boolean(route.compare[0])
      dispatch({
        type: 'hydrate',
        persisted,
        skipInvite: inviteSeen || deepLink || reduced,
      })
      if (inviteSeen || deepLink || reduced) markInviteSeen()
    } catch {
      if (reduced) dispatch({ type: 'dismissInvite' })
    }
    dispatch({ type: 'applyRoute', ...parseHash() })
  }, [reduced])

  useEffect(() => {
    const onHash = () => dispatch({ type: 'applyRoute', ...parseHash() })
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    writeHash(state)
    trackPageView()
  }, [state.view, state.selectedLetterId, state.compare])

  useEffect(() => {
    const persisted: Persisted = {
      datingScheme: state.filters.datingScheme,
      layers: state.layers,
      showTimeline: state.showTimeline,
      showLifeTimeline: state.showLifeTimeline,
      showScrubber: state.showScrubber,
      showTeachingNotes: state.showTeachingNotes,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      /* ignore */
    }
  }, [state.filters.datingScheme, state.layers, state.showTimeline, state.showLifeTimeline, state.showScrubber, state.showTeachingNotes])

  useEffect(() => {
    if (state.phase === 'explore') markInviteSeen()
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'playing') return
    if (reduced) {
      dispatch({ type: 'skipStory' })
      return
    }
    const ev = STORY[state.storyIndex]
    if (!ev) {
      dispatch({ type: 'skipStory' })
      return
    }
    const id = window.setTimeout(() => dispatch({ type: 'storyAdvance' }), ev.duration)
    return () => window.clearTimeout(id)
  }, [state.phase, state.storyIndex, reduced])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (typing) return
      if (e.key === 'Escape') {
        if (state.phase === 'invite') {
          dispatch({ type: 'dismissInvite' })
          return
        }
        if (state.phase === 'playing') {
          dispatch({ type: 'skipStory' })
          return
        }
        if (state.selectedLetterId) dispatch({ type: 'selectLetter', id: null })
        else if (state.cityId) dispatch({ type: 'setCity', id: null })
        else if (state.menuOpen) dispatch({ type: 'setMenuOpen', open: false })
        return
      }
      if (state.view !== 'atlas' || state.phase !== 'explore') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        dispatch({ type: 'nudgeYear', delta: -1 })
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        dispatch({ type: 'nudgeYear', delta: 1 })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.selectedLetterId, state.cityId, state.phase, state.view, state.menuOpen])

  const selectLetter = useCallback((id: string | null) => dispatch({ type: 'selectLetter', id }), [])
  const setView = useCallback((view: ViewId) => dispatch({ type: 'setView', view }), [])
  const setYear = useCallback((year: number) => dispatch({ type: 'setYear', year }), [])
  const nudgeYear = useCallback((delta: number) => dispatch({ type: 'nudgeYear', delta }), [])
  const dismissInvite = useCallback(() => dispatch({ type: 'dismissInvite' }), [])
  const beginStory = useCallback(() => dispatch({ type: 'beginStory' }), [])
  const skipStory = useCallback(() => dispatch({ type: 'skipStory' }), [])
  const enterComparePair = useCallback(
    (a: string, b: string) => dispatch({ type: 'enterComparePair', a, b }),
    [],
  )
  const enterExploreCities = useCallback(() => dispatch({ type: 'enterExploreCities' }), [])
  const enterExploreTimeline = useCallback(() => dispatch({ type: 'enterExploreTimeline' }), [])
  const enterExploreThemes = useCallback(
    (theme?: string) => dispatch({ type: 'enterExploreThemes', theme }),
    [],
  )
  const enterBeforePaul = useCallback(() => dispatch({ type: 'enterBeforePaul' }), [])
  const enterAfterPaul = useCallback(() => dispatch({ type: 'enterAfterPaul' }), [])
  const enterVoices = useCallback(() => dispatch({ type: 'enterVoices' }), [])
  const setLayer = useCallback(
    (key: keyof Layers, value: boolean) => dispatch({ type: 'setLayer', key, value }),
    [],
  )
  const setPlantedFilter = useCallback(
    (value: PlantedFilter) => dispatch({ type: 'setPlantedFilter', value }),
    [],
  )
  const togglePeriod = useCallback((id: PeriodId) => dispatch({ type: 'togglePeriod', id }), [])
  const toggleTheme = useCallback((theme: string) => dispatch({ type: 'toggleTheme', theme }), [])
  const clearFilters = useCallback(() => dispatch({ type: 'clearFilters' }), [])
  const setCompare = useCallback(
    (slot: 0 | 1, id: string | null) => dispatch({ type: 'setCompare', slot, id }),
    [],
  )
  const setComparePair = useCallback(
    (a: string, b: string) => dispatch({ type: 'setComparePair', a, b }),
    [],
  )
  const setMenuOpen = useCallback((open: boolean) => dispatch({ type: 'setMenuOpen', open }), [])
  const setShowTimeline = useCallback(
    (value: boolean) => dispatch({ type: 'setShowTimeline', value }),
    [],
  )
  const setShowLifeTimeline = useCallback(
    (value: boolean) => dispatch({ type: 'setShowLifeTimeline', value }),
    [],
  )
  const setShowScrubber = useCallback(
    (value: boolean) => dispatch({ type: 'setShowScrubber', value }),
    [],
  )
  const setShowTeachingNotes = useCallback(
    (value: boolean) => dispatch({ type: 'setShowTeachingNotes', value }),
    [],
  )
  const setCity = useCallback((id: string | null) => dispatch({ type: 'setCity', id }), [])

  const filterActive =
    state.filters.plantedFilter !== 'all' ||
    state.filters.periods.length > 0 ||
    state.filters.themes.length > 0

  const currentStoryEvent =
    state.phase === 'playing' && state.storyIndex >= 0 ? (STORY[state.storyIndex] ?? null) : null

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      selectLetter,
      setView,
      setYear,
      nudgeYear,
      dismissInvite,
      beginStory,
      skipStory,
      currentStoryEvent,
      enterComparePair,
      enterExploreCities,
      enterExploreTimeline,
      enterExploreThemes,
      enterBeforePaul,
      enterAfterPaul,
      enterVoices,
      setLayer,
      setPlantedFilter,
      togglePeriod,
      toggleTheme,
      clearFilters,
      setCompare,
      setComparePair,
      setMenuOpen,
      setShowTimeline,
      setShowLifeTimeline,
      setShowScrubber,
      setShowTeachingNotes,
      setCity,
      filterActive,
    }),
    [
      state,
      selectLetter,
      setView,
      setYear,
      nudgeYear,
      dismissInvite,
      beginStory,
      skipStory,
      currentStoryEvent,
      enterComparePair,
      enterExploreCities,
      enterExploreTimeline,
      enterExploreThemes,
      enterBeforePaul,
      enterAfterPaul,
      enterVoices,
      setLayer,
      setPlantedFilter,
      togglePeriod,
      toggleTheme,
      clearFilters,
      setCompare,
      setComparePair,
      setMenuOpen,
      setShowTimeline,
      setShowLifeTimeline,
      setShowScrubber,
      setShowTeachingNotes,
      setCity,
      filterActive,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
