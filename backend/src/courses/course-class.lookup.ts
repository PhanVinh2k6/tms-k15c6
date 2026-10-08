import { Injectable } from '@nestjs/common';

/**
 * Abstraction tra cứu lớp học của môn học (S2-05).
 * Môn học đã có lớp học thì không xoá được.
 * Khi Sprint 3 hoàn thiện module Lớp học, ta chỉ cần thay implementation này bằng bản đọc DB thực tế.
 */
export abstract class CourseClassLookup {
  abstract hasClasses(courseId: string): boolean | Promise<boolean>;
}

@Injectable()
export class NoCourseClassLookup extends CourseClassLookup {
  hasClasses(): boolean {
    return false;
  }
}
