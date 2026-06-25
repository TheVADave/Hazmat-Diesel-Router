import { useState } from 'react'
import { LoadSelector } from './components/LoadSelector'
import { StopInput } from './components/StopInput'
import { RouteMap } from './components/RouteMap'
import { RestrictionsList } from './components/RestrictionsList'
import { DEFAULT_LOAD } from './config/vehicle'
import { calculateRoute, RoutingError } from './services/hereRouting'
import type { LoadPreset, RouteResult, Stop } from './types'

let idCounter = 0
const newId = () => `stop-${++idCounter}`

const initialStops: Stop[] = [
  { id: newId(), role: 'origin', query: '' },
  { id: newId(), role: 'destination', query: '' },
]

export default function App() {
  const [stops, setStops] = useState<Stop[]>(initialStops)
  const [load, setLoad] = useState<LoadPreset>(DEFAULT_LOAD)
  const [route, setRoute] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateStop(id: string, query: string) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, query } : s)))
  }

  function addStop() {
    setStops((prev) => {
      const destIndex = prev.findIndex((s) => s.role === 'destination')
      const next = [...prev]
      next.splice(destIndex, 0, { id: newId(), role: 'via', query: '' })
      return next
    })
  }

  function removeStop(id: string) {
    setStops((prev) => prev.filter((s) => s.id !== id))
  }

  async function handleCalculate() {
    setError(null)
    setLoading(true)
    try {
      const result = await calculateRoute(stops, load)
      setRoute(result)
    } catch (err) {
      const message =
        err instanceof RoutingError
          ? err.message
          : 'Something went wrong calculating the route.'
      setError(message)
      setRoute(null)
    } finally {
      setLoading(false)
    }
  }

  const canCalculate =
    stops.filter((s) => s.query.trim().length > 0).length >= 2 && !loading

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <div>
            <h1 className="brand-title">Hazmat Diesel Router</h1>
            <p className="brand-sub">Class 3 tanker route planner</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="controls">
          <StopInput
            stops={stops}
            onChange={updateStop}
            onAddStop={addStop}
            onRemoveStop={removeStop}
          />
          <LoadSelector selected={load} onSelect={setLoad} />

          <button
            type="button"
            className="calculate"
            disabled={!canCalculate}
            onClick={handleCalculate}
          >
            {loading ? 'Calculating…' : 'Calculate Route'}
          </button>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="results">
          <RouteMap route={route} />
          <RestrictionsList route={route} load={load} />
        </div>
      </main>
    </div>
  )
}
