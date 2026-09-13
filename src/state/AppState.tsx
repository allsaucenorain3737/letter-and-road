import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { LETTER_BY_ID } from '../data/letters'
import { STORY } from '../data/story'
import { useReducedMotion } from '../hooks'
import { yearBounds } from '../lib/chronology'
import type { DatingScheme, Filters, Layers, PeriodId, PlantedFilter, StoryPhase, ViewId } from '../types'

const STORAGE_KEY = 'letter-and-road:v3'

interface Persisted {
  datingScheme?: string
  layers?: Layers
  showTimeline?: boolean
  showScrubber?: boolean
}

interface AppState {
  view: ViewId
  phase: StoryPhase
  storyIndex: number
  selectedLetterId: string | null
  year: number
  playCaption: string | null
  layers: Layers
  filters: Filters
  compare: [string | null, string | null]
  menuOpen: boolean
  showTimeline: boolean
  showScrubber: boolean
  cityId: string | null
}

type Action =
  | { type: 'hydrate'; persisted: Persisted }
  | { type: 'setView'; view: ViewId }
  | { type: 'selectLetter'; id: string | null }
  | { type: 'setYear'; year: number }
  | { type: 'nudgeYear'; delta: number }
  | { type: 'beginStory' }
  | { type: 'skipStory' }
  | { type: 'storyAdvance' }
  | { type: 'setLayer'; key: keyof Layers; value: boolean }
  | { type: 'setPlantedFilter'; value: PlantedFilter }
  | { type: 'togglePeriod'; id: PeriodId }
  | { type: 'toggleTheme'; theme: string }
  | { type: 'clearFilters' }
  | { type: 'setScheme'; scheme: DatingScheme }
  | { type: 'setCompare'; slot: 0 | 1; id: string | null }
  | { type: 'setComparePair'; a: string; b: string }
  | { type: 'setMenuOpen'; open: boolean }
  | { type: 'setShowTimeline'; value: boolean }
  | { type: 'setShowScrubber'; value: boolean }
  | { type: 'setCity'; id: string | null }
  | { type: 'applyRoute'; view: ViewId; letterId: string | null; compare: [string | null, string | null] }

const defaultLayers: Layers = {
  journeys: true,
  letters: true,
  imprisonments: false,
  citiesOnly: false,
}

const defaultFilters: Filters = {
  plantedFilter: 'all',
  periods: [],
  themes: [],
  datingScheme: 'consensus',
}

const initialState: AppState = {
  view: 'atlas',
  phase: 'playing',
  storyIndex: 0,
  selectedLetterId: null,
  year: STORY[0]?.year ?? 34,
  playCaption: STORY[0]?.caption ?? null,
  layers: defaultLayers,
  filters: defaultFilters,
  compare: [null, null],
  menuOpen: false,
  showTimeline: false,
  showScrubber: false,
  cityId: null,
}

function normalizeScheme(raw: string | undefined): DatingScheme {
  if (raw === 'debated' || raw === 'critical') return 'debated'
  return 'consensus'
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate': {
      const p = action.persisted
      return {
        ...state,
        filters: {
          ...state.filters,
          datingScheme: normalizeScheme(p.datingScheme),
        },
        layers: p.layers ?? state.layers,
        showTimeline: p.showTimeline ?? false,
        showScrubber: p.showScrubber ?? false,
      }
    }
    case 'setView':
      return { ...state, view: action.view, cityId: null }
    case 'selectLetter':
      return { ...state, selectedLetterId: action.id, cityId: action.id ? null : state.cityId }
    case 'setYear':
      return { ...state, year: action.year }
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
        playCaption: first?.caption ?? null,
        year: first?.year ?? 48,
        menuOpen: false,
        selectedLetterId: null,
        view: 'atlas',
      }
    }
    case 'skipStory':
      return {
        ...state,
        phase: 'explore',
        storyIndex: STORY.length,
        playCaption: null,
        year: 67,
        menuOpen: true,
        view: 'atlas',
      }
    case 'storyAdvance': {
      const next = state.storyIndex + 1
      if (next >= STORY.length) {
        return {
          ...state,
          phase: 'explore',
          storyIndex: STORY.length,
          playCaption: null,
          year: 67,
          menuOpen: true,
        }
      }
      const ev = STORY[next]
      return {
        ...state,
        storyIndex: next,
        playCaption: ev.caption,
        year: ev.year,
      }
    }
    case 'setLayer': {
      const layers = { ...state.layers, [action.key]: action.value }
      if (action.key === 'citiesOnly' && action.value) {
        layers.letters = false
        layers.journeys = false
        layers.imprisonments = false
      }
      if (action.key !== 'citiesOnly' && action.value) layers.citiesOnly = false
      if (action.key === 'letters' && action.value) layers.citiesOnly = false
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
        filters: { ...defaultFilters, datingScheme: state.filters.datingScheme },
      }
    case 'setScheme': {
      const { min, max } = yearBounds()
      return {
        ...state,
        filters: { ...state.filters, datingScheme: action.scheme },
        year: Math.min(max, Math.max(min, state.year)),
      }
    }
    case 'setCompare': {
      const compare: [string | null, string | null] = [...state.compare]
      compare[action.slot] = action.id
      return { ...state, compare, view: 'compare', menuOpen: false }
    }
    case 'setComparePair':
      return { ...state, compare: [action.a, action.b], view: 'compare', menuOpen: false }
    case 'setMenuOpen':
      return { ...state, menuOpen: action.open }
    case 'setShowTimeline':
      return { ...state, showTimeline: action.value }
    case 'setShowScrubber':
      return { ...state, showScrubber: action.value }
    case 'setCity':
      return { ...state, cityId: action.id }
    case 'applyRoute':
      return {
        ...state,
        view: action.view,
        selectedLetterId: action.letterId,
        compare: action.compare,
      }
  }
}

