export type ApiRole = {
  id: string | number
  name?: string
  label?: string
  code?: string
  tone?: string
}

export type ApiUser = {
  id: string | number
  name?: string
  fullName?: string
  email?: string
  status?: string | boolean
  isActive?: boolean
  lastActive?: string
  lastLoginAt?: string
  roles?: ApiRole[]
  role?: ApiRole
}

export type Role = { id: string; label: string; tone: string }
export type UserRecord = { id: number | string; name: string; email: string; initials: string; color: string; roles: Role[]; status: 'Đang hoạt động' | 'Tạm khóa'; lastActive: string }

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const USERS_PATH = import.meta.env.VITE_USERS_PATH ?? '/api/users'
const ROLES_PATH = import.meta.env.VITE_ROLES_PATH ?? '/api/roles'

const toneByIndex = ['purple', 'blue', 'orange', 'green', 'pink', 'teal', 'slate']
const avatarColors = ['lavender', 'blue', 'peach', 'mint', 'rose', 'yellow']

function url(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Chưa cấu hình VITE_API_BASE_URL. Hãy trỏ biến này tới URL backend S9 trước khi chạy frontend.')
  }
  const response = await fetch(url(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  })
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || `API ${response.status}: ${response.statusText}`)
  }
  if (response.status === 204) return undefined as T
  const raw = await response.text()
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(raw) || /^\s*<html/i.test(raw)) {
    throw new Error(`Frontend đang nhận index.html thay vì JSON từ ${path}. Hãy cấu hình VITE_API_BASE_URL trỏ tới backend S9.`)
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Backend trả về dữ liệu không hợp lệ (không phải JSON) từ ${path}.`)
  }
}

function listPayload<T>(payload: T[] | { data?: T[]; items?: T[]; results?: T[] }) {
  if (Array.isArray(payload)) return payload
  return payload.data ?? payload.items ?? payload.results ?? []
}

function normalizeRole(role: ApiRole, index: number): Role {
  return { id: String(role.id ?? role.code ?? index), label: role.label ?? role.name ?? role.code ?? 'Vai trò', tone: role.tone ?? toneByIndex[index % toneByIndex.length] }
}

function normalizeUser(user: ApiUser, index: number): UserRecord {
  const name = user.name ?? user.fullName ?? 'Người dùng'
  const roles = [...(user.roles ?? []), ...(user.role ? [user.role] : [])].map((role, roleIndex) => normalizeRole(role, roleIndex))
  const initials = name.split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'US'
  const active = user.isActive ?? (user.status !== false && user.status !== 'inactive' && user.status !== 'Tạm khóa')
  return { id: user.id, name, email: user.email ?? '', initials, color: avatarColors[index % avatarColors.length], roles, status: active ? 'Đang hoạt động' : 'Tạm khóa', lastActive: user.lastActive ?? user.lastLoginAt ?? 'Chưa có dữ liệu' }
}

export async function getUsers(): Promise<UserRecord[]> {
  const payload = await request<ApiUser[] | { data?: ApiUser[]; items?: ApiUser[]; results?: ApiUser[] }>(USERS_PATH)
  return listPayload(payload).map(normalizeUser)
}

export async function getRoles(): Promise<Role[]> {
  const payload = await request<ApiRole[] | { data?: ApiRole[]; items?: ApiRole[]; results?: ApiRole[] }>(ROLES_PATH)
  return listPayload(payload).map(normalizeRole)
}

export async function assignRole(userId: number | string, roleId: string) {
  return request(`${USERS_PATH}/${encodeURIComponent(String(userId))}/roles`, { method: 'POST', body: JSON.stringify({ roleId, assignedById: 1 }) })
}

export async function revokeRole(userId: number | string, roleId: string) {
  return request(`${USERS_PATH}/${encodeURIComponent(String(userId))}/roles/${encodeURIComponent(roleId)}?actorId=1`, { method: 'DELETE' })
}
