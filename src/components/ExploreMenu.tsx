import { useEffect, useRef } from 'react'
import { PERIODS, THEME_FILTERS } from '../data/periods'
import { useApp } from '../state/AppState'
import type { PlantedFilter, ViewId } from '../types'

const PLANTED: { id: PlantedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'planted', label: 'Planted' },
  { id: 'unvisited', label: 'Not visited' },
  { id: 'individuals', label: 'Individuals' },
]

const PRIMARY_NAV: { view: ViewId; href: string; label: string }[] = [
  { view: 'compare', href: '#/compare', label: 'Compare' },
  { view: 'about', href: '#/about', label: 'About' },
  { view: 'voices', href: '#/voices', label: 'Voices' },
]

const MAP_OPTIONS_ID = 'map-options-panel'

export function MapChrome() {
  const app = useApp()
  if (app.view !== 'atlas') return null

  return (
    <div className="map-chrome">
      <div className="map-chrome-left">
        <a href="#/atlas" className="brand-btn">
          <span className="brand-title">Letter &amp; Road</span>
          <span className="brand-sub">Pauline Atlas</span>
        </a>
        <nav className="map-primary-nav" aria-label="Site">
          {PRIMARY_NAV.map((item) => (
            <a key={item.view} href={item.href} className="nav-btn">
              {item.label}
            </a>
          ))}
        </nav>
        {app.phase === 'invite' ? (
          <button type="button" className="map-options-btn is-active" onClick={app.dismissInvite}>
            Skip
          </button>
        ) : (
          <button
            type="button"
            className={`map-options-btn${app.menuOpen ? ' is-active' : ''}`}
            aria-expanded={app.menuOpen}
            aria-controls={MAP_OPTIONS_ID}
            aria-haspopup="true"
            onClick={() => app.setMenuOpen(!app.menuOpen)}
          >
            {app.menuOpen ? 'Close options' : 'Map options'}
          </button>
        )}
      </div>
    </div>
  )
}

export function ExploreMenu() {
  const app = useApp()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const open = app.view === 'atlas' && app.phase === 'explore' && app.menuOpen

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (!panel) return
    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
    )
    focusables[0]?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !panel) return
      const items = [
        ...panel.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
        ),
      ]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    panel.addEventListener('keydown', onKey)
    return () => {
      panel.removeEventListener('keydown', onKey)
      previouslyFocused.current?.focus()
    }
  }, [open])

  if (!open) return null
  const scheme = app.filters.datingScheme

  return (
    <>
      <button
        type="button"
        className="map-options-backdrop"
        aria-label="Close map options"
        onClick={() => app.setMenuOpen(false)}
      />
      <div
        id={MAP_OPTIONS_ID}
        ref={panelRef}
        className="explore-menu"
        role="region"
        aria-label="Map options"
      >
        <div className="explore-grid">
          <section>
            <h3>Add to the map</h3>
            <label className="menu-check">
              <input
                type="checkbox"
                checked={app.showTimeline}
                onChange={(e) => app.setShowTimeline(e.target.checked)}
              />
              Letter timeline
            </label>
            <label className="menu-check">
              <input
                type="checkbox"
                checked={app.showLifeTimeline}
                onChange={(e) => app.setShowLifeTimeline(e.target.checked)}
              />
              Paul’s life timeline
            </label>
            <label className="menu-check">
              <input
                type="checkbox"
                checked={app.showScrubber}
                onChange={(e) => app.setShowScrubber(e.target.checked)}
              />
              Year slider
            </label>
            <label className="menu-check">
              <input
                type="checkbox"
                checked={app.layers.imprisonments}
                onChange={(e) => app.setLayer('imprisonments', e.target.checked)}
              />
              Imprisonments
            </label>
            <label className="menu-check">
              <input
                type="checkbox"
                checked={app.showTeachingNotes}
                onChange={(e) => app.setShowTeachingNotes(e.target.checked)}
              />
              Teaching notes
            </label>
            <p className="menu-hint">
              Teaching notes show optional “Why it matters today” blocks. Off by default.
            </p>
          </section>

          <section>
            <h3>Dates</h3>
            <div className="seg-row">
              <button
                type="button"
                className={`seg${scheme === 'consensus' ? ' is-on' : ''}`}
                onClick={() => app.setScheme('consensus')}
              >
                Consensus
              </button>
              <button
                type="button"
                className={`seg scheme-debated${scheme === 'debated' ? ' is-on' : ''}`}
                onClick={() => app.setScheme('debated')}
              >
                Wider debate
              </button>
            </div>
            <p className="menu-hint">Tied first to Acts and the letters. Scripture links open the ESV.</p>
          </section>

          <section>
            <h3>Audience</h3>
            <div className="seg-row">
              {PLANTED.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`seg${app.filters.plantedFilter === p.id ? ' is-on' : ''}`}
                  onClick={() => app.setPlantedFilter(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>Period</h3>
            <div className="filter-group">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`chip${app.filters.periods.includes(p.id) ? ' is-on' : ''}`}
                  onClick={() => app.togglePeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          <section className="theme-span">
            <h3>Theme</h3>
            <div className="filter-group">
              {THEME_FILTERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip${app.filters.themes.includes(t) ? ' is-on' : ''}`}
                  onClick={() => app.toggleTheme(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {app.filterActive && (
              <button type="button" className="filter-clear" onClick={app.clearFilters}>
                Clear filters
              </button>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

export function PageHeader() {
  const app = useApp()
  if (app.view === 'atlas') return null
  return (
    <header className="site-header">
      <a href="#/atlas" className="brand-btn">
        <span className="brand-title">Letter &amp; Road</span>
        <span className="brand-sub">Back to map</span>
      </a>
      <nav className="nav" aria-label="Site">
        {PRIMARY_NAV.map((item) => (
          <a
            key={item.view}
            href={item.href}
            className={`nav-btn${app.view === item.view ? ' is-active' : ''}`}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
