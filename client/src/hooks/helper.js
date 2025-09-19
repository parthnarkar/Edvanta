// Determine backend base URL for client builds.
// Priority: explicit production env var -> dev env var -> same-origin (empty string) -> hard fallback.
let url = ''
const mode = import.meta.env.MODE || import.meta.env.VITE_MODE || 'development'
if (mode === 'production') {
  url = import.meta.env.VITE_PRODUCTION_API_BASE_URL || ''
} else {
  url = import.meta.env.VITE_API_BASE_URL || ''
}

// Default to same-origin if nothing configured
if (!url) url = ''

export const backEndURL = url
export default backEndURL