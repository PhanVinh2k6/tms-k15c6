import type { CreateUserPayload, Role, UpdateUserPayload, UserAccount } from '../account-lock/types'

/** Kiểm tra giống backend (users.validation.ts) để báo lỗi ngay, backend vẫn là nơi quyết định cuối cùng. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^0\d{9,10}$/

export type FormValues = { fullName: string; email: string; phone: string; roles: Role[] }
export type FormErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'roles', string>>

/** Bỏ khoảng trắng / dấu chấm / gạch ngang, đổi +84 thành 0 (giống backend). */
export function normalizePhone(value: string): string {
  const compact = value.replace(/[\s.-]/g, '')
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact
}

export function emptyForm(): FormValues {
  return { fullName: '', email: '', phone: '', roles: [] }
}

export function formFromAccount(account: UserAccount): FormValues {
  return { fullName: account.fullName, email: account.email, phone: account.phone ?? '', roles: account.roles }
}

export function validateForm(values: FormValues, requireRoles: boolean): FormErrors {
  const errors: FormErrors = {}
  const name = values.fullName.trim()
  if (name.length < 2 || name.length > 100) errors.fullName = 'Họ tên bắt buộc, từ 2 đến 100 ký tự.'
  const email = values.email.trim()
  if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.email = 'Email không đúng định dạng.'
  if (values.phone.trim() && !PHONE_PATTERN.test(normalizePhone(values.phone))) {
    errors.phone = 'Số điện thoại không hợp lệ (ví dụ: 0912345678).'
  }
  if (requireRoles && values.roles.length === 0) errors.roles = 'Hãy chọn ít nhất 1 vai trò.'
  return errors
}

export function toCreatePayload(values: FormValues): CreateUserPayload {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() ? values.phone.trim() : null,
    roles: values.roles,
  }
}

/** Chỉ gồm trường đã đổi so với tài khoản gốc. Rỗng nghĩa là không có gì để lưu. */
export function toUpdatePayload(values: FormValues, original: UserAccount): UpdateUserPayload {
  const payload: UpdateUserPayload = {}
  const name = values.fullName.trim().replace(/\s+/g, ' ')
  if (name !== original.fullName) payload.fullName = name
  const email = values.email.trim().toLowerCase()
  if (email !== original.email) payload.email = email
  const phone = values.phone.trim() ? normalizePhone(values.phone) : null
  if (phone !== original.phone) payload.phone = phone
  return payload
}
