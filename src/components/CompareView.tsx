import { compareInsight, PRESET_COMPARISONS } from '../data/compare'
import { LETTERS, LETTER_BY_ID } from '../data/letters'
import { AUDIENCE_META } from '../data/periods'
import { datingOf } from '../lib/chronology'
import { useApp } from '../state/AppState'

export function CompareView() {
  const app = useApp()
  const a = app.compare[0] ? LETTER_BY_ID[app.compare[0]] : undefined
  const b = app.compare[1] ? LETTER_BY_ID[app.compare[1]] : undefined
  const scheme = app.filters.datingScheme

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Compare</h1>
          <p>Pick two letters. The point is not ranking them. It is seeing what the audience does to the document.</p>
        </div>
      </div>

      <div className="presets">
        {PRESET_COMPARISONS.map((p) => (
          <button
            key={`${p.a}-${p.b}`}
            type="button"
            className="chip"
            onClick={() => app.setComparePair(p.a, p.b)}
          >
            {LETTER_BY_ID[p.a]?.shortTitle} vs {LETTER_BY_ID[p.b]?.shortTitle}
          </button>
        ))}
      </div>

      <div className="compare-grid">
        <CompareColumn slot={0} selectedId={app.compare[0]} exclude={app.compare[1]} />
        <CompareColumn slot={1} selectedId={app.compare[1]} exclude={app.compare[0]} />
        {a && b && (
          <div className="insight">
            <h3>What changes when the audience shrinks or the writer is in chains?</h3>
            <p>{compareInsight(a, b, scheme)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CompareColumn({
  slot,
  selectedId,
  exclude,
}: {
  slot: 0 | 1
  selectedId: string | null
  exclude: string | null
}) {
  const app = useApp()
  const letter = selectedId ? LETTER_BY_ID[selectedId] : undefined
  const d = letter ? datingOf(letter, app.filters.datingScheme) : null
  const audience = letter ? AUDIENCE_META[letter.audienceType] : null

  return (
    <div className="compare-col">
      <label>
        <span className="filter-label" style={{ color: 'var(--gold-dim)' }}>
          Letter {slot === 0 ? 'A' : 'B'}
        </span>
        <select
          value={selectedId ?? ''}
          onChange={(e) => app.setCompare(slot, e.target.value || null)}
        >
          <option value="">Choose a letter…</option>
          {LETTERS.filter((l) => l.id !== exclude).map((l) => (
            <option key={l.id} value={l.id}>
              {l.shortTitle}
            </option>
          ))}
        </select>
      </label>

      {letter && d && audience && (
        <>
          <h2>
            <button
              type="button"
              className="ghost-btn"
              style={{ paddingLeft: 0, border: 0 }}
              onClick={() => app.selectLetter(letter.id)}
            >
              {letter.title}
            </button>
          </h2>
          <p>
            <strong>From / to.</strong> {d.originLabel} → {letter.destinationLabel} ({d.yearDisplay})
          </p>
          <p>
            <strong>Audience.</strong> {audience.label}. {letter.audiencePortrait}
          </p>
          <p>
            <strong>Occasion.</strong> {letter.occasion}
          </p>
          <p>
            <strong>Dominant themes.</strong> {letter.themes.join(' · ')}
          </p>
          {d.debateNote && app.filters.datingScheme === 'debated' && (
            <p className="debate-note">{d.debateNote}</p>
          )}
        </>
      )}
    </div>
  )
}
