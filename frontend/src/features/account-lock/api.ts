import type {
  CreateUserPayload,
  DeleteResult,
  LockResult,
  RoleFilter,
  StatusFilter,
  UnlockResult,
  UpdateUserPayload,
  UserAccount,
  UserPage,
} from './types'

const API_URL = String(import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

/** JWT session is preferred; dev headers remain only for local UI work before login. */
export type SessionClaims = { sub: string; email?: string; roles?: string[]; exp?: number; sessionVersion?: number }

/**
 * Decode locally stored access-token claims for UI use without verifying the signature.
 * Return null for a missing or unreadable token, or when its exp claim has elapsed.
 */
export function getSession(): SessionClaims | null {
  const token = window.localStorage.getItem('tms.accessToken')
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const claims = JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as SessionClaims
    if (claims.exp && claims.exp * 1000 <= Date.now()) return null
    return claims
  } catch { return null }
}

/** Return the decoded session subject, falling back to the configured demo user ID. */
export function getCurrentUserId(): string {
  return getSession()?.sub ?? String(import.meta.env.VITE_DEV_USER_ID ?? 'admin-1')
}

/** Build Bearer headers from a stored access token, or use demo identity headers when absent. */
function getAuthHeaders(): Record<string, string> {
  const accessToken = window.localStorage.getItem('tms.accessToken')
  if (accessToken) return { Authorization: `Bearer ${accessToken}` }
  return { 'x-user-id': getCurrentUserId(), 'x-user-roles': String(import.meta.env.VITE_DEV_USER_ROLES ?? 'ADMIN') }
}

/** Lỗi từ backend (hoặc mất mạng). `code` khớp mã lỗi backend: ALREADY_LOCKED, NOT_LOCKED, ... */
export class ApiError extends Error {
  status: number
  code: string
  fieldErrors: Record<string, string>

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

function defaultCode(status: number): string {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  return 'UNKNOWN_ERROR'
}

function readMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value) return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return fallback
}

/**
 * Send an authenticated JSON request and return its decoded response body.
 * Eligible 401 responses trigger one refresh attempt and retry when allowRefresh is true.
 * Initial network and HTTP failures become ApiError; aborts and refresh transport errors propagate.
 */
async function request<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...getAuthHeaders(),
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'NETWORK_ERROR', 'Không kết nối được máy chủ. Hãy kiểm tra mạng hoặc thử lại.')
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    if (response.status === 401 && allowRefresh && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
      const refreshToken = window.sessionStorage.getItem('tms.refreshToken')
      if (refreshToken) {
        const renewed = await fetch(`${API_URL}/v1/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) })
        if (renewed.ok) {
          const renewedBody = await renewed.json() as LoginResult
          window.localStorage.setItem('tms.accessToken', renewedBody.data.accessToken)
          window.sessionStorage.setItem('tms.refreshToken', renewedBody.data.refreshToken)
          return request<T>(path, init, false)
        }
      }
      window.localStorage.removeItem('tms.accessToken')
      window.sessionStorage.removeItem('tms.refreshToken')
    }
    const data = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
    const errors = data.errors && typeof data.errors === 'object' ? (data.errors as Record<string, string>) : {}
    throw new ApiError(
      response.status,
      typeof data.code === 'string' ? data.code : defaultCode(response.status),
      readMessage(data.message, 'Đã có lỗi xảy ra. Vui lòng thử lại.'),
      errors,
    )
  }
  return body as T
}

export type ListParams = { q: string; status: StatusFilter; role: RoleFilter; page: number; pageSize: number }

export function listUsers(params: ListParams, signal?: AbortSignal): Promise<UserPage> {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.status) query.set('status', params.status)
  if (params.role) query.set('role', params.role)
  query.set('page', String(params.page))
  query.set('pageSize', String(params.pageSize))
  return request<UserPage>(`/users?${query.toString()}`, { signal })
}

export function lockUser(id: string, reason: string): Promise<LockResult> {
  return request<LockResult>(`/users/${encodeURIComponent(id)}/lock`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function unlockUser(id: string): Promise<UnlockResult> {
  return request<UnlockResult>(`/users/${encodeURIComponent(id)}/unlock`, { method: 'POST' })
}

export function createUser(payload: CreateUserPayload): Promise<UserAccount> {
  return request<UserAccount>('/users', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<UserAccount> {
  return request<UserAccount>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

/** Xóa hẳn tài khoản (không khôi phục được). Cần backend có DELETE /users/:id. */
export function deleteUser(id: string): Promise<DeleteResult> {
  return request<DeleteResult>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export type LoginResult = {
  data: {
    accessToken: string
    refreshToken: string
    user: { id: string; email: string; fullName: string }
  }
}

/** Submit credentials and the refresh-lifetime preference; the caller stores returned tokens. */
export function login(email: string, password: string, remember: boolean): Promise<LoginResult> {
  return request<LoginResult>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember }),
  })
}

/**
 * Attempt server logout without refreshing, then clear local access and refresh tokens.
 * Server logout failures are ignored so the browser session can still be cleared.
 */
export async function logout(): Promise<void> {
  const token = window.localStorage.getItem('tms.accessToken')
  if (token) await request('/v1/auth/logout', { method: 'POST' }, false).catch(() => undefined)
  window.localStorage.removeItem('tms.accessToken')
  window.sessionStorage.removeItem('tms.refreshToken')
}

/** Submit an activation token and new password, returning the server confirmation message. */
export function activateAccount(token: string, newPassword: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/activate', { method: 'POST', body: JSON.stringify({ token, newPassword }) })
}
