import { Injectable } from '@nestjs/common';

/**
 * Abstraction tra cứu lớp học đang chạy của chương trình (S2-04).
 * Chương trình đang có lớp chạy không được phép xoá, chỉ được ngừng áp dụng.
 * Khi Sprint 3 hoàn thiện module Lớp học, chỉ cần thay implementation này bằng bản đọc DB thực tế.
 */
export abstract class ClassRunningLookup {
  abstract hasRunningClasses(programId: string): boolean | Promise<boolean>;
}

@Injectable()
export class NoRunningClassesLookup extends ClassRunningLookup {
  hasRunningClasses(): boolean {
    return false;
  }
}
