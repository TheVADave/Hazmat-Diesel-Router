# Hazmat Diesel Router

A React PWA for planning **hazmat-safe routes** for Class 3 diesel tanker hauls,
built on the **HERE Routing API v8**. Enter your stops, pick a load, and it
returns a truck route that avoids tunnels, weight-restricted bridges, and roads
that ban flammable cargo.

This is **v1 — the main screen + route calculation only.** More from the plan
(GPX export, Fuel Tracker sync, saved runs, corridor intelligence) comes next.

## What's in v1

- Dark theme with amber accents, big touch targets for in-cab use
- Multi-stop input: origin + add as many stops as you need + destination
  (accepts addresses **or** `lat,lng`)
- Diesel load presets — 500 / 2,000 / 5,000 / 6,500 / 8,000 gal, with live gross
  weight (flags anything over 80,000 lb as a permit load)
- One big **Calculate Route** button
- Interactive HERE map with the route drawn in amber and start/stop markers
- Summary panel: miles, drive time, stops, the hazmat rules that were enforced,
  and any restriction notices HERE returns

## Setup

You'll need [Node.js](https://nodejs.org) 18+ and a free HERE API key.

1. **Get a HERE key** — sign up at <https://platform.here.com> (Base Plan, free
   tier covers ~1,000 routes/month). Create a project and copy the API key.

2. **Install and configure:**

   ```bash
   npm install
   cp .env.example .env
   # open .env and paste your key into VITE_HERE_API_KEY
   ```

3. **Run it:**

   ```bash
   npm run dev
   ```

   Open the URL it prints (usually <http://localhost:5173>).

4. **Build for production:**

   ```bash
   npm run build
   npm run preview
   ```

## The hazmat parameters (v1 defaults)

The route call uses HERE's truck mode with these options:

| Parameter                       | Value       | Why                                          |
| ------------------------------- | ----------- | -------------------------------------------- |
| `transportMode`                 | `truck`     | commercial vehicle routing                   |
| `truck[shippedHazardousGoods]`  | `flammable` | excludes roads/tunnels banning Class 3       |
| `truck[tunnelCategory]`         | `C`         | detours more-restrictive tunnel classes      |
| `truck[grossWeight]`            | from load   | keeps off weight-restricted bridges          |
| `truck[height/width/length]`    | 410/260/1900 cm | clearance checks (13'6", 102", ~62 ft)  |
| `truck[axleCount/trailerCount]` | 5 / 1       | weight distribution on bridges               |

Diesel is **UN1202**. The plan specifies `flammable`; if you ever need stricter
combustible handling, it's a one-line change in `src/services/hereRouting.ts`.

## How "avoided restrictions" works

A successful hazmat route **silently routes around** banned tunnels and roads —
HERE doesn't hand back a "Fort McHenry tunnel avoided" line. So v1 shows the
rules that were enforced, plus any `notices` HERE attaches when it can't fully
comply. The explicit "this tunnel was detoured" list needs a compare-against-
normal-route step, which is on the roadmap (per the plan's "Route comparison"
future addition).

## Note on the API key

Vite bundles `VITE_HERE_API_KEY` into the browser, so it's visible to anyone who
loads the app. That's normal for client-side HERE apps — the fix is to **lock
the key by domain** in the HERE dashboard (Access Manager → Allowed referrers)
before putting it online.

## Project structure

```
hazmat-router/
├── .env.example
├── index.html
├── vite.config.ts
├── public/
│   └── icon.svg
└── src/
    ├── App.tsx                  main screen + state
    ├── main.tsx
    ├── index.css                dark/amber theme
    ├── types.ts
    ├── config/
    │   └── vehicle.ts           load presets, weights, dimensions
    ├── services/
    │   ├── hereMapsLoader.ts    loads the HERE map SDK
    │   └── hereRouting.ts       geocoding + routing v8 call
    └── components/
        ├── StopInput.tsx
        ├── LoadSelector.tsx
        ├── RouteMap.tsx
        └── RestrictionsList.tsx
```

---

Planning aid only — not a compliance guarantee. Always watch posted signs and
local time-of-day hazmat bans on the road.
