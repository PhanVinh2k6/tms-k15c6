/** Nguồn của lead, theo các giá trị trong thiết kế Figma S2-09. */
export enum LeadSource {
  FACEBOOK = 'FACEBOOK',
  WEBSITE = 'WEBSITE',
  /** "Giới thiệu" */
  REFERRAL = 'REFERRAL',
  GOOGLE_ADS = 'GOOGLE_ADS',
}

/** Bản ghi lưu trong kho dữ liệu. */
export interface Lead {
  id: string;
  fullName: string;
  /** Đã chuẩn hoá về dạng 0xxxxxxxxx để so trùng. */
  phone: string;
  email: string | null;
  source: LeadSource;
  /**
   * Tên chương trình quan tâm. Lưu dạng chữ vì danh mục chương trình (S2-04) chưa có API;
   * khi có thì đổi sang id chương trình.
   */
  interestedProgram: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadResponse {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  interestedProgram: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  fullName: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  interestedProgram: string;
}

export type UpdateLeadInput = Partial<CreateLeadInput>;

export interface ListLeadsQuery {
  page: number;
  pageSize: number;
}

/** Cảnh báo trùng số điện thoại (AC2). Chỉ cảnh báo, không chặn lưu. */
export interface DuplicatePhoneWarning {
  message: string;
  duplicates: Array<Pick<LeadResponse, 'id' | 'fullName' | 'phone'>>;
}

/** Kết quả tạo / sửa: lead đã lưu kèm cảnh báo trùng (null nếu không trùng). */
export interface SaveLeadResult {
  lead: LeadResponse;
  duplicateWarning: DuplicatePhoneWarning | null;
}
