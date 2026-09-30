import { useMemo, useState } from 'react'
import { CITIES } from '../data/cities'
import { useApp } from '../state/AppState'

/** Always-mounted keyboard path to cities (also linked from Map options). */
export function CityListPanel({ embedded = false }: { embedded?: boolean }) {
  const app = useApp()
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = [...CITIES].sort((a, b) => a.name.localeCompare(b.name))
    if (!needle) return list
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.shortLabel.toLowerCase().includes(needle) ||
        c.id.includes(needle),
    )
  }, [q])

  return (
    <div className={`city-list-panel${embedded ? '' : ' city-list-panel--dock'}`} id={embedded ? undefined : 'city-list'}>
      {!embedded && <h2 className="city-list-heading">Cities</h2>}
      <label className="city-list-search">
        <span className="visually-hidden">Search cities</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search cities"
          autoComplete="off"
        />
      </label>
      <ul className="city-list" role="listbox" aria-label="Cities">
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`city-list-item${app.cityId === c.id ? ' is-on' : ''}`}
              onClick={() => {
                app.setCity(c.id)
                if (!embedded) app.setMenuOpen(false)
              }}
            >
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
