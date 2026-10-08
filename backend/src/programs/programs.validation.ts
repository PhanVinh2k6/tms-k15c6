import { BadRequestException } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../users/users.validation';
import {
  CreateProgramInput,
  ListProgramsQuery,
  ProgramStatus,
  UpdateProgramInput,
} from './program.types';

type FieldErrors = Record<string, string>;

export const CODE_REGEX = /^[A-Za-z0-9_-]+$/;
const PROGRAM_FIELDS = [
  'code',
  'name',
  'description',
  'totalDuration',
  'standardTuition',
  'status',
] as const;

function fail(errors: FieldErrors): never {
  throw new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Dữ liệu không hợp lệ',
    errors,
  });
}

function asObject(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    fail({ body: 'Body phải là một object JSON' });
  }
  return body as Record<string, unknown>;
}

function readCode(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    errors.code = 'Mã chương trình không được để trống.';
    return undefined;
  }
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length < 2 || trimmed.length > 50) {
    errors.code = 'Mã chương trình phải từ 2 đến 50 ký tự.';
    return undefined;
  }
  if (!CODE_REGEX.test(trimmed)) {
    errors.code =
      'Mã chương trình chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) hoặc gạch dưới (_).';
    return undefined;
  }
  return trimmed;
}

function readName(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    errors.name = 'Tên chương trình không được để trống.';
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 200) {
    errors.name = 'Tên chương trình phải từ 2 đến 200 ký tự.';
    return undefined;
  }
  return trimmed.replace(/\s+/g, ' ');
}

function readDescription(
  value: unknown,
  errors: FieldErrors,
): string | null | undefined {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    errors.description = 'Mô tả phải là chuỗi văn bản.';
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > 2000) {
    errors.description = 'Mô tả chương trình tối đa 2000 ký tự.';
    return undefined;
  }
  return trimmed || null;
}

function readTotalDuration(
  value: unknown,
  errors: FieldErrors,
): number | undefined {
  if (value === undefined || value === null || value === '') {
    errors.totalDuration = 'Tổng thời lượng không được để trống.';
    return undefined;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) {
    errors.totalDuration = 'Tổng thời lượng phải là số nguyên lớn hơn 0.';
    return undefined;
  }
  return num;
}

function readStandardTuition(
  value: unknown,
  errors: FieldErrors,
): number | undefined {
  if (value === undefined || value === null || value === '') {
    errors.standardTuition = 'Học phí chuẩn không được để trống.';
    return undefined;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) {
    errors.standardTuition = 'Học phí chuẩn phải là số lớn hơn hoặc bằng 0.';
    return undefined;
  }
  return num;
}

function readStatus(
  value: unknown,
  errors: FieldErrors,
): ProgramStatus | undefined {
  if (value === undefined || value === null || value === '') {
    return ProgramStatus.ACTIVE;
  }
  const normalized =
    typeof value === 'string'
      ? (value.trim().toUpperCase() as ProgramStatus)
      : undefined;
  if (!normalized || !Object.values(ProgramStatus).includes(normalized)) {
    errors.status = `Trạng thái không hợp lệ. Giá trị cho phép: ${Object.values(
      ProgramStatus,
    ).join(', ')}`;
    return undefined;
  }
  return normalized;
}

function rejectUnknownFields(
  data: Record<string, unknown>,
  allowed: readonly string[],
  errors: FieldErrors,
): void {
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) {
      errors[key] = 'Trường này không được hỗ trợ.';
    }
  }
}

export function parseCreateProgram(body: unknown): CreateProgramInput {
  const data = asObject(body);
  const errors: FieldErrors = {};
  rejectUnknownFields(data, PROGRAM_FIELDS, errors);

  const code = readCode(data.code, errors);
  const name = readName(data.name, errors);
  const description = readDescription(data.description, errors);
  const totalDuration = readTotalDuration(data.totalDuration, errors);
  const standardTuition = readStandardTuition(data.standardTuition, errors);
  const status = readStatus(data.status, errors);

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }

  return {
    code: code!,
    name: name!,
    description: description ?? null,
    totalDuration: totalDuration!,
    standardTuition: standardTuition!,
    status: status ?? ProgramStatus.ACTIVE,
  };
}

export function parseUpdateProgram(body: unknown): UpdateProgramInput {
  const data = asObject(body);
  const errors: FieldErrors = {};
  rejectUnknownFields(data, PROGRAM_FIELDS, errors);

  const input: UpdateProgramInput = {};

  if ('code' in data) input.code = readCode(data.code, errors);
  if ('name' in data) input.name = readName(data.name, errors);
  if ('description' in data)
    input.description = readDescription(data.description, errors);
  if ('totalDuration' in data)
    input.totalDuration = readTotalDuration(data.totalDuration, errors);
  if ('standardTuition' in data)
    input.standardTuition = readStandardTuition(data.standardTuition, errors);
  if ('status' in data) input.status = readStatus(data.status, errors);

  if (Object.keys(data).length === 0) {
    errors.body = `Cần ít nhất một trường để cập nhật: ${PROGRAM_FIELDS.join(
      ', ',
    )}`;
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }

  return input;
}

function readPositiveInt(value: unknown, fallback: number): number | undefined {
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

export function parseListProgramsQuery(
  query: Record<string, unknown>,
): ListProgramsQuery {
  const errors: FieldErrors = {};

  const page = readPositiveInt(query.page, 1);
  if (!page || page < 1) errors.page = 'page phải là số nguyên ≥ 1';

  const pageSize = readPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE);
  if (!pageSize || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    errors.pageSize = `pageSize phải từ 1 đến ${MAX_PAGE_SIZE}`;
  }

  let q: string | undefined;
  if (query.q !== undefined && query.q !== '') {
    if (typeof query.q !== 'string' || query.q.length > 100) {
      errors.q = 'Từ khoá tìm kiếm tối đa 100 ký tự';
    } else {
      q = query.q.trim();
    }
  }

  let status: ProgramStatus | undefined;
  if (query.status !== undefined && query.status !== '') {
    const raw = typeof query.status === 'string' ? query.status.trim().toUpperCase() : '';
    if (Object.values(ProgramStatus).includes(raw as ProgramStatus)) {
      status = raw as ProgramStatus;
    } else {
      errors.status = `Trạng thái hợp lệ: ${Object.values(ProgramStatus).join(', ')}`;
    }
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }

  return {
    page: page!,
    pageSize: pageSize!,
    q,
    status,
  };
}

export function parseCheckCodeQuery(
  query: Record<string, unknown>,
): { code: string; excludeId?: string } {
  const errors: FieldErrors = {};
  const code = readCode(query.code, errors);
  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  const excludeId =
    typeof query.excludeId === 'string' && query.excludeId.trim()
      ? query.excludeId.trim()
      : undefined;
  return { code: code!, excludeId };
}