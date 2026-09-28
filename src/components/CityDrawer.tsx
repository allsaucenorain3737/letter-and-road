import { useEffect, useRef } from 'react'
import { CITY_BY_ID } from '../data/cities'
import { CITY_CONTEXT_BY_ID } from '../data/city-contexts'
import { culturalContextsForCity, CULTURAL_CONTEXT_BY_ID } from '../data/cultural'
import { LETTER_BY_ID } from '../data/letters'
import { lettersForCity } from '../lib/chronology'
import { useApp } from '../state/AppState'
import { ScriptureLink } from './ScriptureLink'
import type { ScriptureRef } from '../types'

export function CityDrawer() {
  const app = useApp()
  const city = app.cityId ? CITY_BY_ID[app.cityId] : null
  const pack = app.cityId ? CITY_CONTEXT_BY_ID[app.cityId] : null
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!city) return
    const previously = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const panel = panelRef.current
    if (!panel) return

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !panel) return
      const items = [
        ...panel.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),select,textarea,input,[tabindex]:not([tabindex="-1"])',
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
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      panel.removeEventListener('keydown', onKey)
      document.body.style.overflow = original
      previously?.focus()
    }
  }, [city])

  if (!city) return null

  const scheme = app.filters.datingScheme
  const linkedLetters = (pack?.letterIds ?? [])
    .map((id) => LETTER_BY_ID[id])
    .filter(Boolean)
  const mapLetters = lettersForCity(city.id, scheme)
  const themeTitles = (pack?.themeIds ?? [])
    .map((id) => CULTURAL_CONTEXT_BY_ID[id])
    .filter(Boolean)
  const culturalPacks = culturalContextsForCity(city.id)
  const prevCities = (pack?.journeyLinks.prevCityIds ?? [])
    .map((id) => CITY_BY_ID[id])
    .filter(Boolean)
  const nextCities = (pack?.journeyLinks.nextCityIds ?? [])
    .map((id) => CITY_BY_ID[id])
    .filter(Boolean)
  const sources = pack?.sources ?? []

  return (
    <>
      <button
        type="button"
        className="backdrop"
        aria-label="Close city"
        onClick={() => app.setCity(null)}
      />
      <aside
        ref={panelRef}
        className="drawer is-open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <button
          ref={closeRef}
          type="button"
          className="close-drawer"
          aria-label="Close"
          onClick={() => app.setCity(null)}
        >
          ×
        </button>
        <p className="drawer-kicker">City</p>
        <h2 id="city-title">{city.name}</h2>
        <div className="meta-row">
          <span className="pill">{city.kind === 'region' ? 'Region' : 'City'}</span>
          {city.planted && <span className="pill">Paul planted here</span>}
        </div>

        {pack ? (
          <>
            <p className="city-intro">{pack.intro}</p>

            <h3>Political status</h3>
            <p>{pack.politicalStatus}</p>

            <h3>Cultural distinctive</h3>
            <p>{pack.culturalDistinctive}</p>

            <h3>Paul there</h3>
            <p>{pack.paulThere}</p>

            {linkedLetters.length > 0 && (
              <>
                <h3>Linked letters</h3>
                <ul className="anchor-list">
                  {linkedLetters.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        className="linkish drawer-inline-link"
                        onClick={() => app.selectLetter(l.id)}
                      >
                        {l.shortTitle}
                      </button>
                      <span className="anchor-note"> — {l.destinationLabel}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {themeTitles.length > 0 && (
              <>
                <h3>Related themes</h3>
                <div className="theme-chips">
                  {themeTitles.map((t) => (
                    <span key={t.id}>{t.title}</span>
                  ))}
                </div>
              </>
            )}

            {(prevCities.length > 0 || nextCities.length > 0) && (
              <>
                <h3>Journey links</h3>
                <div className="journey-link-row">
                  {prevCities.map((c) => (
                    <button
                      key={`prev-${c.id}`}
                      type="button"
                      className="pill journey-link-btn"
                      onClick={() => app.setCity(c.id)}
                    >
                      ← {c.shortLabel}
                    </button>
                  ))}
                  {nextCities.map((c) => (
                    <button
                      key={`next-${c.id}`}
                      type="button"
                      className="pill journey-link-btn"
                      onClick={() => app.setCity(c.id)}
                    >
                      {c.shortLabel} →
                    </button>
                  ))}
                </div>
              </>
            )}

            <CulturalSection cityId={city.id} packs={culturalPacks} />

            <AnchorBlock title="Scripture anchors" refs={pack.scriptureAnchors} />

            {sources.length > 0 && (
              <>
                <h3>Sources</h3>
                <ul className="anchor-list sources-list">
                  {sources.map((s) => (
                    <li key={s.label}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.label}
                        </a>
                      ) : (
                        <strong>{s.label}</strong>
                      )}
                      {s.note ? <span className="anchor-note"> — {s.note}</span> : null}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <>
            <p>{city.description}</p>
            {mapLetters.length > 0 && (
              <>
                <h3>Letters at this place</h3>
                <ul className="anchor-list">
                  {mapLetters.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        className="linkish drawer-inline-link"
                        onClick={() => app.selectLetter(l.id)}
                      >
                        {l.shortTitle}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <CulturalSection cityId={city.id} packs={culturalPacks} />
          </>
        )}
      </aside>
    </>
  )
}

function CulturalSection({
  cityId,
  packs,
}: {
  cityId: string
  packs: ReturnType<typeof culturalContextsForCity>
}) {
  const app = useApp()
  if (!packs.length) return null
  return (
    <>
      <h3>Cultural context</h3>
      <div className="cultural-list">
        {packs.map((ctx) => (
          <details key={`${cityId}-${ctx.id}`} className="cultural-item">
            <summary>
              <strong>{ctx.title}</strong>
              <span className="cultural-summary">{ctx.summary}</span>
            </summary>
            <div className="cultural-body">
              <p>{ctx.body}</p>
              {app.showTeachingNotes && ctx.whyItMattersToday && (
                <p className="cultural-today">
                  <em>Why it matters today.</em> {ctx.whyItMattersToday}
                </p>
              )}
              {ctx.scriptureAnchors && ctx.scriptureAnchors.length > 0 && (
                <ul className="anchor-list">
                  {ctx.scriptureAnchors.map((r) => (
                    <li key={r.search}>
                      <ScriptureLink search={r.search}>{r.label}</ScriptureLink>
                      {r.note ? <span className="anchor-note"> — {r.note}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        ))}
      </div>
    </>
  )
}

function AnchorBlock({ title, refs }: { title: string; refs: ScriptureRef[] }) {
  if (!refs.length) return null
  return (
    <>
      <h3>{title}</h3>
      <ul className="anchor-list">
        {refs.map((r) => (
          <li key={r.search}>
            <ScriptureLink search={r.search}>{r.label}</ScriptureLink>
            {r.note ? <span className="anchor-note"> — {r.note}</span> : null}
          </li>
        ))}
      </ul>
    </>
  )
}
