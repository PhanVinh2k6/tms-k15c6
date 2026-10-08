import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { CourseClassLookup } from './course-class.lookup';
import { CourseStatus } from './course.types';
import { COURSE_HAS_CLASSES_MESSAGE } from './courses.service';

const as = (id: string, roles: string) => ({
  'x-user-id': id,
  'x-user-roles': roles,
});

describe('S2-05 Danh mục môn học (E2E API)', () => {
  let app: INestApplication;
  const coursesWithClasses = new Set<string>();

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CourseClassLookup)
      .useValue({
        hasClasses: (courseId: string) => coursesWithClasses.has(courseId),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Phân quyền (RBAC)', () => {
    it('chưa đăng nhập thì trả về 401 Unauthorized', async () => {
      await http().get('/courses').expect(401);
      await http().post('/courses').send({}).expect(401);
    });

    it('GUEST không được xem danh mục môn học (403 Forbidden)', async () => {
      await http().get('/courses').set(as('guest-1', 'GUEST')).expect(403);
    });

    it('STUDENT và INSTRUCTOR được xem môn học nhưng không được tạo/sửa/xoá', async () => {
      for (const role of ['STUDENT', 'INSTRUCTOR']) {
        const actor = as('u-1', role);
        await http().get('/courses').set(actor).expect(200);

        await http()
          .post('/courses')
          .set(actor)
          .send({
            code: 'CS-TEST',
            name: 'Môn thử nghiệm',
            totalSessions: 10,
            weight: 1.0,
          })
          .expect(403);

        await http()
          .patch('/courses/course-1')
          .set(actor)
          .send({ name: 'Hacker' })
          .expect(403);

        await http().delete('/courses/course-1').set(actor).expect(403);
      }
    });

    it('TRAINING_MANAGER và ADMIN có toàn quyền quản lý môn học', async () => {
      for (const role of ['TRAINING_MANAGER', 'ADMIN']) {
        const actor = as('mgr-1', role);
        const res = await http()
          .post('/courses')
          .set(actor)
          .send({
            code: `CS-${role}`,
            name: `Môn học của ${role}`,
            totalSessions: 15,
            weight: 1.5,
          })
          .expect(201);

        expect(res.body.code).toBe(`CS-${role}`);
      }
    });
  });

  describe('Validation & Khai báo thông tin', () => {
    const admin = as('admin-1', 'ADMIN');

    it('báo lỗi 400 khi thiếu các trường bắt buộc', async () => {
      const res = await http().post('/courses').set(admin).send({}).expect(400);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.code).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
      expect(res.body.errors.totalSessions).toBeDefined();
      expect(res.body.errors.weight).toBeDefined();
    });

    it('báo lỗi 400 khi mã chứa ký tự đặc biệt không hợp lệ', async () => {
      const res = await http()
        .post('/courses')
        .set(admin)
        .send({
          code: 'CS@#$%',
          name: 'Môn học',
          totalSessions: 10,
          weight: 1.0,
        })
        .expect(400);

      expect(res.body.errors.code).toContain('chữ cái, chữ số');
    });

    it('báo lỗi 400 khi số buổi <= 0 hoặc không phải số nguyên', async () => {
      const res = await http()
        .post('/courses')
        .set(admin)
        .send({
          code: 'CS-VALID',
          name: 'Môn học',
          totalSessions: 0,
          weight: 1.0,
        })
        .expect(400);

      expect(res.body.errors.totalSessions).toBeDefined();
    });

    it('báo lỗi 400 khi trọng số <= 0', async () => {
      const res = await http()
        .post('/courses')
        .set(admin)
        .send({
          code: 'CS-VALID',
          name: 'Môn học',
          totalSessions: 12,
          weight: -1,
        })
        .expect(400);

      expect(res.body.errors.weight).toBeDefined();
    });
  });

  describe('Quy tắc nghiệp vụ S2-05', () => {
    const tm = as('tm-1', 'TRAINING_MANAGER');
    let createdId: string;

    it('khai báo thành công môn học mới với mã, tên, số buổi, trọng số, chuẩn đầu ra, chương trình', async () => {
      const res = await http()
        .post('/courses')
        .set(tm)
        .send({
          code: 'CS-DEVOPS-CORE',
          name: 'DevOps Thực Chiến & Hạ Tầng Tự Động',
          totalSessions: 18,
          weight: 2.0,
          learningOutcomes: 'Triển khai Docker, Kubernetes, CI/CD Pipeline với GitHub Actions.',
          programIds: ['prog-be01', 'prog-fs01'],
          status: CourseStatus.ACTIVE,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.code).toBe('CS-DEVOPS-CORE');
      expect(res.body.name).toBe('DevOps Thực Chiến & Hạ Tầng Tự Động');
      expect(res.body.totalSessions).toBe(18);
      expect(res.body.weight).toBe(2.0);
      expect(res.body.learningOutcomes).toBe(
        'Triển khai Docker, Kubernetes, CI/CD Pipeline với GitHub Actions.',
      );
      expect(res.body.programIds).toEqual(['prog-be01', 'prog-fs01']);
      expect(res.body.status).toBe(CourseStatus.ACTIVE);

      createdId = res.body.id;
    });

    it('báo lỗi 409 Conflict khi tạo môn học với mã đã tồn tại', async () => {
      const res = await http()
        .post('/courses')
        .set(tm)
        .send({
          code: 'cs-devops-core',
          name: 'Trùng mã',
          totalSessions: 10,
          weight: 1.0,
        })
        .expect(409);

      expect(res.body.code).toBe('COURSE_CODE_EXISTS');
      expect(res.body.message).toContain('đã tồn tại');
    });

    it('kiểm tra trùng mã qua API check-code', async () => {
      const resAvailable = await http()
        .get('/courses/check-code?code=CS-NEW-UNIQUE')
        .set(tm)
        .expect(200);
      expect(resAvailable.body.isAvailable).toBe(true);

      const resTaken = await http()
        .get('/courses/check-code?code=CS-DEVOPS-CORE')
        .set(tm)
        .expect(200);
      expect(resTaken.body.isAvailable).toBe(false);
    });

    it('một môn học dùng lại được ở nhiều chương trình (gán/gỡ chương trình)', async () => {
      // Gán thêm môn học vào chương trình prog-fe01
      const resAssign = await http()
        .post(`/courses/${createdId}/programs/prog-fe01`)
        .set(tm)
        .expect(200);

      expect(resAssign.body.programIds).toContain('prog-fe01');
      expect(resAssign.body.programIds).toContain('prog-be01');
      expect(resAssign.body.programIds).toContain('prog-fs01');

      // Lọc danh sách môn theo chương trình prog-fe01
      const resFilter = await http()
        .get('/courses?programId=prog-fe01')
        .set(tm)
        .expect(200);

      expect(resFilter.body.items.some((c: { id: string }) => c.id === createdId)).toBe(true);

      // Gỡ môn học khỏi prog-be01
      const resRemoveProg = await http()
        .delete(`/courses/${createdId}/programs/prog-be01`)
        .set(tm)
        .expect(200);

      expect(resRemoveProg.body.programIds).not.toContain('prog-be01');
      expect(resRemoveProg.body.programIds).toContain('prog-fe01');
    });

    it('ngừng áp dụng môn học (deactivate)', async () => {
      const res = await http()
        .post(`/courses/${createdId}/deactivate`)
        .set(tm)
        .expect(200);

      expect(res.body.status).toBe(CourseStatus.INACTIVE);
    });

    it('môn đã có lớp học thì KHÔNG xoá được, trả về 409 Conflict', async () => {
      // Đánh dấu môn học đã có lớp học
      coursesWithClasses.add(createdId);

      const res = await http().delete(`/courses/${createdId}`).set(tm).expect(409);

      expect(res.body.code).toBe('COURSE_HAS_CLASSES');
      expect(res.body.message).toBe(COURSE_HAS_CLASSES_MESSAGE);

      // Xác nhận môn học vẫn còn tồn tại
      await http().get(`/courses/${createdId}`).set(tm).expect(200);
    });

    it('khi môn học chưa có hoặc không còn lớp học thì được xoá', async () => {
      coursesWithClasses.delete(createdId);

      await http().delete(`/courses/${createdId}`).set(tm).expect(200);

      // Xác nhận đã xoá thành công
      await http().get(`/courses/${createdId}`).set(tm).expect(404);
    });
  });
});
