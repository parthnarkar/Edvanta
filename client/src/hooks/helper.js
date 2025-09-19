// Determine backend base URL for client builds.
// Priority: explicit production env var -> dev env var -> same-origin (empty string) -> hard fallback.
let url = ''
const mode =import.meta.env.VITE_MODE
if (mode === 'production') {
  url = import.meta.env.VITE_PRODUCTION_API_BASE_URL || ''
} else {
  url = import.meta.env.VITE_API_BASE_URL || ''
}

// If nothing is configured, prefer same-origin (empty string) so `/api/...` hits the frontend origin.
// As a safety-net, fall back to the known Vercel backend if someone built with incorrect envs.
if (!url) {
  url = '' // empty string means same-origin; leave hard fallback commented here intentionally
  url = 'https://edvanta-backend.vercel.app' // uncomment to force Vercel backend
}

export const backEndURL = url
export default backEndURL