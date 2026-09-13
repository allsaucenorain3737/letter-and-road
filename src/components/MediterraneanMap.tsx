import { useEffect, useMemo, useRef, useState } from 'react'
import { CITIES, CITY_BY_ID } from '../data/cities'
import { LAND, LAND_ATTRIBUTION } from '../data/coastline'
import { IMPRISONMENTS, JOURNEYS } from '../data/journeys'
import { LETTERS } from '../data/letters'
import { AUDIENCE_META } from '../data/periods'
import { START_LABEL_IDS, STORY, type StoryEvent } from '../data/story'
import { useMediaQuery, useReducedMotion } from '../hooks'
import { arcState, datingOf, lettersForCity, matchesFilters, type ArcState } from '../lib/chronology'
import { MAP, arcControl, arrowHead, lineToPath, polyToPath, project } from '../lib/geo'
import { useApp } from '../state/AppState'
import type { Letter } from '../types'

export function MediterraneanMap() {
  const app = useApp()
  const compact = useMediaQuery('(max-width: 720px)')
  const reduced = useReducedMotion()
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

  const scheme = app.filters.datingScheme
  const visibleLetters = useMemo(
    () => LETTERS.filter((l) => matchesFilters(l, app.filters)),
    [app.filters],
  )

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
    const related = lettersForCity(id, scheme).filter((l) => matchesFilters(l, app.filters))
    if (related.length === 1) app.selectLetter(related[0].id)
    else app.setCity(id)
  }

  const storyEvents = app.phase === 'playing' ? STORY.slice(0, app.storyIndex + 1) : []
  const pastTravels = storyEvents.filter((e): e is Extract<StoryEvent, { type: 'travel' }> => e.type === 'travel')
  const current = app.currentStoryEvent
  const revealedLetterIds = new Set(
    storyEvents.filter((e) => e.type === 'letter').map((e) => e.letterId),
  )
  const liveLetterId = current?.type === 'letter' ? current.letterId : null

  const showLetters =
    app.phase === 'explore' && app.layers.letters && !app.layers.citiesOnly
  const showJourneys =
    app.phase === 'explore' && app.layers.journeys && !app.layers.citiesOnly
  const showPrisons =
    app.phase === 'explore' && app.layers.imprisonments && !app.layers.citiesOnly
  const showStoryTravels = app.phase === 'playing'
  const showStoryLetters = app.phase === 'playing'

  const cityPopover = app.cityId ? CITY_BY_ID[app.cityId] : null
  const cityLetters = app.cityId
    ? lettersForCity(app.cityId, scheme).filter((l) => matchesFilters(l, app.filters))
    : []

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
          aria-label="Eastern Mediterranean map with Paul’s letters drawn as directed arcs from origin to destination"
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

            {LAND.map((poly, i) => (
              <path key={i} className="land" d={polyToPath(poly)} fillRule="evenodd" />
            ))}

            {showStoryTravels &&
              pastTravels.map((ev) => (
                <TravelPath
                  key={ev.id}
                  event={ev}
                  live={current?.type === 'travel' && current.id === ev.id}
                  reduced={reduced}
                />
              ))}

            {showJourneys &&
              JOURNEYS.map((j) => {
                const pts = j.waypoints
                  .map((id) => CITY_BY_ID[id])
                  .filter(Boolean)
                  .map((c) => [c.lon, c.lat] as [number, number])
                return (
                  <path key={j.id} className="travel-path is-land is-trail" d={lineToPath(pts)}>
                    <title>{j.label} · {j.years}</title>
                  </path>
                )
              })}

            {showStoryLetters &&
              LETTERS.filter((l) => revealedLetterIds.has(l.id)).map((letter) => (
                <LetterArc
                  key={letter.id}
                  letter={letter}
                  year={app.year}
                  selected={app.selectedLetterId}
                  compact={compact}
                  forceState={liveLetterId === letter.id ? 'current' : 'past'}
                  packetMs={
                    liveLetterId === letter.id && current?.type === 'letter'
                      ? current.duration
                      : 8000
                  }
                  packetOnce={liveLetterId === letter.id}
                  onSelect={() => {
                    if (!didPan.current) app.selectLetter(letter.id)
                  }}
                />
              ))}

            {showLetters &&
              visibleLetters.map((letter) => (
                <LetterArc
                  key={letter.id}
                  letter={letter}
                  year={app.year}
                  selected={app.selectedLetterId}
                  compact={compact}
                  onSelect={() => {
                    if (!didPan.current) app.selectLetter(letter.id)
                  }}
                />
              ))}

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

            {CITIES.filter((c) => START_LABEL_IDS.has(c.id) || (app.phase === 'explore' && showJourneys)).map(
              (city) => {
                const p = project(city.lon, city.lat)
                const named = START_LABEL_IDS.has(city.id)
                if (compact && !named) return null
                return (
                  <g key={city.id} className="city-dot" onClick={() => onCityClick(city.id)}>
                    {city.id === 'damascus_road' ? (
                      <path
                        d={`M ${p.x} ${p.y - 6.5} L ${p.x + 5} ${p.y} L ${p.x} ${p.y + 6.5} L ${p.x - 5} ${p.y} Z`}
                        fill="#243f5c"
                        stroke="#f7f4ee"
                        strokeWidth={1.1}
                      />
                    ) : (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={named ? 4.4 : 2.4}
                        fill={city.planted ? '#9a7b3c' : '#f7f4ee'}
                        stroke="#2a3338"
                        strokeWidth={1.2}
                      />
                    )}
                    {named && (
                      <text
                        className="city-label"
                        x={p.x + (city.id === 'damascus_road' ? 8 : 7)}
                        y={p.y - 7}
                      >
                        {city.shortLabel}
                      </text>
                    )}
                    <title>{city.name}. {city.description}</title>
                  </g>
                )
              },
            )}

            {app.phase === 'playing' && current && <StoryCaption event={current} />}
          </g>
        </svg>
      </div>

      <aside className="legend-card" aria-label="Map legend">
          <div className="legend-row">
            <span className="swatch is-solid" />
            Overland — solid
          </div>
          <div className="legend-row">
            <span className="swatch is-dotted" />
            Ocean — dotted
          </div>
          <div className="legend-row">
            <span className="swatch is-dashed" />
            Letter — dashed
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

      {app.phase === 'explore' && visibleLetters.length === 0 && app.layers.letters && (
        <div className="caption-card" role="status" style={{ whiteSpace: 'normal' }}>
          No letters match these filters.{' '}
          <button type="button" className="linkish" onClick={app.clearFilters} style={{ display: 'inline', width: 'auto' }}>
            Clear filters
          </button>
        </div>
      )}

      {cityPopover && (
        <div className="city-card" role="dialog" aria-label={cityPopover.name}>
          <h3>{cityPopover.name}</h3>
          <p>{cityPopover.description}</p>
          {cityLetters.length === 0 ? (
            <p>No letter currently filtered to this place.</p>
          ) : (
            cityLetters.map((l) => (
              <button
                key={l.id}
                className="linkish"
                type="button"
                onClick={() => app.selectLetter(l.id)}
              >
                {l.shortTitle} · {datingOf(l, scheme).originLabel} → {l.destinationLabel}
              </button>
            ))
          )}
          <button className="linkish" type="button" onClick={() => app.setCity(null)}>
            Close
          </button>
        </div>
      )}

      <p className="map-credit">{LAND_ATTRIBUTION}</p>
    </div>
  )
}

