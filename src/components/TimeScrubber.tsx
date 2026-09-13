import { yearBounds, yearFromPosition, yearPosition } from '../lib/chronology'
import { useApp } from '../state/AppState'

export function TimeScrubber() {
  const app = useApp()
  const { min, max } = yearBounds()
  const t = yearPosition(app.year)
  const ticks = [48, 51, 54, 57, 60, 64, 68]

  return (
    <div className="scrubber">
      <div className="slider-wrap">
        <div className="slider-track">
          <div className="slider-fill" style={{ width: `${t * 100}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(t * 1000)}
          aria-label="Year"
          aria-valuetext={`AD ${app.year}`}
          onChange={(e) => app.setYear(yearFromPosition(Number(e.target.value) / 1000))}
        />
        <div className="ticks">
          {ticks.map((y) => (
            <span key={y} className="tick" style={{ left: `${yearPosition(y) * 100}%` }}>
              {y}
            </span>
          ))}
        </div>
      </div>

      <div className="year-readout" aria-live="polite">
        AD {app.year}
        <div className="year-span">
          {min}–{max}
        </div>
      </div>
    </div>
  )
}
