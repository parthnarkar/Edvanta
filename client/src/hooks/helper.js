

// Dynamic backend base URL helper.
// - In production, prefer `VITE_PRODUCTION_API_BASE_URL` (set in Vercel env).
// - If that variable is not set, fall back to same-origin `/api` so
//   the client works when both frontend and backend are on the same domain.
// - In development, use `VITE_API_BASE_URL` (e.g., http://localhost:5000).

let backEndURL = "";

if (import.meta.env.MODE === "production") {
  backEndURL = import.meta.env.VITE_PRODUCTION_API_BASE_URL;
  // If no explicit production URL provided, use same-origin `/api`.
  if (!backEndURL) {
    // empty string indicates same origin; client code concatenates paths like `${backEndURL}/api/...`
    backEndURL = "";
  }
} else {
  backEndURL = import.meta.env.VITE_API_BASE_URL;
}

// Normalize: remove trailing slash if present
if (backEndURL && backEndURL.endsWith("/")) backEndURL = backEndURL.slice(0, -1);

export default backEndURL;