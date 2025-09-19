

// Resolve backend base URL with fallbacks:
// 1. In production use `VITE_PRODUCTION_API_BASE_URL` if set
// 2. In development use `VITE_API_BASE_URL` if set
// 3. Otherwise, fall back to same-origin (empty string) so fetch('/api/...') works

function trimSlash(url) {
  if (!url) return url
  return url.replace(/\/$/, '')
}

let backEndURL = ''
const mode = import.meta.env.MODE

if (mode == "production") {
  backEndURL = import.meta.env.VITE_PRODUCTION_API_BASE_URL || ''
} else {
  backEndURL = import.meta.env.VITE_API_BASE_URL || ''
}

backEndURL = trimSlash(backEndURL)

export default backEndURL