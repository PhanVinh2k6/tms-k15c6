/** Kiểu dữ liệu khớp với backend S2-09 (backend/src/leads/lead.types.ts). */

export type LeadSource = 'FACEBOOK' | 'WEBSITE' | 'REFERRAL' | 'GOOGLE_ADS'

export const SOURCE_ORDER: LeadSource[] = ['FACEBOOK', 'WEBSITE', 'REFERRAL', 'GOOGLE_ADS']

/** Nhãn hiển thị theo Figma S2-09; backend nhận mã viết hoa. */
export const SOURCE_LABEL: Record<LeadSource, string> = {
  FACEBOOK: 'Facebook',
  WEBSITE: 'Website',
  REFERRAL: 'Giới thiệu',
  GOOGLE_ADS: 'Google Ads',
}

/**
 * Gợi ý chương trình quan tâm theo Figma. Backend đang lưu dạng chữ (≤ 150 ký tự)
 * vì danh mục chương trình S2-04 chưa có API; khi có thì thay bằng danh sách lấy từ API.
 */
export const PROGRAM_OPTIONS = ['ReactJS', 'NodeJS', 'Lập trình Web', 'Lập trình Python', 'Java Backend']

export type Lead = {
  id: string
  fullName: string
  phone: string
  email: string | null
  source: LeadSource
  interestedProgram: string
  createdAt: string
  updatedAt: string
}

export type LeadPage = {
  items: Lead[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type LeadInput = {
  fullName: string
  phone: string
  email: string | null
  source: LeadSource
  interestedProgram: string
}

/** AC2: chỉ cảnh báo, lead vẫn được lưu. */
export type DuplicateWarning = {
  message: string
  duplicates: Array<Pick<Lead, 'id' | 'fullName' | 'phone'>>
}

export type SaveLeadResult = { lead: Lead; duplicateWarning: DuplicateWarning | null }

/** Vai trò được đọc / ghi / xoá lead, khớp role-permissions.ts ở backend. */
export const LEAD_READ_ROLES = ['ADMISSIONS', 'TRAINING_MANAGER', 'ADMIN']
export const LEAD_WRITE_ROLES = ['ADMISSIONS', 'ADMIN']
export const LEAD_DELETE_ROLES = ['TRAINING_MANAGER']
