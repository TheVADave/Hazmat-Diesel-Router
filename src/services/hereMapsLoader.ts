// Loads the HERE Maps JS SDK (v3.1) by injecting its script tags once.
// The SDK isn't a clean npm module — it attaches to window.H — so we load it
// from HERE's CDN and resolve when it's ready. Subsequent calls reuse the same
// promise, so the scripts are only fetched a single time.

const SDK_VERSION = '3.1'
const BASE = `https://js.api.here.com/v3/${SDK_VERSION}`

const SCRIPTS = [
  `${BASE}/mapsjs-core.js`,
  `${BASE}/mapsjs-service.js`,
  `${BASE}/mapsjs-mapevents.js`,
  `${BASE}/mapsjs-ui.js`,
]
const STYLESHEET = `${BASE}/mapsjs-ui.css`

let loaderPromise: Promise<void> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already on the page? Done.
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const el = document.createElement('script')
    el.src = src
    el.async = false // preserve order — service depends on core, etc.
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Failed to load HERE SDK script: ${src}`))
    document.head.appendChild(el)
  })
}

function loadStylesheet(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

/** Resolves once window.H is available. Safe to call repeatedly. */
export function loadHereMaps(): Promise<void> {
  if (loaderPromise) return loaderPromise

  loaderPromise = (async () => {
    loadStylesheet(STYLESHEET)
    // Sequential — each script can depend on the previous one.
    for (const src of SCRIPTS) {
      await loadScript(src)
    }
    if (!window.H) {
      throw new Error('HERE SDK loaded but window.H is missing.')
    }
  })()

  return loaderPromise
}
