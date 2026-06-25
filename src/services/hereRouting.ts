import type { LoadPreset, RouteResult, RouteNotice, Stop } from '../types'
import { TRUCK_DIMENSIONS, lbToKg } from '../config/vehicle'

const API_KEY = import.meta.env.VITE_HERE_API_KEY

const GEOCODE_URL = 'https://geocode.search.hereapi.com/v1/geocode'
const ROUTING_URL = 'https://router.hereapi.com/v8/routes'

// "lat,lng" — lets a driver paste coordinates instead of an address.
const COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/

export class RoutingError extends Error {}

function assertApiKey(): void {
  if (!API_KEY) {
    throw new RoutingError(
      'No HERE API key found. Copy .env.example to .env and set VITE_HERE_API_KEY, then restart the dev server.',
    )
  }
}

export interface ResolvedStop {
  lat: number
  lng: number
  label: string
}

/** Turn an address or "lat,lng" string into coordinates. */
export async function geocode(query: string): Promise<ResolvedStop> {
  assertApiKey()
  const trimmed = query.trim()

  const coordMatch = trimmed.match(COORD_RE)
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2]),
      label: trimmed,
    }
  }

  const url = new URL(GEOCODE_URL)
  url.searchParams.set('q', trimmed)
  url.searchParams.set('in', 'countryCode:USA') // diesel runs are US (VA/MD focus)
  url.searchParams.set('limit', '1')
  url.searchParams.set('apikey', API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new RoutingError(`Geocoding failed (${res.status}) for "${trimmed}".`)
  }
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) {
    throw new RoutingError(`Couldn't find a location for "${trimmed}".`)
  }
  return {
    lat: item.position.lat,
    lng: item.position.lng,
    label: item.title ?? trimmed,
  }
}

function mapNoticeSeverity(severity?: string): RouteNotice['severity'] {
  if (severity === 'critical') return 'critical'
  if (severity === 'info') return 'info'
  return 'warning'
}

/**
 * Calculate a hazmat-safe truck route through all stops in order.
 *
 * Hazmat handling (HERE Routing v8 truck options):
 *   shippedHazardousGoods=flammable  -> excludes roads/tunnels that ban
 *                                       Class 3 flammable liquids (diesel)
 *   tunnelCategory=C                 -> avoids more-restrictive tunnel classes
 *   grossWeight / dimensions         -> keeps off weight- and clearance-
 *                                       restricted bridges and overpasses
 *
 * Diesel is UN1202. The plan calls for "flammable"; if you ever need the
 * stricter combustible handling, swap the value below.
 */
export async function calculateRoute(
  stops: Stop[],
  load: LoadPreset,
): Promise<RouteResult> {
  assertApiKey()

  const usable = stops.filter((s) => s.query.trim().length > 0)
  if (usable.length < 2) {
    throw new RoutingError('Enter at least an origin and a destination.')
  }

  // Geocode every stop in order.
  const resolved: ResolvedStop[] = []
  for (const stop of usable) {
    resolved.push(await geocode(stop.query))
  }

  const origin = resolved[0]
  const destination = resolved[resolved.length - 1]
  const vias = resolved.slice(1, -1)

  const params = new URLSearchParams()
  params.set('transportMode', 'truck')
  params.set('origin', `${origin.lat},${origin.lng}`)
  params.set('destination', `${destination.lat},${destination.lng}`)
  for (const via of vias) {
    params.append('via', `${via.lat},${via.lng}`)
  }
  params.set('return', 'polyline,summary')
  params.set('routingMode', 'fast') // favours highways, per the plan

  // Truck profile + hazmat.
  params.set('truck[grossWeight]', String(lbToKg(load.grossWeightLb)))
  params.set('truck[height]', String(TRUCK_DIMENSIONS.heightCm))
  params.set('truck[width]', String(TRUCK_DIMENSIONS.widthCm))
  params.set('truck[length]', String(TRUCK_DIMENSIONS.lengthCm))
  params.set('truck[axleCount]', String(TRUCK_DIMENSIONS.axleCount))
  params.set('truck[trailerCount]', String(TRUCK_DIMENSIONS.trailerCount))
  params.set('truck[shippedHazardousGoods]', 'flammable')
  params.set('truck[tunnelCategory]', 'C')

  params.set('apikey', API_KEY)

  const res = await fetch(`${ROUTING_URL}?${params.toString()}`)
  const data = await res.json()

  if (!res.ok) {
    const detail = data?.title || data?.cause || `HTTP ${res.status}`
    throw new RoutingError(`Route calculation failed: ${detail}`)
  }

  const route = data.routes?.[0]
  if (!route) {
    throw new RoutingError(
      'No hazmat-legal route found between these stops. Try different stops or a smaller load.',
    )
  }

  // Collect sections, totals, and any notices HERE attached.
  const sections = (route.sections ?? []).map((section: any) => ({
    polyline: section.polyline as string,
    distanceMeters: section.summary?.length ?? 0,
    durationSeconds: section.summary?.duration ?? 0,
  }))

  const notices: RouteNotice[] = []
  for (const section of route.sections ?? []) {
    for (const notice of section.notices ?? []) {
      notices.push({
        title: notice.title ?? 'Route notice',
        code: notice.code,
        severity: mapNoticeSeverity(notice.severity),
      })
    }
  }

  const totalDistanceMeters = sections.reduce(
    (sum: number, s: { distanceMeters: number }) => sum + s.distanceMeters,
    0,
  )
  const totalDurationSeconds = sections.reduce(
    (sum: number, s: { durationSeconds: number }) => sum + s.durationSeconds,
    0,
  )

  return {
    sections,
    totalDistanceMeters,
    totalDurationSeconds,
    waypoints: resolved,
    notices,
  }
}
