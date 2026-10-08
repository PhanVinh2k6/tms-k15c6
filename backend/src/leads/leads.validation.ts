import { BadRequestException } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, normalizeEmail, normalizePhone } from '../users/users.validation';
import { CreateLeadInput, LeadSource, ListLeadsQuery, UpdateLeadInput } from './lead.types';

type FieldErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^0\d{9,10}$/;
const LEAD_FIELDS = ['fullName', 'phone', 'email', 'source', 'interestedProgram'] as const;

function fail(errors: FieldErrors): never {
  throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', errors });
}

function asObject(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    fail({ body: 'Body phải là một object JSON' });
  }
  return body as Record<string, unknown>;
}

function readFullName(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
    errors.fullName = 'Họ tên bắt buộc, từ 2 đến 100 ký tự';
    return undefined;
  }
  return value.trim().replace(/\s+/g, ' ');
}

/** Số điện thoại bắt buộc với lead (khác tài khoản người dùng). */
export function readLeadPhone(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== 'string' || !PHONE_PATTERN.test(normalizePhone(value))) {
    errors.phone = 'Số điện thoại bắt buộc và phải hợp lệ (ví dụ: 0912345678)';
    return undefined;
  }
  return normalizePhone(value);
}

/** Email không bắt buộc: bỏ trống / null thì lưu null. */
function readEmail(value: unknown, errors: FieldErrors): string | null | undefined {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  if (typeof value !== 'string' || !EMAIL_PATTERN.test(value.trim()) || value.trim().length > 254) {
    errors.email = 'Email không đúng định dạng';
    return undefined;
  }
  return normalizeEmail(value);
}

function readSource(value: unknown, errors: FieldErrors): LeadSource | undefined {
  const normalized = typeof value === 'string' ? (value.trim().toUpperCase() as LeadSource) : undefined;
  if (!normalized || !Object.values(LeadSource).includes(normalized)) {
    errors.source = `Nguồn bắt buộc, giá trị hợp lệ: ${Object.values(LeadSource).join(', ')}`;
    return undefined;
  }
  return normalized;
}

function readInterestedProgram(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 150) {
    errors.interestedProgram = 'Chương trình quan tâm bắt buộc, tối đa 150 ký tự';
    return undefined;
  }
  return value.trim().replace(/\s+/g, ' ');
}

const READERS: Record<(typeof LEAD_FIELDS)[number], (value: unknown, errors: FieldErrors) => unknown> = {
  fullName: readFullName,
  phone: readLeadPhone,
  email: readEmail,
  source: readSource,
  interestedProgram: readInterestedProgram,
};

function rejectUnknownFields(data: Record<string, unknown>, errors: FieldErrors) {
  for (const key of Object.keys(data)) {
    if (!(LEAD_FIELDS as readonly string[]).includes(key)) {
      errors[key] = 'Trường này không được phép';
    }
  }
}

export function parseCreateLead(body: unknown): CreateLeadInput {
  const data = asObject(body);
  const errors: FieldErrors = {};
  rejectUnknownFields(data, errors);
  const input = {
    fullName: readFullName(data.fullName, errors),
    phone: readLeadPhone(data.phone, errors),
    email: readEmail(data.email, errors),
    source: readSource(data.source, errors),
    interestedProgram: readInterestedProgram(data.interestedProgram, errors),
  };
  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return input as CreateLeadInput;
}

/** Sửa một phần: chỉ trường nào gửi lên mới được kiểm tra và cập nhật. */
export function parseUpdateLead(body: unknown): UpdateLeadInput {
  const data = asObject(body);
  const errors: FieldErrors = {};
  rejectUnknownFields(data, errors);
  const input: Record<string, unknown> = {};
  for (const key of LEAD_FIELDS) {
    if (key in data) {
      input[key] = READERS[key](data[key], errors);
    }
  }
  if (Object.keys(errors).length === 0 && Object.keys(input).length === 0) {
    errors.body = `Cần ít nhất một trường: ${LEAD_FIELDS.join(', ')}`;
  }
  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return input as UpdateLeadInput;
}

function readPositiveInt(value: unknown, fallback: number): number | undefined {
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

export function parseListLeadsQuery(query: Record<string, unknown>): ListLeadsQuery {
  const errors: FieldErrors = {};
  const page = readPositiveInt(query.page, 1);
  const pageSize = readPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE);
  if (!page || page < 1) errors.page = 'page phải là số nguyên ≥ 1';
  if (!pageSize || pageSize < 1 || pageSize > MAX_PAGE_SIZE) errors.pageSize = `pageSize phải từ 1 đến ${MAX_PAGE_SIZE}`;
  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return { page: page!, pageSize: pageSize! };
}

/** Query của GET /leads/check-phone: kiểm tra trùng trước khi lưu để hiện cảnh báo ngay dưới ô nhập. */
export function parseCheckPhoneQuery(query: Record<string, unknown>): { phone: string; excludeId?: string } {
  const errors: FieldErrors = {};
  const phone = readLeadPhone(query.phone, errors);
  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  const excludeId = typeof query.excludeId === 'string' && query.excludeId.trim() ? query.excludeId.trim() : undefined;
  return { phone: phone!, excludeId };
}
