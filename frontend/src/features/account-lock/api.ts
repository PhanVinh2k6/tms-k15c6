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
export function getCurrentUserId(): string {
  return String(import.meta.env.VITE_DEV_USER_ID ?? 'admin-1')
}

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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

export function login(email: string, password: string, remember: boolean): Promise<LoginResult> {
  return request<LoginResult>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember }),
  })
}
