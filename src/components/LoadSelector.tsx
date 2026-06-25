import type { LoadPreset } from '../types'
import { LOAD_PRESETS } from '../config/vehicle'

interface Props {
  selected: LoadPreset
  onSelect: (preset: LoadPreset) => void
}

const OVERWEIGHT_LB = 80_000

export function LoadSelector({ selected, onSelect }: Props) {
  return (
    <section className="panel" aria-labelledby="load-heading">
      <h2 id="load-heading" className="panel-title">
        Diesel load <span className="hazmat-tag">Class 3 · UN1202</span>
      </h2>

      <div className="load-grid" role="radiogroup" aria-label="Diesel load">
        {LOAD_PRESETS.map((preset) => {
          const active = preset.gallons === selected.gallons
          return (
            <button
              key={preset.gallons}
              type="button"
              role="radio"
              aria-checked={active}
              className={`load-chip${active ? ' load-chip--active' : ''}`}
              onClick={() => onSelect(preset)}
            >
              <span className="load-chip-gal">{preset.label}</span>
            </button>
          )
        })}
      </div>

      <p className="load-readout">
        Gross weight:{' '}
        <strong>{selected.grossWeightLb.toLocaleString()} lb</strong>
        {selected.grossWeightLb > OVERWEIGHT_LB && (
          <span className="load-warn"> · over 80,000 lb — permit load</span>
        )}
      </p>
    </section>
  )
}
