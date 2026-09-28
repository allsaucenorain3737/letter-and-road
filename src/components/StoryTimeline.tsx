import { useEffect, useRef } from 'react'
import { LETTERS } from '../data/letters'
import { AUDIENCE_META } from '../data/periods'
import { arcState, datingOf, matchesFilters, yearPosition } from '../lib/chronology'
import { useApp } from '../state/AppState'

export function StoryTimeline() {
  const app = useApp()
  const scheme = app.filters.datingScheme
  const scroller = useRef<HTMLDivElement>(null)
  const letters = LETTERS.filter((l) => matchesFilters(l, app.filters))

  useEffect(() => {
    const current = letters.find((l) => arcState(l, app.year, scheme) === 'current')
    if (!current || !scroller.current) return
    const el = scroller.current.querySelector(`[data-letter="${current.id}"]`)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
  }, [app.year, scheme, letters])

  return (
    <div className="story-rail" aria-label="Letter timeline">
      <div className="story-rail-head">
        <strong>Timeline</strong>
        <span>Advance the year. Letters light up as they are written.</span>
      </div>
      <div className="story-track-wrap">
        <div className="story-playhead" style={{ left: `${yearPosition(app.year) * 100}%` }} />
        {letters.map((letter) => {
          const d = datingOf(letter, scheme)
          const mid = (d.yearStart + d.yearEnd) / 2
          const left = yearPosition(mid) * 100
          const state = arcState(letter, app.year, scheme)
          const color = AUDIENCE_META[letter.audienceType].color
          return (
            <button
              key={letter.id}
              type="button"
              className={`story-bead is-${state}${app.selectedLetterId === letter.id ? ' is-selected' : ''}`}
              style={{ left: `${left}%`, borderColor: color, background: state === 'future' ? 'transparent' : color }}
              title={`${letter.shortTitle} · ${d.yearDisplay}`}
              onClick={() => {
                app.selectLetter(letter.id)
                app.setYear(d.yearStart)
              }}
            />
          )
        })}
      </div>
      <div className="story-cards" ref={scroller}>
        {letters.map((letter) => {
          const d = datingOf(letter, scheme)
          const state = arcState(letter, app.year, scheme)
          const color = AUDIENCE_META[letter.audienceType].color
          return (
            <button
              key={letter.id}
              type="button"
              data-letter={letter.id}
              className={`story-card is-${state}${app.selectedLetterId === letter.id ? ' is-selected' : ''}`}
              onClick={() => {
                app.selectLetter(letter.id)
                app.setYear(d.yearStart)
              }}
            >
              <span className="story-card-year" style={{ color }}>
                {d.yearDisplay}
              </span>
              <strong>{letter.shortTitle}</strong>
              <span className="story-card-route">
                {d.originLabel} → {letter.destinationLabel}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
