import { Role } from '../roles/role.types';

export enum UserStatus {
  /** Vừa được Admin tạo, chưa kích hoạt qua email. */
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  ACTIVE = 'ACTIVE',
  /** Dành cho S1-10 (khoá / mở khoá tài khoản). */
  LOCKED = 'LOCKED',
}

/** Bản ghi lưu trong kho dữ liệu — KHÔNG trả thẳng ra API. */
export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roles: Set<Role>;
  status: UserStatus;
  passwordHash: string;
  mustChangePassword: boolean;
  activationTokenHash: string | null;
  activationExpiresAt: Date | null;
  /** Token đặt lại mật khẩu chỉ lưu dưới dạng hash. */
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  /** Tăng sau khi đổi mật khẩu; auth layer phải đưa version vào token và so khớp khi xác thực. */
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
  /** S1-10: chỉ có giá trị khi status = LOCKED, mở khoá thì xoá. */
  lockedReason?: string | null;
  lockedAt?: Date | null;
  /** Id của quản trị viên đã khoá. */
  lockedById?: string | null;
  /** Trạng thái trước khi khoá, để mở khoá thì trả về đúng trạng thái đó. */
  statusBeforeLock?: UserStatus | null;
}

/** Dữ liệu trả về cho client — không bao giờ chứa mật khẩu hay token. */
export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roles: Role[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  /** Lý do và thời điểm khoá; null khi tài khoản không bị khoá. */
  lockedReason: string | null;
  lockedAt: string | null;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string | null;
  roles: Role[];
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  phone?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ListUsersQuery {
  q?: string;
  role?: Role;
  status?: UserStatus;
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LockUserInput {
  reason: string;
}