function StoryCaption({ event }: { event: StoryEvent }) {
  const anchor = project(25.05, 33.55)
  const width = 420
  const height = 128
  return (
    <foreignObject
      x={anchor.x - width / 2}
      y={anchor.y}
      width={width}
      height={height}
      className="story-caption-frame"
    >
      <div className="play-caption">
        <div className="play-caption-dates">{event.dates}</div>
        <div className="play-caption-text">{event.caption}</div>
      </div>
    </foreignObject>
  )
}

function PapyrusIcon() {
  return (
    <g className="papyrus-icon">
      <rect x="-5" y="-7" width="10" height="14" rx="1.15" fill="#e8d9b6" stroke="#5c4a38" strokeWidth="0.95" />
      <path d="M-5 -4.8 Q0 -7.2 5 -4.8" fill="none" stroke="#8a7354" strokeWidth="0.7" />
      <line x1="-2.6" y1="-1.4" x2="2.6" y2="-1.4" stroke="#8a7354" strokeWidth="0.7" />
      <line x1="-2.6" y1="1.2" x2="2.6" y2="1.2" stroke="#8a7354" strokeWidth="0.7" />
      <line x1="-2.6" y1="3.8" x2="1.4" y2="3.8" stroke="#8a7354" strokeWidth="0.7" />
    </g>
  )
}

