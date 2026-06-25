// Shared types for the hazmat router.

export type StopRole = 'origin' | 'via' | 'destination'

export interface Stop {
  id: string
  role: StopRole
  /** What the driver typed: a street address or "lat,lng". */
  query: string
  /** Filled in after geocoding. */
  lat?: number
  lng?: number
  /** Human-readable label resolved by the geocoder. */
  label?: string
}

/** A selectable diesel load. Weights are imperial; we convert to kg for HERE. */
export interface LoadPreset {
  gallons: number
  label: string
  /** Loaded gross vehicle weight in pounds (tare + diesel weight). */
  grossWeightLb: number
}

/** One leg of the calculated route, ready to draw. */
export interface RouteSection {
  /** HERE flexible-polyline string for this section. */
  polyline: string
  distanceMeters: number
  durationSeconds: number
}

/** Anything HERE flagged on the route (warnings, restriction conflicts). */
export interface RouteNotice {
  title: string
  code?: string
  severity: 'info' | 'warning' | 'critical'
}

export interface RouteResult {
  sections: RouteSection[]
  totalDistanceMeters: number
  totalDurationSeconds: number
  /** Resolved coordinates for each stop, in order. */
  waypoints: { lat: number; lng: number; label: string }[]
  notices: RouteNotice[]
}
