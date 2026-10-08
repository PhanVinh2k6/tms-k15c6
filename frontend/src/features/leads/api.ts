import { request } from '../account-lock/api'
import type { DuplicateWarning, LeadInput, LeadPage, SaveLeadResult } from './types'

/** Danh sách lead, mới nhất trước. */
export function listLeads(page: number, pageSize: number, signal?: AbortSignal): Promise<LeadPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return request<LeadPage>(`/leads?${query.toString()}`, { signal })
}

/** Kiểm tra trùng số trước khi lưu; `excludeId` là lead đang sửa để không tự báo trùng với chính nó. */
export function checkPhone(phone: string, excludeId?: string, signal?: AbortSignal): Promise<{ duplicateWarning: DuplicateWarning | null }> {
  const query = new URLSearchParams({ phone })
  if (excludeId) query.set('excludeId', excludeId)
  return request(`/leads/check-phone?${query.toString()}`, { signal })
}

export function createLead(input: LeadInput): Promise<SaveLeadResult> {
  return request<SaveLeadResult>('/leads', { method: 'POST', body: JSON.stringify(input) })
}

/** Sửa một phần: chỉ gửi các trường đã đổi. */
export function updateLead(id: string, changes: Partial<LeadInput>): Promise<SaveLeadResult> {
  return request<SaveLeadResult>(`/leads/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) })
}

/** Chỉ Quản lý đào tạo; vai trò khác nhận 403 từ server. */
export function deleteLead(id: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/leads/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
