/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_HERE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// The HERE Maps JS SDK attaches itself to window.H at runtime.
// Typed loosely on purpose so we don't need the full @types package.
interface Window {
  H: any
}
