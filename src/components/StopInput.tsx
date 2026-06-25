import type { Stop } from '../types'

interface Props {
  stops: Stop[]
  onChange: (id: string, query: string) => void
  onAddStop: () => void
  onRemoveStop: (id: string) => void
}

function roleLabel(stop: Stop, viaNumber: number): string {
  if (stop.role === 'origin') return 'Start'
  if (stop.role === 'destination') return 'End'
  return `Stop ${viaNumber}`
}

export function StopInput({ stops, onChange, onAddStop, onRemoveStop }: Props) {
  let viaCounter = 0

  return (
    <section className="panel" aria-labelledby="stops-heading">
      <h2 id="stops-heading" className="panel-title">
        Stops
      </h2>

      <ol className="stop-list">
        {stops.map((stop) => {
          if (stop.role === 'via') viaCounter += 1
          const label = roleLabel(stop, viaCounter)
          return (
            <li key={stop.id} className="stop-row">
              <span
                className={`stop-dot stop-dot--${stop.role}`}
                aria-hidden="true"
              />
              <label className="stop-field">
                <span className="stop-label">{label}</span>
                <input
                  type="text"
                  className="stop-input"
                  inputMode="text"
                  autoComplete="off"
                  placeholder={
                    stop.role === 'origin'
                      ? 'Pickup address or lat,lng'
                      : stop.role === 'destination'
                        ? 'Delivery address or lat,lng'
                        : 'Address or lat,lng'
                  }
                  value={stop.query}
                  onChange={(e) => onChange(stop.id, e.target.value)}
                />
              </label>
              {stop.role === 'via' && (
                <button
                  type="button"
                  className="stop-remove"
                  aria-label={`Remove ${label}`}
                  onClick={() => onRemoveStop(stop.id)}
                >
                  ×
                </button>
              )}
            </li>
          )
        })}
      </ol>

      <button type="button" className="add-stop" onClick={onAddStop}>
        + Add stop
      </button>
    </section>
  )
}
