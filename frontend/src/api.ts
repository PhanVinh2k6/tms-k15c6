export type ApiRole = { id: string | number; name?: string; label?: string; code?: string; tone?: string }
export type ApiUser = { id: string | number; name?: string; fullName?: string; email?: string; status?: string | boolean; isActive?: boolean; lastActive?: string; lastLoginAt?: string; roles?: ApiRole[]; role?: ApiRole }
export type Role = { id: string; label: string; tone: string }
export type UserRecord = { id: number | string; name: string; email: string; initials: string; color: string; roles: Role[]; status: 'Đang hoạt động' | 'Tạm khóa'; lastActive: string }

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const USERS_PATH = import.meta.env.VITE_USERS_PATH ?? '/api/users'
const ROLES_PATH = import.meta.env.VITE_ROLES_PATH ?? '/api/roles'
const toneByIndex = ['purple', 'blue', 'orange', 'green', 'pink', 'teal', 'slate']
const avatarColors = ['lavender', 'blue', 'peach', 'mint', 'rose', 'yellow']

const mockRoles: Role[] = [
  { id: 'training-manager', label: 'Quản lý đào tạo', tone: 'purple' },
  { id: 'admissions', label: 'Tư vấn tuyển sinh', tone: 'orange' },
  { id: 'instructor', label: 'Giảng viên', tone: 'green' },
  { id: 'accountant', label: 'Kế toán', tone: 'blue' },
  { id: 'ta', label: 'Trợ giảng', tone: 'teal' },
  { id: 'student', label: 'Học viên', tone: 'slate' },
]
let mockUsers: UserRecord[] = [
  { id: 1, name: 'Nguyễn Minh Anh', email: 'minhanh@eduflow.vn', initials: 'MA', color: 'lavender', roles: [mockRoles[0], mockRoles[1]], status: 'Đang hoạt động', lastActive: 'Vừa xong' },
  { id: 2, name: 'Trần Hoàng Nam', email: 'nam.tran@eduflow.vn', initials: 'TN', color: 'blue', roles: [mockRoles[2]], status: 'Đang hoạt động', lastActive: '5 phút trước' },
  { id: 3, name: 'Lê Thu Hà', email: 'ha.le@eduflow.vn', initials: 'LH', color: 'peach', roles: [mockRoles[3]], status: 'Đang hoạt động', lastActive: '18 phút trước' },
  { id: 4, name: 'Phạm Quốc Bảo', email: 'bao.pham@eduflow.vn', initials: 'PB', color: 'mint', roles: [], status: 'Tạm khóa', lastActive: 'Hôm qua' },
]

const wait = (ms = 260) => new Promise((resolve) => window.setTimeout(resolve, ms))
function url(path: string) { return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}` }
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('Chưa cấu hình VITE_API_BASE_URL. Đang dùng mock mode frontend.')
  const response = await fetch(url(path), { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) } })
  if (!response.ok) { const message = await response.text().catch(() => ''); throw new Error(message || `API ${response.status}: ${response.statusText}`) }
  if (response.status === 204) return undefined as T
  const raw = await response.text(); const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(raw) || /^\s*<html/i.test(raw)) throw new Error(`Frontend nhận index.html thay vì JSON từ ${path}.`)
  try { return JSON.parse(raw) as T } catch { throw new Error(`Backend trả về dữ liệu không hợp lệ từ ${path}.`) }
}
function listPayload<T>(payload: T[] | { data?: T[]; items?: T[]; results?: T[] }) { return Array.isArray(payload) ? payload : payload.data ?? payload.items ?? payload.results ?? [] }
function normalizeRole(role: ApiRole, index: number): Role { return { id: String(role.id ?? role.code ?? index), label: role.label ?? role.name ?? role.code ?? 'Vai trò', tone: role.tone ?? toneByIndex[index % toneByIndex.length] } }
function normalizeUser(user: ApiUser, index: number): UserRecord { const name = user.name ?? user.fullName ?? 'Người dùng'; const roles = [...(user.roles ?? []), ...(user.role ? [user.role] : [])].map((role, roleIndex) => normalizeRole(role, roleIndex)); const initials = name.split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'US'; const active = user.isActive ?? (user.status !== false && user.status !== 'inactive' && user.status !== 'Tạm khóa'); return { id: user.id, name, email: user.email ?? '', initials, color: avatarColors[index % avatarColors.length], roles, status: active ? 'Đang hoạt động' : 'Tạm khóa', lastActive: user.lastActive ?? user.lastLoginAt ?? 'Chưa có dữ liệu' } }

export async function getUsers(): Promise<UserRecord[]> { if (!API_BASE_URL) { await wait(); return structuredClone(mockUsers) } const payload = await request<ApiUser[] | { data?: ApiUser[]; items?: ApiUser[]; results?: ApiUser[] }>(USERS_PATH); return listPayload(payload).map(normalizeUser) }
export async function getRoles(): Promise<Role[]> { if (!API_BASE_URL) { await wait(180); return structuredClone(mockRoles) } const payload = await request<ApiRole[] | { data?: ApiRole[]; items?: ApiRole[]; results?: ApiRole[] }>(ROLES_PATH); return listPayload(payload).map(normalizeRole) }
export async function assignRole(userId: number | string, roleId: string) { if (!API_BASE_URL) { await wait(); const user = mockUsers.find((item) => String(item.id) === String(userId)); const role = mockRoles.find((item) => item.id === roleId); if (!user || !role) throw new Error('Không tìm thấy người dùng hoặc vai trò.'); if (!user.roles.some((item) => item.id === role.id)) user.roles.push(role); return } return request(`${USERS_PATH}/${encodeURIComponent(String(userId))}/roles`, { method: 'POST', body: JSON.stringify({ roleId, assignedById: 1 }) }) }
export async function revokeRole(userId: number | string, roleId: string) { if (!API_BASE_URL) { await wait(); const user = mockUsers.find((item) => String(item.id) === String(userId)); if (user) user.roles = user.roles.filter((role) => role.id !== roleId); return } return request(`${USERS_PATH}/${encodeURIComponent(String(userId))}/roles/${encodeURIComponent(roleId)}?actorId=1`, { method: 'DELETE' }) }
