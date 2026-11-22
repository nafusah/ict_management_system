const AUTH_KEY = 'it-management:session'

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(AUTH_KEY)
    sessionStorage.removeItem(AUTH_KEY)
  } catch {
    // ignore storage errors
  }
}

export function notifyUnauthorized(): void {
  clearStoredSession()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('it-auth:unauthorized'))
  }
}

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') {
      notifyUnauthorized()
    }
    let msg = 'حدث خطأ، يرجى المحاولة لاحقاً.'
    if (res.status < 500) {
      try {
        const data = (await res.json()) as { message?: string }
        if (data?.message) msg = data.message
      } catch {
        // ignore non-JSON error body
      }
    }
    throw new ApiError(res.status, msg)
  }

  return (await res.json()) as T
}

export const request = {
  get: <T>(path: string) => apiRequest<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T = { deleted: boolean }>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
}
