import { yearBounds, yearPosition, yearTicks } from '../lib/chronology'
import { useApp } from '../state/AppState'

export function TimeScrubber() {
  const app = useApp()
  const { min, max } = yearBounds()
  const t = yearPosition(app.year)
  const ticks = yearTicks()

  return (
    <div className="scrubber">
      <div className="slider-wrap">
        <div className="slider-track">
          <div className="slider-fill" style={{ width: `${t * 100}%` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={app.year}
          aria-label="Year"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={app.year}
          aria-valuetext={`AD ${app.year}`}
          onChange={(e) => app.setYear(Number(e.target.value))}
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
