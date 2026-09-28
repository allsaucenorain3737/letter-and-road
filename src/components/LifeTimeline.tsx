import { useEffect, useRef } from 'react'
import { BIOGRAPHICAL_EVENTS } from '../data/biographical'
import { CITY_BY_ID } from '../data/cities'
import { useApp } from '../state/AppState'
import { ScriptureLink } from './ScriptureLink'

export function LifeTimeline() {
  const app = useApp()
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scroller.current) return
    const near = BIOGRAPHICAL_EVENTS.find(
      (e) => app.year >= e.yearStart && app.year <= (e.yearEnd ?? e.yearStart),
    )
    if (!near) return
    const el = scroller.current.querySelector(`[data-life="${near.id}"]`)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
  }, [app.year])

  useEffect(() => {
    if (!app.cityId || !scroller.current) return
    const matches = BIOGRAPHICAL_EVENTS.filter((e) => e.placeId === app.cityId)
    if (!matches.length) return
    const nearest = matches.reduce((best, ev) => {
      const mid = (ev.yearStart + (ev.yearEnd ?? ev.yearStart)) / 2
      const bestMid = (best.yearStart + (best.yearEnd ?? best.yearStart)) / 2
      return Math.abs(mid - app.year) < Math.abs(bestMid - app.year) ? ev : best
    })
    const el = scroller.current.querySelector(`[data-life="${nearest.id}"]`)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
    // Scroll on city select; year is read only to pick nearest match.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: cityId trigger
  }, [app.cityId])

  return (
    <div className="story-rail life-rail" aria-label="Paul’s life timeline">
      <div className="story-rail-head">
        <strong>Paul’s life</strong>
        <span>Tap an event to focus its city and year. Letter timeline stays available separately.</span>
      </div>
      <div className="story-cards" ref={scroller}>
        {BIOGRAPHICAL_EVENTS.map((ev) => {
          const place = ev.placeId ? CITY_BY_ID[ev.placeId] : null
          const active =
            app.year >= ev.yearStart && app.year <= (ev.yearEnd ?? ev.yearStart)
          const placeMatch = Boolean(app.cityId && ev.placeId === app.cityId)
          return (
            <div
              key={ev.id}
              role="button"
              tabIndex={0}
              data-life={ev.id}
              className={`story-card life-card${active ? ' is-current' : ''}${placeMatch ? ' is-selected' : ''}`}
              onClick={() => {
                app.setYear(ev.yearStart)
                if (ev.placeId) app.setCity(ev.placeId)
                app.setMenuOpen(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  app.setYear(ev.yearStart)
                  if (ev.placeId) app.setCity(ev.placeId)
                  app.setMenuOpen(false)
                }
              }}
            >
              <span className="story-card-year">{ev.yearDisplay}</span>
              <strong>{ev.title}</strong>
              {ev.summary ? (
                <span className="life-card-summary">{ev.summary}</span>
              ) : null}
              <span className="story-card-route">
                {place ? place.shortLabel : '—'}
              </span>
              {ev.actsAnchors && ev.actsAnchors.length > 0 ? (
                <span
                  className="life-card-anchors"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {ev.actsAnchors.map((r, i) => (
                    <span key={r.search}>
                      {i > 0 ? ' · ' : null}
                      <ScriptureLink search={r.search}>{r.label}</ScriptureLink>
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
