/** Kiểu dữ liệu khớp với backend S1-08 / S1-10 (backend/src/users/user.types.ts). */

export type UserStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'LOCKED'

export type Role =
  | 'ADMIN'
  | 'INSTRUCTOR'
  | 'TRAINING_MANAGER'
  | 'ADMISSIONS'
  | 'ACCOUNTANT'
  | 'TA'
  | 'STUDENT'
  | 'GUEST'

export type UserAccount = {
  id: string
  fullName: string
  email: string
  phone: string | null
  roles: Role[]
  status: UserStatus
  createdAt: string
  updatedAt: string
  /** Chỉ có giá trị khi status = LOCKED. */
  lockedReason: string | null
  lockedAt: string | null
}

export type UserPage = {
  items: UserAccount[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type AssignedClass = { id: string; name: string }

/** Khác null khi người bị khoá đang phụ trách lớp (hoặc không kiểm tra được danh sách lớp). */
export type HandoverWarning = { message: string; classes: AssignedClass[] }

export type LockResult = { user: UserAccount; handoverWarning: HandoverWarning | null }

export type UnlockResult = { user: UserAccount }

export type StatusFilter = '' | UserStatus

export type RoleFilter = '' | Role

/** Dữ liệu form tạo tài khoản (khớp CreateUserInput của backend). */
export type CreateUserPayload = {
  fullName: string
  email: string
  phone: string | null
  roles: Role[]
}

/** Chỉ gửi những trường thật sự đổi (backend chỉ nhận fullName, email, phone). */
export type UpdateUserPayload = {
  fullName?: string
  email?: string
  phone?: string | null
}

export type DeleteResult = { id: string }

export const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'Hoạt động',
  PENDING_ACTIVATION: 'Chờ kích hoạt',
  LOCKED: 'Đã khoá',
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị hệ thống',
  INSTRUCTOR: 'Giảng viên',
  TRAINING_MANAGER: 'Quản lý đào tạo',
  ADMISSIONS: 'Tư vấn tuyển sinh',
  ACCOUNTANT: 'Kế toán',
  TA: 'Trợ giảng',
  STUDENT: 'Học viên',
  GUEST: 'Khách',
}

/** Thứ tự hiển thị vai trò trong form và bộ lọc. */
export const ROLE_ORDER: Role[] = ['ADMIN', 'TRAINING_MANAGER', 'INSTRUCTOR', 'TA', 'ADMISSIONS', 'ACCOUNTANT', 'STUDENT', 'GUEST']