function TravelPath({
  event,
  live,
  reduced,
}: {
  event: Extract<StoryEvent, { type: 'travel' }>
  live: boolean
  reduced: boolean
}) {
  const pts = event.waypoints
    .map((id) => CITY_BY_ID[id])
    .filter(Boolean)
    .map((c) => [c.lon, c.lat] as [number, number])
  if (pts.length < 2) return null
  const d = lineToPath(pts)
  const cls = `travel-path is-${event.mode}${live ? ' is-live' : ' is-trail'}`
  return (
    <g>
      <path className={cls} d={d}>
        <title>{event.caption}</title>
      </path>
      {live && !reduced && (
        <circle
          r={5}
          fill={event.mode === 'sea' ? '#e8eef1' : '#f7f4ee'}
          stroke={event.mode === 'sea' ? '#2f5d6e' : '#5c4a38'}
          strokeWidth={2}
        >
          <animateMotion dur={`${Math.max(event.duration / 1000, 1.2)}s`} repeatCount="1" fill="freeze" path={d} />
        </circle>
      )}
    </g>
  )
}

function LetterArc({
  letter,
  year,
  selected,
  compact,
  onSelect,
  forceState,
  packetMs = 8000,
  packetOnce = false,
}: {
  letter: Letter
  year: number
  selected: string | null
  compact: boolean
  onSelect: () => void
  forceState?: ArcState
  packetMs?: number
  packetOnce?: boolean
}) {
  const { filters } = useApp()
  const reduced = useReducedMotion()
  const d = datingOf(letter, filters.datingScheme)
  const from = CITY_BY_ID[d.originId]
  const to = CITY_BY_ID[letter.destinationId]
  if (!from || !to) return null
  const a = project(from.lon, from.lat)
  const b = project(to.lon, to.lat)
  const bulge = compact ? letter.arcBulge * 0.72 : letter.arcBulge
  const c = arcControl(a.x, a.y, b.x, b.y, bulge)
  const state = forceState ?? arcState(letter, year, filters.datingScheme)
  const color = AUDIENCE_META[letter.audienceType].color
  const dim = selected && selected !== letter.id
  const cls = [
    'letter-arc',
    `is-${state}`,
    selected === letter.id ? 'is-selected' : '',
    dim ? 'is-dim' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const path = `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${c.cx.toFixed(1)} ${c.cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
  const head = arrowHead(a.x, a.y, c.cx, c.cy, b.x, b.y, state === 'current' || selected === letter.id ? 11 : 8)
  const label = `${letter.shortTitle}, ${d.originLabel} to ${letter.destinationLabel}, ${d.yearDisplay}`

  const mid = {
    x: (a.x + 2 * c.cx + b.x) / 4,
    y: (a.y + 2 * c.cy + b.y) / 4,
  }
  const interactive = state !== 'future'
  const alt = d.altOriginId ? CITY_BY_ID[d.altOriginId] : null
  const altPath = alt
    ? (() => {
        const ao = project(alt.lon, alt.lat)
        const ac = arcControl(ao.x, ao.y, b.x, b.y, bulge * -0.6)
        return `M ${ao.x.toFixed(1)} ${ao.y.toFixed(1)} Q ${ac.cx.toFixed(1)} ${ac.cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
      })()
    : null

  return (
    <g>
      {altPath && state !== 'future' && (
        <path
          className="letter-arc is-alt"
          d={altPath}
          stroke={color}
          strokeWidth={1.4}
          fill="none"
          pointerEvents="none"
        >
          <title>{`Alternate origin debated: ${d.altOriginLabel}`}</title>
        </path>
      )}
      {interactive && (
        <path className="letter-arc-hit" d={path} onClick={onSelect} role="presentation">
          <title>{label}</title>
        </path>
      )}
      <path
        className={cls}
        d={path}
        stroke={color}
        strokeWidth={selected === letter.id ? 2.8 : 2.1}
        fill="none"
        onClick={interactive ? onSelect : undefined}
        role={interactive ? 'button' : 'presentation'}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? label : undefined}
        aria-hidden={interactive ? undefined : true}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect()
                }
              }
            : undefined
        }
      />
      <path className={cls} d={head} fill={color} stroke="none" pointerEvents="none" />
      {state === 'current' && !reduced && (
        <g pointerEvents="none">
          <PapyrusIcon />
          <animateMotion
            dur={`${Math.max(packetMs / 1000, 4)}s`}
            repeatCount={packetOnce ? '1' : 'indefinite'}
            fill={packetOnce ? 'freeze' : undefined}
            path={path}
            rotate="auto"
          />
        </g>
      )}
      {(state === 'current' || selected === letter.id) && !compact && (
        <text
          className="city-label"
          x={mid.x}
          y={mid.y - 6}
          textAnchor="middle"
          fontSize={12}
          fill="#1a3344"
          pointerEvents="none"
        >
          {letter.shortTitle}
        </text>
      )}
    </g>
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
