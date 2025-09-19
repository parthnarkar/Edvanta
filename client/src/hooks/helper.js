

// Dynamic Way based on environment i.e. production or development

let backEndURL;

if (import.meta.env.MODE === 'production') {
  backEndURL = import.meta.env.VITE_PRODUCTION_API_BASE_URL
}
else {
  backEndURL = import.meta.env.VITE_API_BASE_URL
}

export default backEndURL