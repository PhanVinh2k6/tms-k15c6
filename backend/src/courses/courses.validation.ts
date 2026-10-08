import { BadRequestException } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../users/users.validation';
import {
  CourseStatus,
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from './course.types';

type FieldErrors = Record<string, string>;

export const COURSE_CODE_REGEX = /^[A-Za-z0-9_-]+$/;
const COURSE_FIELDS = [
  'code',
  'name',
  'totalSessions',
  'weight',
  'learningOutcomes',
  'programIds',
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
    errors.code = 'Mã môn học không được để trống.';
    return undefined;
  }
  const trimmed = value.trim().toUpperCase();
  if (trimmed.length < 2 || trimmed.length > 50) {
    errors.code = 'Mã môn học phải từ 2 đến 50 ký tự.';
    return undefined;
  }
  if (!COURSE_CODE_REGEX.test(trimmed)) {
    errors.code =
      'Mã môn học chỉ được chứa chữ cái, chữ số, dấu gạch ngang (-) hoặc gạch dưới (_).';
    return undefined;
  }
  return trimmed;
}

function readName(value: unknown, errors: FieldErrors): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    errors.name = 'Tên môn học không được để trống.';
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 200) {
    errors.name = 'Tên môn học phải từ 2 đến 200 ký tự.';
    return undefined;
  }
  return trimmed.replace(/\s+/g, ' ');
}

function readTotalSessions(
  value: unknown,
  errors: FieldErrors,
): number | undefined {
  if (value === undefined || value === null || value === '') {
    errors.totalSessions = 'Số buổi không được để trống.';
    return undefined;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) {
    errors.totalSessions = 'Số buổi phải là số nguyên lớn hơn 0.';
    return undefined;
  }
  return num;
}

function readWeight(value: unknown, errors: FieldErrors): number | undefined {
  if (value === undefined || value === null || value === '') {
    errors.weight = 'Trọng số không được để trống.';
    return undefined;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    errors.weight = 'Trọng số phải là số lớn hơn 0.';
    return undefined;
  }
  return num;
}

function readLearningOutcomes(
  value: unknown,
  errors: FieldErrors,
): string | null | undefined {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    errors.learningOutcomes = 'Mô tả chuẩn đầu ra phải là chuỗi văn bản.';
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > 3000) {
    errors.learningOutcomes = 'Mô tả chuẩn đầu ra tối đa 3000 ký tự.';
    return undefined;
  }
  return trimmed || null;
}

function readProgramIds(
  value: unknown,
  errors: FieldErrors,
): string[] | undefined {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    errors.programIds = 'Danh sách chương trình phải là một mảng.';
    return undefined;
  }
  const list: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !item.trim()) {
      errors.programIds = 'Mã/ID chương trình đào tạo không hợp lệ.';
      return undefined;
    }
    list.push(item.trim());
  }
  return [...new Set(list)];
}

function readStatus(value: unknown, errors: FieldErrors): CourseStatus | undefined {
  if (value === undefined || value === null || value === '') {
    return CourseStatus.ACTIVE;
  }
  const normalized =
    typeof value === 'string'
      ? (value.trim().toUpperCase() as CourseStatus)
      : undefined;
  if (!normalized || !Object.values(CourseStatus).includes(normalized)) {
    errors.status = `Trạng thái không hợp lệ. Giá trị cho phép: ${Object.values(
      CourseStatus,
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

export function parseCreateCourse(body: unknown): CreateCourseInput {
  const data = asObject(body);
  const errors: FieldErrors = {};
  rejectUnknownFields(data, COURSE_FIELDS, errors);

  const code = readCode(data.code, errors);
  const name = readName(data.name, errors);
  const totalSessions = readTotalSessions(data.totalSessions, errors);
  const weight = readWeight(data.weight, errors);
  const learningOutcomes = readLearningOutcomes(data.learningOutcomes, errors);
  const programIds = readProgramIds(data.programIds, errors);
  const status = readStatus(data.status, errors);

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }

  return {
    code: code!,
    name: name!,
    totalSessions: totalSessions!,
    weight: weight!,
    learningOutcomes: learningOutcomes ?? null,
    programIds: programIds ?? [],
    status: status ?? CourseStatus.ACTIVE,
  };
}

export function parseUpdateCourse(body: unknown): UpdateCourseInput {
  const data = asObject(body);
  const errors: FieldErrors = {};
  rejectUnknownFields(data, COURSE_FIELDS, errors);

  const input: UpdateCourseInput = {};

  if ('code' in data) input.code = readCode(data.code, errors);
  if ('name' in data) input.name = readName(data.name, errors);
  if ('totalSessions' in data)
    input.totalSessions = readTotalSessions(data.totalSessions, errors);
  if ('weight' in data) input.weight = readWeight(data.weight, errors);
  if ('learningOutcomes' in data)
    input.learningOutcomes = readLearningOutcomes(data.learningOutcomes, errors);
  if ('programIds' in data)
    input.programIds = readProgramIds(data.programIds, errors);
  if ('status' in data) input.status = readStatus(data.status, errors);

  if (Object.keys(data).length === 0) {
    errors.body = `Cần ít nhất một trường để cập nhật: ${COURSE_FIELDS.join(
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

export function parseListCoursesQuery(
  query: Record<string, unknown>,
): ListCoursesQuery {
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

  let programId: string | undefined;
  if (query.programId !== undefined && query.programId !== '') {
    if (typeof query.programId !== 'string') {
      errors.programId = 'Mã/ID chương trình phải là chuỗi.';
    } else {
      programId = query.programId.trim();
    }
  }

  let status: CourseStatus | undefined;
  if (query.status !== undefined && query.status !== '') {
    const raw = typeof query.status === 'string' ? query.status.trim().toUpperCase() : '';
    if (Object.values(CourseStatus).includes(raw as CourseStatus)) {
      status = raw as CourseStatus;
    } else {
      errors.status = `Trạng thái hợp lệ: ${Object.values(CourseStatus).join(', ')}`;
    }
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }

  return {
    page: page!,
    pageSize: pageSize!,
    q,
    programId,
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
