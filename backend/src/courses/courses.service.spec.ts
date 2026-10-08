import { ConflictException, NotFoundException } from '@nestjs/common';
import { CourseClassLookup } from './course-class.lookup';
import { CourseStatus } from './course.types';
import { CoursesService } from './courses.service';

class MockCourseClassLookup extends CourseClassLookup {
  private coursesWithClasses = new Set<string>();

  setHasClasses(courseId: string, hasClasses: boolean) {
    if (hasClasses) {
      this.coursesWithClasses.add(courseId);
    } else {
      this.coursesWithClasses.delete(courseId);
    }
  }

  hasClasses(courseId: string): boolean {
    return this.coursesWithClasses.has(courseId);
  }
}

describe('CoursesService - S2-05 Danh mục môn học', () => {
  let service: CoursesService;
  let classLookup: MockCourseClassLookup;

  beforeEach(() => {
    classLookup = new MockCourseClassLookup();
    service = new CoursesService(classLookup);
  });

  describe('create (Khai báo môn học)', () => {
    it('khai báo thành công môn học với đầy đủ mã, tên, số buổi, trọng số, chuẩn đầu ra, chương trình', () => {
      const result = service.create({
        code: 'CS-ALGO',
        name: 'Cấu trúc dữ liệu và giải thuật',
        totalSessions: 16,
        weight: 2.0,
        learningOutcomes: 'Hiểu cấu trúc cây, đồ thị, thuật toán tìm kiếm và sắp xếp.',
        programIds: ['prog-fe01', 'prog-be01'],
        status: CourseStatus.ACTIVE,
      });

      expect(result.id).toBeDefined();
      expect(result.code).toBe('CS-ALGO');
      expect(result.name).toBe('Cấu trúc dữ liệu và giải thuật');
      expect(result.totalSessions).toBe(16);
      expect(result.weight).toBe(2.0);
      expect(result.learningOutcomes).toBe(
        'Hiểu cấu trúc cây, đồ thị, thuật toán tìm kiếm và sắp xếp.',
      );
      expect(result.programIds).toEqual(['prog-fe01', 'prog-be01']);
      expect(result.status).toBe(CourseStatus.ACTIVE);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('tự động chuẩn hoá mã môn học sang chữ hoa và gán giá trị mặc định', () => {
      const result = service.create({
        code: 'db-sql',
        name: 'Cơ sở dữ liệu quan hệ SQL',
        totalSessions: 14,
        weight: 1.5,
      });

      expect(result.code).toBe('DB-SQL');
      expect(result.status).toBe(CourseStatus.ACTIVE);
      expect(result.learningOutcomes).toBeNull();
      expect(result.programIds).toEqual([]);
    });

    it('báo lỗi ConflictException khi mã môn học đã tồn tại', () => {
      expect(() =>
        service.create({
          code: 'web-html-css', // đã có WEB-HTML-CSS trong seed
          name: 'Trùng mã',
          totalSessions: 10,
          weight: 1.0,
        }),
      ).toThrow(ConflictException);
    });
  });

  describe('list & tái sử dụng môn học ở nhiều chương trình', () => {
    it('lấy danh sách môn học có phân trang', () => {
      const result = service.list({ page: 1, pageSize: 2 });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.items.length).toBe(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('tìm kiếm theo từ khoá q (mã hoặc tên)', () => {
      const result = service.list({ page: 1, pageSize: 10, q: 'HTML' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].code).toBe('WEB-HTML-CSS');
    });

    it('lọc môn học theo chương trình đào tạo (Một môn học dùng lại được ở nhiều chương trình)', () => {
      // JS-TS-CORE thuộc cả prog-fe01, prog-be01, prog-fs01
      const feCourses = service.list({ page: 1, pageSize: 10, programId: 'prog-fe01' });
      const beCourses = service.list({ page: 1, pageSize: 10, programId: 'prog-be01' });

      const feCodes = feCourses.items.map((c) => c.code);
      const beCodes = beCourses.items.map((c) => c.code);

      expect(feCodes).toContain('JS-TS-CORE');
      expect(beCodes).toContain('JS-TS-CORE');
    });

    it('lọc theo trạng thái môn học', () => {
      const activeList = service.list({ page: 1, pageSize: 10, status: CourseStatus.ACTIVE });
      expect(activeList.items.every((c) => c.status === CourseStatus.ACTIVE)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('tìm thấy môn học theo id', () => {
      const course = service.findOne('course-1');
      expect(course).toBeDefined();
      expect(course.code).toBe('WEB-HTML-CSS');
    });

    it('ném NotFoundException khi id không tồn tại', () => {
      expect(() => service.findOne('invalid-id')).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('cập nhật thành công thông tin môn học', () => {
      const updated = service.update('course-1', {
        name: 'HTML5, CSS3 & SASS Nâng Cao',
        totalSessions: 16,
        weight: 2.0,
        learningOutcomes: 'Chuẩn đầu ra cập nhật mới',
      });

      expect(updated.name).toBe('HTML5, CSS3 & SASS Nâng Cao');
      expect(updated.totalSessions).toBe(16);
      expect(updated.weight).toBe(2.0);
      expect(updated.learningOutcomes).toBe('Chuẩn đầu ra cập nhật mới');
    });

    it('báo lỗi ConflictException khi đổi mã trùng với môn học khác', () => {
      expect(() =>
        service.update('course-1', {
          code: 'JS-TS-CORE', // đã thuộc course-2
        }),
      ).toThrow(ConflictException);
    });

    it('cho phép cập nhật giữ nguyên mã môn học hiện tại', () => {
      const updated = service.update('course-1', {
        code: 'WEB-HTML-CSS',
        name: 'Tên mới',
      });
      expect(updated.code).toBe('WEB-HTML-CSS');
      expect(updated.name).toBe('Tên mới');
    });

    it('ném NotFoundException khi sửa môn học không tồn tại', () => {
      expect(() =>
        service.update('non-existent', { name: 'Môn không tồn tại' }),
      ).toThrow(NotFoundException);
    });
  });

  describe('Gán và gỡ môn học khỏi chương trình', () => {
    it('gán môn học vào chương trình mới', () => {
      const course = service.assignToProgram('course-1', 'prog-ai01');
      expect(course.programIds).toContain('prog-ai01');
    });

    it('không thêm trùng lặp nếu chương trình đã được gán', () => {
      service.assignToProgram('course-1', 'prog-fe01');
      const course = service.assignToProgram('course-1', 'prog-fe01');
      const count = course.programIds.filter((p) => p === 'prog-fe01').length;
      expect(count).toBe(1);
    });

    it('gỡ môn học khỏi chương trình', () => {
      const course = service.removeFromProgram('course-1', 'prog-fe01');
      expect(course.programIds).not.toContain('prog-fe01');
    });
  });

  describe('deactivate & activate (Ngừng áp dụng & Áp dụng lại)', () => {
    it('ngừng áp dụng chuyển trạng thái sang INACTIVE', () => {
      const deactivated = service.deactivate('course-1');
      expect(deactivated.status).toBe(CourseStatus.INACTIVE);
    });

    it('áp dụng lại chuyển trạng thái sang ACTIVE', () => {
      service.deactivate('course-1');
      const activated = service.activate('course-1');
      expect(activated.status).toBe(CourseStatus.ACTIVE);
    });
  });

  describe('remove (Môn đã có lớp học thì không xoá được)', () => {
    it('xoá thành công môn học khi CHƯA có lớp học', async () => {
      classLookup.setHasClasses('course-1', false);
      const res = await service.remove('course-1');
      expect(res.id).toBe('course-1');
      expect(() => service.findOne('course-1')).toThrow(NotFoundException);
    });

    it('chặn xoá và ném ConflictException khi môn học ĐÃ CÓ LỚP HỌC', async () => {
      classLookup.setHasClasses('course-2', true);

      await expect(service.remove('course-2')).rejects.toThrow(ConflictException);

      try {
        await service.remove('course-2');
        fail('Phải ném ConflictException');
      } catch (err: unknown) {
        const error = err as { getResponse: () => { code: string; message: string } };
        const response = error.getResponse();
        expect(response.code).toBe('COURSE_HAS_CLASSES');
        expect(response.message).toBe(
          'Môn học đã có lớp học nên không thể xoá. Vui lòng ngừng áp dụng môn học.',
        );
      }

      // Môn đã có lớp học vẫn có thể ngừng áp dụng thay vì xoá
      const deactivated = service.deactivate('course-2');
      expect(deactivated.status).toBe(CourseStatus.INACTIVE);
    });

    it('ném NotFoundException khi xoá môn học không tồn tại', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkCode', () => {
    it('kiểm tra tính khả dụng của mã môn học', () => {
      expect(service.checkCode('COURSE-NEW-01').isAvailable).toBe(true);
      expect(service.checkCode('WEB-HTML-CSS').isAvailable).toBe(false);
      expect(service.checkCode('WEB-HTML-CSS', 'course-1').isAvailable).toBe(true);
    });
  });
});
