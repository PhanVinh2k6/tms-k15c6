import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaginatedResult } from '../users/user.types';
import {
  CreateLeadInput,
  DuplicatePhoneWarning,
  Lead,
  LeadResponse,
  ListLeadsQuery,
  SaveLeadResult,
  UpdateLeadInput,
} from './lead.types';

export const DUPLICATE_PHONE_MESSAGE = 'Số điện thoại đã tồn tại trong danh sách Lead';

/**
 * S2-09 — Quản lý danh sách lead.
 * Lưu trong bộ nhớ giống các module Sprint 1; khi nhóm chuyển sang PostgreSQL thì thay Map bằng repository.
 */
@Injectable()
export class LeadsService {
  private readonly leads = new Map<string, Lead>();

  /** AC1 + AC2: tạo lead; trùng số điện thoại vẫn lưu nhưng kèm cảnh báo. */
  create(input: CreateLeadInput): SaveLeadResult {
    const now = new Date();
    const lead: Lead = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
    const duplicateWarning = this.buildDuplicateWarning(lead.phone, lead.id);
    this.leads.set(lead.id, lead);
    return { lead: this.toResponse(lead), duplicateWarning };
  }

  /** Lead mới tạo xếp trước, phân trang mặc định 20. */
  list(query: ListLeadsQuery): PaginatedResult<LeadResponse> {
    const all = [...this.leads.values()].reverse();
    const start = (query.page - 1) * query.pageSize;
    return {
      items: all.slice(start, start + query.pageSize).map((lead) => this.toResponse(lead)),
      page: query.page,
      pageSize: query.pageSize,
      total: all.length,
      totalPages: Math.ceil(all.length / query.pageSize),
    };
  }

  findOne(id: string): LeadResponse {
    return this.toResponse(this.getLead(id));
  }

  /** AC1 + AC2: sửa một phần; chỉ cảnh báo trùng khi số điện thoại sau khi sửa trùng lead khác. */
  update(id: string, input: UpdateLeadInput): SaveLeadResult {
    const lead = this.getLead(id);
    Object.assign(lead, input, { updatedAt: new Date() });
    return { lead: this.toResponse(lead), duplicateWarning: this.buildDuplicateWarning(lead.phone, lead.id) };
  }

  /** Kiểm tra trùng trước khi lưu (để giao diện hiện cảnh báo dưới ô số điện thoại). */
  checkPhone(phone: string, excludeId?: string): { duplicateWarning: DuplicatePhoneWarning | null } {
    return { duplicateWarning: this.buildDuplicateWarning(phone, excludeId) };
  }

  /** AC3: quyền xoá (chỉ Quản lý đào tạo) do PermissionGuard kiểm ở controller. */
  remove(id: string): { id: string } {
    this.getLead(id);
    this.leads.delete(id);
    return { id };
  }

  private buildDuplicateWarning(phone: string, excludeId?: string): DuplicatePhoneWarning | null {
    const duplicates = [...this.leads.values()]
      .filter((lead) => lead.phone === phone && lead.id !== excludeId)
      .map((lead) => ({ id: lead.id, fullName: lead.fullName, phone: lead.phone }));
    return duplicates.length > 0 ? { message: DUPLICATE_PHONE_MESSAGE, duplicates } : null;
  }

  private getLead(id: string): Lead {
    const lead = this.leads.get(id);
    if (!lead) {
      throw new NotFoundException({ code: 'LEAD_NOT_FOUND', message: `Không tìm thấy lead ${id}` });
    }
    return lead;
  }

  private toResponse(lead: Lead): LeadResponse {
    return {
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      interestedProgram: lead.interestedProgram,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }
}
