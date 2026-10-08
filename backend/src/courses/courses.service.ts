import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaginatedResult } from '../users/user.types';
import { toSearchText } from '../users/users.validation';
import { CourseClassLookup } from './course-class.lookup';
import {
  Course,
  CourseResponse,
  CourseStatus,
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from './course.types';

export const COURSE_HAS_CLASSES_MESSAGE =
  'Môn học đã có lớp học nên không thể xoá. Vui lòng ngừng áp dụng môn học.';

@Injectable()
export class CoursesService {
  private readonly courses = new Map<string, Course>();

  constructor(private readonly courseClassLookup: CourseClassLookup) {
    this.seed(
      'course-1',
      'WEB-HTML-CSS',
      'Nhập môn Web với HTML5 & CSS3',
      12,
      1.5,
      'Hiểu cấu trúc HTML5, CSS layout Flexbox & Grid, responsive web design.',
      ['prog-fe01', 'prog-fs01'],
      CourseStatus.ACTIVE,
    );
    this.seed(
      'course-2',
      'JS-TS-CORE',
      'JavaScript & TypeScript Căn Bản Đến Nâng Cao',
      20,
      2.0,
      'Thành thạo ES6+, Async/Await, Generic, Type System trong TypeScript.',
      ['prog-fe01', 'prog-be01', 'prog-fs01'],
      CourseStatus.ACTIVE,
    );
    this.seed(
      'course-3',
      'BE-NEST-API',
      'Xây dựng REST API Chuyên Nghiệp với NestJS',
      24,
      2.5,
      'Nắm vững Module, Controller, Service, Guard, TypeORM trong NestJS.',
      ['prog-be01', 'prog-fs01'],
      CourseStatus.ACTIVE,
    );
  }

  create(input: CreateCourseInput): CourseResponse {
    const code = input.code.trim().toUpperCase();

    if (this.isCodeTaken(code)) {
      throw new ConflictException({
        code: 'COURSE_CODE_EXISTS',
        message: `Mã môn học "${code}" đã tồn tại.`,
      });
    }

    const now = new Date();
    const course: Course = {
      id: randomUUID(),
      code,
      name: input.name.trim(),
      totalSessions: input.totalSessions,
      weight: input.weight,
      learningOutcomes: input.learningOutcomes?.trim() || null,
      programIds: input.programIds ? [...new Set(input.programIds)] : [],
      status: input.status ?? CourseStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    this.courses.set(course.id, course);
    return this.toResponse(course);
  }

  list(query: ListCoursesQuery): PaginatedResult<CourseResponse> {
    let all = [...this.courses.values()].reverse();

    if (query.q) {
      const qNorm = toSearchText(query.q);
      all = all.filter(
        (c) =>
          toSearchText(c.code).includes(qNorm) ||
          toSearchText(c.name).includes(qNorm),
      );
    }

    if (query.programId) {
      all = all.filter((c) => c.programIds.includes(query.programId!));
    }

    if (query.status) {
      all = all.filter((c) => c.status === query.status);
    }

    const start = (query.page - 1) * query.pageSize;
    const items = all
      .slice(start, start + query.pageSize)
      .map((c) => this.toResponse(c));

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total: all.length,
      totalPages: Math.ceil(all.length / query.pageSize) || 0,
    };
  }

  findOne(id: string): CourseResponse {
    return this.toResponse(this.getCourse(id));
  }

  update(id: string, input: UpdateCourseInput): CourseResponse {
    const course = this.getCourse(id);

    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase();
      if (this.isCodeTaken(code, id)) {
        throw new ConflictException({
          code: 'COURSE_CODE_EXISTS',
          message: `Mã môn học "${code}" đã tồn tại.`,
        });
      }
      course.code = code;
    }

    if (input.name !== undefined) {
      course.name = input.name.trim();
    }

    if (input.totalSessions !== undefined) {
      course.totalSessions = input.totalSessions;
    }

    if (input.weight !== undefined) {
      course.weight = input.weight;
    }

    if (input.learningOutcomes !== undefined) {
      course.learningOutcomes = input.learningOutcomes?.trim() || null;
    }

    if (input.programIds !== undefined) {
      course.programIds = [...new Set(input.programIds)];
    }

    if (input.status !== undefined) {
      course.status = input.status;
    }

    course.updatedAt = new Date();
    this.courses.set(course.id, course);

    return this.toResponse(course);
  }

  async remove(id: string): Promise<{ id: string }> {
    const course = this.getCourse(id);

    const hasClasses = await this.courseClassLookup.hasClasses(course.id);
    if (hasClasses) {
      throw new ConflictException({
        statusCode: 409,
        code: 'COURSE_HAS_CLASSES',
        message: COURSE_HAS_CLASSES_MESSAGE,
      });
    }

    this.courses.delete(course.id);
    return { id: course.id };
  }

  deactivate(id: string): CourseResponse {
    const course = this.getCourse(id);
    course.status = CourseStatus.INACTIVE;
    course.updatedAt = new Date();
    this.courses.set(course.id, course);
    return this.toResponse(course);
  }

  activate(id: string): CourseResponse {
    const course = this.getCourse(id);
    course.status = CourseStatus.ACTIVE;
    course.updatedAt = new Date();
    this.courses.set(course.id, course);
    return this.toResponse(course);
  }

  assignToProgram(courseId: string, programId: string): CourseResponse {
    const course = this.getCourse(courseId);
    if (!course.programIds.includes(programId)) {
      course.programIds.push(programId);
      course.updatedAt = new Date();
      this.courses.set(course.id, course);
    }
    return this.toResponse(course);
  }

  removeFromProgram(courseId: string, programId: string): CourseResponse {
    const course = this.getCourse(courseId);
    course.programIds = course.programIds.filter((p) => p !== programId);
    course.updatedAt = new Date();
    this.courses.set(course.id, course);
    return this.toResponse(course);
  }

  checkCode(
    code: string,
    excludeId?: string,
  ): { isAvailable: boolean; code: string } {
    const normalized = code.trim().toUpperCase();
    const isAvailable = !this.isCodeTaken(normalized, excludeId);
    return { isAvailable, code: normalized };
  }

  private isCodeTaken(code: string, excludeId?: string): boolean {
    const target = code.trim().toUpperCase();
    return [...this.courses.values()].some(
      (c) => c.code.toUpperCase() === target && c.id !== excludeId,
    );
  }

  private getCourse(id: string): Course {
    const course = this.courses.get(id);
    if (!course) {
      throw new NotFoundException({
        code: 'COURSE_NOT_FOUND',
        message: `Không tìm thấy môn học với mã định danh "${id}".`,
      });
    }
    return course;
  }

  private toResponse(course: Course): CourseResponse {
    return {
      id: course.id,
      code: course.code,
      name: course.name,
      totalSessions: course.totalSessions,
      weight: course.weight,
      learningOutcomes: course.learningOutcomes,
      programIds: [...course.programIds],
      status: course.status,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }

  private seed(
    id: string,
    code: string,
    name: string,
    totalSessions: number,
    weight: number,
    learningOutcomes: string | null,
    programIds: string[],
    status: CourseStatus,
  ): void {
    const now = new Date();
    this.courses.set(id, {
      id,
      code,
      name,
      totalSessions,
      weight,
      learningOutcomes,
      programIds: [...programIds],
      status,
      createdAt: now,
      updatedAt: now,
    });
  }
}
