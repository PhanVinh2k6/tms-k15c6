import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaginatedResult } from '../users/user.types';
import { toSearchText } from '../users/users.validation';
import { ClassRunningLookup } from './class-running';
import {
  CreateProgramInput,
  ListProgramsQuery,
  Program,
  ProgramResponse,
  ProgramStatus,
  UpdateProgramInput,
} from './program.types';

export const PROGRAM_HAS_RUNNING_CLASSES_MESSAGE =
  'Chương trình đang có lớp chạy không được xoá, chỉ được ngừng áp dụng.';

@Injectable()
export class ProgramsService {
  private readonly programs = new Map<string, Program>();

  constructor(private readonly classRunningLookup: ClassRunningLookup) {
    this.seed(
      'prog-1',
      'PROG-FE01',
      'Lập trình Frontend React & TypeScript',
      'Khoá học lập trình Frontend toàn diện với React, TypeScript và NextJS.',
      72,
      12000000,
      ProgramStatus.ACTIVE,
    );
    this.seed(
      'prog-2',
      'PROG-BE01',
      'Lập trình Backend NestJS & PostgreSQL',
      'Khoá học xây dựng hệ thống REST API quy mô lớn với NestJS và PostgreSQL.',
      90,
      15000000,
      ProgramStatus.ACTIVE,
    );
    this.seed(
      'prog-3',
      'PROG-FS01',
      'Lập trình Fullstack Web Developer',
      'Khoá học lập trình Fullstack từ cơ bản đến nâng cao.',
      160,
      25000000,
      ProgramStatus.INACTIVE,
    );
  }

  create(input: CreateProgramInput): ProgramResponse {
    const code = input.code.trim().toUpperCase();

    if (this.isCodeTaken(code)) {
      throw new ConflictException({
        code: 'PROGRAM_CODE_EXISTS',
        message: `Mã chương trình "${code}" đã tồn tại.`,
      });
    }

    const now = new Date();
    const program: Program = {
      id: randomUUID(),
      code,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      totalDuration: input.totalDuration,
      standardTuition: input.standardTuition,
      status: input.status ?? ProgramStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    this.programs.set(program.id, program);
    return this.toResponse(program);
  }

  list(query: ListProgramsQuery): PaginatedResult<ProgramResponse> {
    let all = [...this.programs.values()].reverse();

    if (query.q) {
      const qNorm = toSearchText(query.q);
      all = all.filter(
        (p) =>
          toSearchText(p.code).includes(qNorm) ||
          toSearchText(p.name).includes(qNorm),
      );
    }

    if (query.status) {
      all = all.filter((p) => p.status === query.status);
    }

    const start = (query.page - 1) * query.pageSize;
    const items = all
      .slice(start, start + query.pageSize)
      .map((p) => this.toResponse(p));

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total: all.length,
      totalPages: Math.ceil(all.length / query.pageSize) || 0,
    };
  }

  findOne(id: string): ProgramResponse {
    return this.toResponse(this.getProgram(id));
  }

  update(id: string, input: UpdateProgramInput): ProgramResponse {
    const program = this.getProgram(id);

    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase();
      if (this.isCodeTaken(code, id)) {
        throw new ConflictException({
          code: 'PROGRAM_CODE_EXISTS',
          message: `Mã chương trình "${code}" đã tồn tại.`,
        });
      }
      program.code = code;
    }

    if (input.name !== undefined) {
      program.name = input.name.trim();
    }

    if (input.description !== undefined) {
      program.description = input.description?.trim() || null;
    }

    if (input.totalDuration !== undefined) {
      program.totalDuration = input.totalDuration;
    }

    if (input.standardTuition !== undefined) {
      program.standardTuition = input.standardTuition;
    }

    if (input.status !== undefined) {
      program.status = input.status;
    }

    program.updatedAt = new Date();
    this.programs.set(program.id, program);

    return this.toResponse(program);
  }

  async remove(id: string): Promise<{ id: string }> {
    const program = this.getProgram(id);

    const hasRunning = await this.classRunningLookup.hasRunningClasses(program.id);
    if (hasRunning) {
      throw new ConflictException({
        statusCode: 409,
        code: 'PROGRAM_HAS_RUNNING_CLASSES',
        message: PROGRAM_HAS_RUNNING_CLASSES_MESSAGE,
      });
    }

    this.programs.delete(program.id);
    return { id: program.id };
  }

  deactivate(id: string): ProgramResponse {
    const program = this.getProgram(id);
    program.status = ProgramStatus.INACTIVE;
    program.updatedAt = new Date();
    this.programs.set(program.id, program);
    return this.toResponse(program);
  }

  activate(id: string): ProgramResponse {
    const program = this.getProgram(id);
    program.status = ProgramStatus.ACTIVE;
    program.updatedAt = new Date();
    this.programs.set(program.id, program);
    return this.toResponse(program);
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
    return [...this.programs.values()].some(
      (p) => p.code.toUpperCase() === target && p.id !== excludeId,
    );
  }

  private getProgram(id: string): Program {
    const program = this.programs.get(id);
    if (!program) {
      throw new NotFoundException({
        code: 'PROGRAM_NOT_FOUND',
        message: `Không tìm thấy chương trình đào tạo với mã định danh "${id}".`,
      });
    }
    return program;
  }

  private toResponse(program: Program): ProgramResponse {
    return {
      id: program.id,
      code: program.code,
      name: program.name,
      description: program.description,
      totalDuration: program.totalDuration,
      standardTuition: program.standardTuition,
      status: program.status,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    };
  }

  private seed(
    id: string,
    code: string,
    name: string,
    description: string | null,
    totalDuration: number,
    standardTuition: number,
    status: ProgramStatus,
  ): void {
    const now = new Date();
    this.programs.set(id, {
      id,
      code,
      name,
      description,
      totalDuration,
      standardTuition,
      status,
      createdAt: now,
      updatedAt: now,
    });
  }
}