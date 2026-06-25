import type { LoadPreset, RouteResult } from '../types'

interface Props {
  route: RouteResult | null
  load: LoadPreset
}

function miles(meters: number): string {
  return (meters / 1609.344).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })
}

function hoursMinutes(seconds: number): string {
  const total = Math.round(seconds / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return `${h} hr ${m} min`
}

export function RestrictionsList({ route, load }: Props) {
  if (!route) return null

  const enforced = [
    `Class 3 flammable goods — roads & tunnels banning diesel excluded`,
    `Tunnel avoidance — restrictive tunnel categories detoured`,
    `Bridge & weight check — routed for ${load.grossWeightLb.toLocaleString()} lb gross`,
    `Clearance check — 13'6" height, 102" width`,
  ]

  return (
    <section className="panel" aria-labelledby="restrict-heading">
      <h2 id="restrict-heading" className="panel-title">
        Route summary
      </h2>

      <div className="metrics">
        <div className="metric">
          <span className="metric-value">{miles(route.totalDistanceMeters)}</span>
          <span className="metric-label">miles</span>
        </div>
        <div className="metric">
          <span className="metric-value">
            {hoursMinutes(route.totalDurationSeconds)}
          </span>
          <span className="metric-label">drive time</span>
        </div>
        <div className="metric">
          <span className="metric-value">{route.waypoints.length}</span>
          <span className="metric-label">stops</span>
        </div>
      </div>

      <h3 className="subhead">Hazmat rules applied</h3>
      <ul className="rule-list">
        {enforced.map((rule) => (
          <li key={rule} className="rule-item rule-item--ok">
            {rule}
          </li>
        ))}
      </ul>

      <h3 className="subhead">Route notices</h3>
      {route.notices.length === 0 ? (
        <p className="notice-clear">
          No restriction conflicts — HERE returned a hazmat-compliant route.
        </p>
      ) : (
        <ul className="rule-list">
          {route.notices.map((notice, i) => (
            <li
              key={`${notice.code ?? notice.title}-${i}`}
              className={`rule-item rule-item--${notice.severity}`}
            >
              {notice.title}
              {notice.code ? ` (${notice.code})` : ''}
            </li>
          ))}
        </ul>
      )}

      <p className="disclaimer">
        Planning aid only — not a compliance guarantee. Watch posted signs and
        local time-of-day hazmat bans while driving.
      </p>
    </section>
  )
}