interface AppContextValue extends AppState {
  selectLetter: (id: string | null) => void
  setView: (view: ViewId) => void
  setYear: (year: number) => void
  nudgeYear: (delta: number) => void
  beginStory: () => void
  skipStory: () => void
  setLayer: (key: keyof Layers, value: boolean) => void
  setPlantedFilter: (value: PlantedFilter) => void
  togglePeriod: (id: PeriodId) => void
  toggleTheme: (theme: string) => void
  clearFilters: () => void
  setScheme: (scheme: DatingScheme) => void
  setCompare: (slot: 0 | 1, id: string | null) => void
  setComparePair: (a: string, b: string) => void
  setMenuOpen: (open: boolean) => void
  setShowTimeline: (value: boolean) => void
  setShowScrubber: (value: boolean) => void
  setCity: (id: string | null) => void
  filterActive: boolean
  currentStoryEvent: (typeof STORY)[number] | null
}

const AppContext = createContext<AppContextValue | null>(null)

function parseHash(): {
  view: ViewId
  letterId: string | null
  compare: [string | null, string | null]
} {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const parts = raw.split('/').filter(Boolean)
  const views: ViewId[] = ['atlas', 'compare', 'about']
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const reduced = useReducedMotion()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('letter-and-road:v2')
      if (raw) dispatch({ type: 'hydrate', persisted: JSON.parse(raw) as Persisted })
    } catch {
      /* ignore */
    }
    dispatch({ type: 'applyRoute', ...parseHash() })
  }, [])

  useEffect(() => {
    const onHash = () => dispatch({ type: 'applyRoute', ...parseHash() })
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    writeHash(state)
  }, [state.view, state.selectedLetterId, state.compare])

  useEffect(() => {
    const persisted: Persisted = {
      datingScheme: state.filters.datingScheme,
      layers: state.layers,
      showTimeline: state.showTimeline,
      showScrubber: state.showScrubber,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      /* ignore */
    }
  }, [state.filters.datingScheme, state.layers, state.showTimeline, state.showScrubber])

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
        if (state.selectedLetterId) dispatch({ type: 'selectLetter', id: null })
        else if (state.cityId) dispatch({ type: 'setCity', id: null })
        else if (state.menuOpen) dispatch({ type: 'setMenuOpen', open: false })
        else if (state.phase === 'playing') dispatch({ type: 'skipStory' })
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
  const beginStory = useCallback(() => dispatch({ type: 'beginStory' }), [])
  const skipStory = useCallback(() => dispatch({ type: 'skipStory' }), [])
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
  const setScheme = useCallback((scheme: DatingScheme) => dispatch({ type: 'setScheme', scheme }), [])
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
  const setShowScrubber = useCallback(
    (value: boolean) => dispatch({ type: 'setShowScrubber', value }),
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
      beginStory,
      skipStory,
      setLayer,
      setPlantedFilter,
      togglePeriod,
      toggleTheme,
      clearFilters,
      setScheme,
      setCompare,
      setComparePair,
      setMenuOpen,
      setShowTimeline,
      setShowScrubber,
      setCity,
      filterActive,
      currentStoryEvent,
    }),
    [
      state,
      selectLetter,
      setView,
      setYear,
      nudgeYear,
      beginStory,
      skipStory,
      setLayer,
      setPlantedFilter,
      togglePeriod,
      toggleTheme,
      clearFilters,
      setScheme,
      setCompare,
      setComparePair,
      setMenuOpen,
      setShowTimeline,
      setShowScrubber,
      setCity,
      filterActive,
      currentStoryEvent,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
