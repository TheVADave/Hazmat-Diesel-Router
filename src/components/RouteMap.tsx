import { useEffect, useRef, useState } from 'react'
import { loadHereMaps } from '../services/hereMapsLoader'
import type { RouteResult } from '../types'

const API_KEY = import.meta.env.VITE_HERE_API_KEY
const ROUTE_COLOR = '#f5a623'

// Roanoke, VA — a sensible default centre before the first route.
const DEFAULT_CENTER = { lat: 37.27, lng: -79.94 }

interface Props {
  route: RouteResult | null
}

export function RouteMap({ route }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const routeGroupRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Init the map once.
  useEffect(() => {
    let cancelled = false

    loadHereMaps()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const H = window.H
        const platform = new H.service.Platform({ apikey: API_KEY })
        const layers = platform.createDefaultLayers()
        const map = new H.Map(
          containerRef.current,
          layers.vector.normal.map,
          {
            zoom: 7,
            center: DEFAULT_CENTER,
            pixelRatio: window.devicePixelRatio || 1,
          },
        )
        new H.mapevents.Behavior(new H.mapevents.MapEvents(map))
        H.ui.UI.createDefault(map, layers)

        const onResize = () => map.getViewPort().resize()
        window.addEventListener('resize', onResize)

        mapRef.current = map
        ;(map as any)._onResize = onResize
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Could not load the map.')
      })

    return () => {
      cancelled = true
      const map = mapRef.current
      if (map) {
        window.removeEventListener('resize', (map as any)._onResize)
        map.dispose()
        mapRef.current = null
      }
    }
  }, [])

  // Redraw whenever the route changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const H = window.H

    if (routeGroupRef.current) {
      map.removeObject(routeGroupRef.current)
      routeGroupRef.current = null
    }
    if (!route) return

    const group = new H.map.Group()

    for (const section of route.sections) {
      const line = H.geo.LineString.fromFlexiblePolyline(section.polyline)
      group.addObject(
        new H.map.Polyline(line, {
          style: { lineWidth: 6, strokeColor: ROUTE_COLOR },
        }),
      )
    }

    route.waypoints.forEach((wp, i) => {
      const isEnd = i === route.waypoints.length - 1
      const isStart = i === 0
      const fill = isStart ? '#5ad17a' : isEnd ? '#e2533b' : ROUTE_COLOR
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">` +
        `<circle cx="11" cy="11" r="8" fill="${fill}" stroke="#0f1115" stroke-width="3"/></svg>`
      group.addObject(
        new H.map.Marker(
          { lat: wp.lat, lng: wp.lng },
          { icon: new H.map.Icon(svg, { size: { w: 22, h: 22 } }) },
        ),
      )
    })

    map.addObject(group)
    routeGroupRef.current = group

    const bounds = group.getBoundingBox()
    if (bounds) {
      map.getViewModel().setLookAtData({ bounds, padding: 48 })
    }
  }, [route])

  if (error) {
    return (
      <div className="map-shell map-error" role="alert">
        <p>{error}</p>
        <p className="map-error-hint">
          Check your internet connection and that VITE_HERE_API_KEY is set.
        </p>
      </div>
    )
  }

  return <div className="map-shell" ref={containerRef} aria-label="Route map" />
}
