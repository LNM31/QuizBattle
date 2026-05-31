// T25 — relative base URL (default '/api'). Requests are same-origin and go through the
// Vite dev-server proxy to the Spring backend, so the app works identically on localhost
// and over an ngrok tunnel without any CORS config. Override with VITE_API_URL if needed.
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  public status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // Skip ngrok's free-tier browser interstitial so fetch() gets JSON, not HTML.
      'ngrok-skip-browser-warning': 'true',
    },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(res.status, text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  // multipart/form-data — Content-Type cleared so the browser sets the boundary itself (T19 PDF upload).
  // Keep the ngrok header so the upload response isn't replaced by the interstitial page.
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, {
      method: 'POST',
      body: form,
      headers: { 'ngrok-skip-browser-warning': 'true' },
    }),
}
