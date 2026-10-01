import { BadRequestException } from '@nestjs/common';
import { Role } from '../roles/role.types';
import { ChangePasswordInput, CreateUserInput, ListUsersQuery, UpdateUserInput, UserStatus } from './user.types';

type FieldErrors = Record<string, string>;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^0\d{9,10}$/;
const UPDATABLE_FIELDS = ['fullName', 'email', 'phone'];

function fail(errors: FieldErrors): never {
  throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', errors });
}

function asObject(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    fail({ body: 'Body phải là một object JSON' });
  }
  return body as Record<string, unknown>;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Bỏ khoảng trắng / dấu chấm / gạch ngang, đổi +84 thành 0. */
export function normalizePhone(value: string): string {
  const compact = value.replace(/[\s.-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
}

/** Bỏ dấu tiếng Việt để tìm "nguyen" vẫn ra "Nguyễn". */
export function toSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function readFullName(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
    errors.fullName = 'Họ tên bắt buộc, từ 2 đến 100 ký tự';
    return undefined;
  }
  return value.trim().replace(/\s+/g, ' ');
}

function readEmail(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== 'string' || !EMAIL_PATTERN.test(value.trim()) || value.trim().length > 254) {
    errors.email = 'Email không đúng định dạng';
    return undefined;
  }
  return normalizeEmail(value);
}

function readPhone(value: unknown, errors: FieldErrors): string | null | undefined {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !PHONE_PATTERN.test(normalizePhone(value))) {
    errors.phone = 'Số điện thoại không hợp lệ (ví dụ: 0912345678)';
    return undefined;
  }
  return normalizePhone(value);
}

export function parseRole(value: unknown): Role | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toUpperCase() as Role;
  return Object.values(Role).includes(normalized) ? normalized : undefined;
}

function readRoles(value: unknown, errors: FieldErrors): Role[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    errors.roles = 'Phải chọn ít nhất 1 vai trò';
    return undefined;
  }
  const roles = value.map(parseRole);
  if (roles.some((role) => role === undefined)) {
    errors.roles = `Vai trò hợp lệ: ${Object.values(Role).join(', ')}`;
    return undefined;
  }
  return [...new Set(roles as Role[])];
}

export function parseCreateUser(body: unknown): CreateUserInput {
  const data = asObject(body);
  const errors: FieldErrors = {};
  const fullName = readFullName(data.fullName, errors);
  const email = readEmail(data.email, errors);
  const phone = readPhone(data.phone, errors);
  const roles = readRoles(data.roles, errors);

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return { fullName: fullName!, email: email!, phone: phone!, roles: roles! };
}

export function parseUpdateUser(body: unknown): UpdateUserInput {
  const data = asObject(body);
  const errors: FieldErrors = {};
  const input: UpdateUserInput = {};

  for (const key of Object.keys(data)) {
    if (!UPDATABLE_FIELDS.includes(key)) {
      errors[key] =
        key === 'roles'
          ? 'Đổi vai trò qua API /users/:userId/roles (S1-09)'
          : 'Không thể cập nhật trường này qua API này';
    }
  }
  if ('fullName' in data) input.fullName = readFullName(data.fullName, errors);
  if ('email' in data) input.email = readEmail(data.email, errors);
  if ('phone' in data) input.phone = readPhone(data.phone, errors);

  if (Object.keys(data).length === 0) {
    errors.body = `Cần ít nhất một trường: ${UPDATABLE_FIELDS.join(', ')}`;
  }
  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return input;
}

export function parseChangePassword(body: unknown): ChangePasswordInput {
  const data = asObject(body);
  const errors: FieldErrors = {};

  for (const key of Object.keys(data)) {
    if (key !== 'currentPassword' && key !== 'newPassword') {
      errors[key] = 'Trường này không được hỗ trợ';
    }
  }

  const currentPassword = data.currentPassword;
  if (typeof currentPassword !== 'string' || currentPassword.length === 0 || currentPassword.length > 128) {
    errors.currentPassword = 'Mật khẩu hiện tại bắt buộc và tối đa 128 ký tự';
  }

  const newPassword = data.newPassword;
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    errors.newPassword = 'Mật khẩu mới phải từ 8 đến 128 ký tự';
  } else {
    if (!/\p{L}/u.test(newPassword)) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất một chữ cái';
    }
    if (!/\p{N}/u.test(newPassword)) {
      errors.newPassword = `${errors.newPassword ? `${errors.newPassword}; ` : ''}Mật khẩu mới phải có ít nhất một chữ số`;
    }
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return { currentPassword: currentPassword as string, newPassword: newPassword as string };
}

function readPositiveInt(value: unknown, fallback: number): number | undefined {
  if (value === undefined || value === '') {
    return fallback;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return undefined;
  }
  return Number(value);
}

export function parseListQuery(query: Record<string, unknown>): ListUsersQuery {
  const errors: FieldErrors = {};
  const result: ListUsersQuery = { page: 1, pageSize: DEFAULT_PAGE_SIZE };

  if (query.q !== undefined) {
    if (typeof query.q !== 'string' || query.q.length > 100) {
      errors.q = 'Từ khoá tìm kiếm tối đa 100 ký tự';
    } else if (query.q.trim()) {
      result.q = query.q.trim();
    }
  }
  if (query.role !== undefined && query.role !== '') {
    result.role = parseRole(query.role);
    if (!result.role) errors.role = `Vai trò hợp lệ: ${Object.values(Role).join(', ')}`;
  }
  if (query.status !== undefined && query.status !== '') {
    const status = typeof query.status === 'string' ? (query.status.trim().toUpperCase() as UserStatus) : undefined;
    if (status && Object.values(UserStatus).includes(status)) {
      result.status = status;
    } else {
      errors.status = `Trạng thái hợp lệ: ${Object.values(UserStatus).join(', ')}`;
    }
  }

  const page = readPositiveInt(query.page, 1);
  if (!page || page < 1) {
    errors.page = 'page phải là số nguyên ≥ 1';
  } else {
    result.page = page;
  }
  const pageSize = readPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE);
  if (!pageSize || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    errors.pageSize = `pageSize phải từ 1 đến ${MAX_PAGE_SIZE}`;
  } else {
    result.pageSize = pageSize;
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return result;
}
