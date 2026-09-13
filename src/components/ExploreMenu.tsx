import { PERIODS, THEME_FILTERS } from '../data/periods'
import { useApp } from '../state/AppState'
import type { PlantedFilter } from '../types'

const PLANTED: { id: PlantedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'planted', label: 'Planted' },
  { id: 'unvisited', label: 'Not visited' },
  { id: 'individuals', label: 'Individuals' },
]

export function MapChrome() {
  const app = useApp()
  if (app.view !== 'atlas') return null

  return (
    <div className="map-chrome">
      <button
        type="button"
        className="brand-btn"
        onClick={() => {
          app.setView('atlas')
          app.setMenuOpen(false)
        }}
      >
        <span className="brand-title">Letter &amp; Road</span>
        <span className="brand-sub">Pauline Atlas</span>
      </button>
      {app.phase === 'playing' ? (
        <button type="button" className="nav-btn is-active" onClick={app.skipStory}>
          Skip story
        </button>
      ) : (
        <button
          type="button"
          className={`nav-btn${app.menuOpen ? ' is-active' : ''}`}
          aria-expanded={app.menuOpen}
          onClick={() => app.setMenuOpen(!app.menuOpen)}
        >
          {app.menuOpen ? 'Close menu' : 'Menu'}
        </button>
      )}
    </div>
  )
}

export function ExploreMenu() {
  const app = useApp()
  if (app.view !== 'atlas' || app.phase !== 'explore' || !app.menuOpen) return null
  const scheme = app.filters.datingScheme

  return (
    <div className="explore-menu" role="region" aria-label="Map options">
      <div className="explore-grid">
        <section>
          <h3>Story</h3>
          <button type="button" className="primary-btn" onClick={app.beginStory}>
            Play the story again
          </button>
        </section>

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
              checked={app.showScrubber}
              onChange={(e) => app.setShowScrubber(e.target.checked)}
            />
            Year slider
          </label>
          <label className="menu-check">
            <input
              type="checkbox"
              checked={app.layers.letters}
              onChange={(e) => app.setLayer('letters', e.target.checked)}
            />
            Letters
          </label>
          <label className="menu-check">
            <input
              type="checkbox"
              checked={app.layers.journeys}
              onChange={(e) => app.setLayer('journeys', e.target.checked)}
            />
            Travels
          </label>
          <label className="menu-check">
            <input
              type="checkbox"
              checked={app.layers.imprisonments}
              onChange={(e) => app.setLayer('imprisonments', e.target.checked)}
            />
            Imprisonments
          </label>
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

        <section>
          <h3>Pages</h3>
          <div className="filter-group">
            <button type="button" className="chip" onClick={() => app.setView('compare')}>
              Compare letters
            </button>
            <button type="button" className="chip" onClick={() => app.setView('about')}>
              About &amp; method
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export function PageHeader() {
  const app = useApp()
  if (app.view === 'atlas') return null
  return (
    <header className="site-header">
      <button
        type="button"
        className="brand-btn"
        onClick={() => {
          app.setView('atlas')
        }}
      >
        <span className="brand-title">Letter &amp; Road</span>
        <span className="brand-sub">Back to map</span>
      </button>
      <nav className="nav">
        <button
          type="button"
          className={`nav-btn${app.view === 'compare' ? ' is-active' : ''}`}
          onClick={() => app.setView('compare')}
        >
          Compare
        </button>
        <button
          type="button"
          className={`nav-btn${app.view === 'about' ? ' is-active' : ''}`}
          onClick={() => app.setView('about')}
        >
          About
        </button>
      </nav>
    </header>
  )
}
