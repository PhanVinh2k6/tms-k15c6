import { normalizePhone } from '../user-management/validation'
import type { Lead, LeadInput, LeadSource } from './types'

/** Giá trị trong form: chuỗi thô người dùng gõ. */
export type LeadFormValues = {
  fullName: string
  phone: string
  email: string
  source: LeadSource
  interestedProgram: string
}

export type LeadFormErrors = Partial<Record<keyof LeadFormValues, string>>

export const LEAD_FIELDS: Array<keyof LeadFormValues> = ['fullName', 'phone', 'email', 'source', 'interestedProgram']

// Cùng quy tắc với backend (leads.validation.ts) để báo lỗi ngay, backend vẫn kiểm tra lại.
const PHONE_PATTERN = /^0\d{9,10}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function emptyLeadForm(): LeadFormValues {
  return { fullName: '', phone: '', email: '', source: 'FACEBOOK', interestedProgram: '' }
}

export function formFromLead(lead: Lead): LeadFormValues {
  return {
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email ?? '',
    source: lead.source,
    interestedProgram: lead.interestedProgram,
  }
}

/** Số đã chuẩn hoá nếu hợp lệ, ngược lại null (dùng để quyết định có gọi check-phone hay không). */
export function validPhoneOrNull(value: string): string | null {
  const phone = normalizePhone(value.trim())
  return PHONE_PATTERN.test(phone) ? phone : null
}

export function validateLeadForm(values: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {}
  const fullName = values.fullName.trim()
  if (fullName.length < 2 || fullName.length > 100) errors.fullName = 'Họ tên bắt buộc, từ 2 đến 100 ký tự.'
  if (!values.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại.'
  else if (!validPhoneOrNull(values.phone)) errors.phone = 'Số điện thoại không hợp lệ (ví dụ: 0912345678).'
  const email = values.email.trim()
  if (email && (!EMAIL_PATTERN.test(email) || email.length > 254)) errors.email = 'Email không đúng định dạng.'
  if (!values.source) errors.source = 'Vui lòng chọn nguồn.'
  const program = values.interestedProgram.trim()
  if (!program || program.length > 150) errors.interestedProgram = 'Vui lòng chọn chương trình quan tâm.'
  return errors
}

export function toLeadInput(values: LeadFormValues): LeadInput {
  return {
    fullName: values.fullName.trim().replace(/\s+/g, ' '),
    phone: normalizePhone(values.phone.trim()),
    email: values.email.trim() ? values.email.trim().toLowerCase() : null,
    source: values.source,
    interestedProgram: values.interestedProgram.trim(),
  }
}

/** Chỉ các trường thay đổi so với lead gốc (PATCH sửa một phần). */
export function toLeadChanges(values: LeadFormValues, original: Lead): Partial<LeadInput> {
  const next = toLeadInput(values)
  const changes: Partial<LeadInput> = {}
  if (next.fullName !== original.fullName) changes.fullName = next.fullName
  if (next.phone !== original.phone) changes.phone = next.phone
  if (next.email !== original.email) changes.email = next.email
  if (next.source !== original.source) changes.source = next.source
  if (next.interestedProgram !== original.interestedProgram) changes.interestedProgram = next.interestedProgram
  return changes
}
