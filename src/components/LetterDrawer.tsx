import { useEffect, useRef } from 'react'
import { AUDIENCE_META } from '../data/periods'
import { LETTER_BY_ID } from '../data/letters'
import { passageUrl } from '../lib/bible'
import { datingOf } from '../lib/chronology'
import { useApp } from '../state/AppState'
import { ScriptureLink } from './ScriptureLink'
import type { ScriptureRef } from '../types'

export function LetterDrawer() {
  const app = useApp()
  const letter = app.selectedLetterId ? LETTER_BY_ID[app.selectedLetterId] : null
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!letter) return
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
  }, [letter])

  if (!letter) return null

  const scheme = app.filters.datingScheme
  const d = datingOf(letter, scheme)
  const audience = AUDIENCE_META[letter.audienceType]

  return (
    <>
      <button
        type="button"
        className="backdrop"
        aria-label="Close letter"
        onClick={() => app.selectLetter(null)}
      />
      <aside
        ref={panelRef}
        className="drawer is-open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="letter-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <button
          ref={closeRef}
          type="button"
          className="close-drawer"
          aria-label="Close"
          onClick={() => app.selectLetter(null)}
        >
          ×
        </button>
        <p className="drawer-kicker">{d.yearDisplay}</p>
        <h2 id="letter-title">{letter.title}</h2>
        <div className="meta-row">
          <span className="pill">
            {d.originLabel} → {letter.destinationLabel}
          </span>
          <span className="pill audience" style={{ background: audience.color, color: audience.ink }}>
            {audience.label}
          </span>
        </div>
        {d.originNote && <p>{d.originNote}</p>}
        {scheme === 'debated' && d.debateNote && <p className="debate-note">{d.debateNote}</p>}

        <h3>Who it is for</h3>
        <p>{letter.audiencePortrait}</p>

        <h3>Why now</h3>
        <p>{letter.occasion}</p>

        <h3>What’s in it</h3>
        <ol className="outline">
          {letter.outline.map((section) => (
            <li key={section.ref}>
              <ScriptureLink search={section.search} className="ref">
                {section.ref}
              </ScriptureLink>
              <strong>{section.heading}</strong>
              <div>{section.summary}</div>
            </li>
          ))}
        </ol>

        <h3>Themes</h3>
        <div className="theme-chips">
          {letter.themes.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {letter.narrowedAudience && (
          <>
            <h3>Why the audience changes the letter</h3>
            <div className="narrowed">
              <p>{letter.narrowedAudience}</p>
            </div>
          </>
        )}

        {letter.people.length > 0 && (
          <>
            <h3>People in the situation</h3>
            <ul>
              {letter.people.map((p) => (
                <li key={p.name}>
                  <strong>{p.name}.</strong> {p.role}{' '}
                  {p.search && (
                    <ScriptureLink search={p.search}>{p.search}</ScriptureLink>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <AnchorBlock title="In Acts" refs={letter.actsAnchors} />
        <AnchorBlock title="In the letter" refs={letter.letterAnchors} />
        {letter.otherWitness && letter.otherWitness.length > 0 && (
          <AnchorBlock title="Other apostles" refs={letter.otherWitness} />
        )}

        <h3>Dating note</h3>
        <div className="dating-box">
          <p>{letter.datingNote}</p>
        </div>

        <div className="drawer-links">
          <a
            className="primary"
            href={passageUrl(letter.bibleSearch)}
            target="_blank"
            rel="noreferrer"
          >
            Read {letter.shortTitle} (ESV)
          </a>
        </div>
      </aside>
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
