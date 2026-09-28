import { useEffect, useRef, useState } from 'react'
import { CITIES } from '../data/cities'
import { CITY_CONTEXT_BY_ID } from '../data/city-contexts'
import { IMPRISONMENTS } from '../data/journeys'
import { START_LABEL_IDS } from '../data/story'
import { useMediaQuery } from '../hooks'
import { CITY_BY_ID } from '../data/cities'
import { MAP, project } from '../lib/geo'
import { useApp } from '../state/AppState'

/** SVG atlas fallback: cities + optional prisons only. No land overlay, travel lines, or letter arcs. */
export function MediterraneanMapSvg() {
  const app = useApp()
  const compact = useMediaQuery('(max-width: 720px)')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [panning, setPanning] = useState(false)
  const didPan = useRef(false)
  const panRef = useRef<{
    x: number
    y: number
    vx: number
    vy: number
    pointers: Map<number, { x: number; y: number }>
    pinching: boolean
    startDist: number
    startK: number
  }>({ x: 0, y: 0, vx: 0, vy: 0, pointers: new Map(), pinching: false, startDist: 0, startK: 1 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      setView((v) => {
        const k = Math.min(4.5, Math.max(1, v.k * factor))
        const x = mx - ((mx - v.x) * k) / v.k
        const y = my - ((my - v.y) * k) / v.k
        return clampView({ x, y, k }, rect)
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    const el = wrapRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    didPan.current = false
    panRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (panRef.current.pointers.size === 2) {
      const pts = [...panRef.current.pointers.values()]
      panRef.current.pinching = true
      panRef.current.startDist = dist(pts[0], pts[1])
      panRef.current.startK = view.k
    } else {
      panRef.current.vx = e.clientX
      panRef.current.vy = e.clientY
      panRef.current.x = view.x
      panRef.current.y = view.y
      setPanning(true)
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!panRef.current.pointers.has(e.pointerId)) return
    panRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (panRef.current.pointers.size === 2 && panRef.current.pinching) {
      const pts = [...panRef.current.pointers.values()]
      const d = dist(pts[0], pts[1])
      const k = Math.min(4.5, Math.max(1, panRef.current.startK * (d / (panRef.current.startDist || 1))))
      setView((v) => clampView({ ...v, k }, rect))
      return
    }
    if (!panning) return
    const dx = e.clientX - panRef.current.vx
    const dy = e.clientY - panRef.current.vy
    if (Math.hypot(dx, dy) > 6) didPan.current = true
    setView((v) =>
      clampView({ x: panRef.current.x + dx, y: panRef.current.y + dy, k: v.k }, rect),
    )
  }

  function onPointerUp(e: React.PointerEvent) {
    panRef.current.pointers.delete(e.pointerId)
    if (panRef.current.pointers.size < 2) panRef.current.pinching = false
    if (panRef.current.pointers.size === 0) setPanning(false)
  }

  function resetView() {
    setView({ x: 0, y: 0, k: 1 })
  }

  function onCityClick(id: string) {
    if (didPan.current) return
    app.setCity(id)
  }

  const showPrisons = app.phase === 'explore' && app.layers.imprisonments

  return (
    <div className="atlas">
      <div
        ref={wrapRef}
        className={`map-wrap${panning ? ' is-panning' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg
          className="map-svg"
          viewBox={`0 0 ${MAP.width} ${MAP.height}`}
          role="img"
          aria-label="Eastern Mediterranean map of cities in the life and letters of Paul"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transformOrigin: '0 0',
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          }}
        >
          <defs>
            <linearGradient id="sea-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a92a0" />
              <stop offset="100%" stopColor="#5e7684" />
            </linearGradient>
          </defs>

          <g>
            <rect width={MAP.width} height={MAP.height} fill="url(#sea-fill)" />

            {showPrisons &&
              IMPRISONMENTS.map((imp) => {
                const city = CITY_BY_ID[imp.cityId]
                if (!city) return null
                const p = project(city.lon, city.lat)
                return (
                  <g key={imp.id} transform={`translate(${p.x + imp.offset[0]} ${p.y + imp.offset[1]})`}>
                    <rect className="imprison-mark" x={-7} y={-7} width={14} height={14} rx={2} />
                    <title>{`${imp.label} · ${imp.years}`}</title>
                  </g>
                )
              })}

            {CITIES.filter((c) => {
              if (START_LABEL_IDS.has(c.id)) return true
              return c.letterRelevant || Boolean(CITY_CONTEXT_BY_ID[c.id])
            }).map((city) => {
              const p = project(city.lon, city.lat)
              const named = START_LABEL_IDS.has(city.id) || city.letterRelevant
              const selected = app.cityId === city.id
              if (compact && !named && !selected) return null
              return (
                <g
                  key={city.id}
                  className={`city-dot${selected ? ' is-selected' : ''}`}
                  onClick={() => onCityClick(city.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={city.name}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onCityClick(city.id)
                    }
                  }}
                >
                  {city.id === 'damascus_road' ? (
                    <path
                      d={`M ${p.x} ${p.y - 6.5} L ${p.x + 5} ${p.y} L ${p.x} ${p.y + 6.5} L ${p.x - 5} ${p.y} Z`}
                      fill="#243f5c"
                      stroke={selected ? '#e8c97a' : '#f7f4ee'}
                      strokeWidth={selected ? 2.2 : 1.1}
                    />
                  ) : (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={selected ? (named ? 6.2 : 5) : named ? 4.4 : 2.4}
                      fill={city.planted ? '#9a7b3c' : '#f7f4ee'}
                      stroke={selected ? '#e8c97a' : '#2a3338'}
                      strokeWidth={selected ? 2.2 : 1.2}
                    />
                  )}
                  {(named || selected) && (
                    <text
                      className="city-label"
                      x={p.x + (city.id === 'damascus_road' ? 8 : 7)}
                      y={p.y - 7}
                    >
                      {city.shortLabel}
                    </text>
                  )}
                  <title>
                    {city.name}. {city.description}
                  </title>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      <aside className="legend-card" aria-label="Map legend">
        <div className="legend-row">
          <span className="swatch is-city" />
          Pauline place
        </div>
        <div className="legend-row">
          <span className="swatch is-planted" />
          Church Paul planted
        </div>
      </aside>

      <div className="map-controls">
        <button
          className="icon-btn"
          type="button"
          onClick={() => setView((v) => ({ ...v, k: Math.min(4.5, v.k * 1.25) }))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="icon-btn"
          type="button"
          onClick={() =>
            setView((v) => {
              const wrap = wrapRef.current?.getBoundingClientRect()
              return clampView({ ...v, k: v.k / 1.25 }, wrap ?? new DOMRect())
            })
          }
          aria-label="Zoom out"
        >
          −
        </button>
        <button className="icon-btn" type="button" onClick={resetView} aria-label="Reset map view">
          ⌖
        </button>
      </div>
    </div>
  )
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clampView(
  v: { x: number; y: number; k: number },
  rect: DOMRect,
): { x: number; y: number; k: number } {
  const k = Math.min(4.5, Math.max(1, v.k))
  const minX = rect.width - rect.width * k
  const minY = rect.height - rect.height * k
  return {
    k,
    x: Math.min(0, Math.max(minX, v.x)),
    y: Math.min(0, Math.max(minY, v.y)),
  }
}
