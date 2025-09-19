let url = ''
if (import.meta.env.VITE_MODE == "production") {
  url = import.meta.env.VITE_PRODUCTION_API_BASE_URL
} else {
  url = import.meta.env.VITE_API_BASE_URL
}

export const backEndURL = url