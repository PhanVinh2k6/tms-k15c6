import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { ClassRunningLookup } from './class-running';
import { ProgramStatus } from './program.types';
import { PROGRAM_HAS_RUNNING_CLASSES_MESSAGE } from './programs.service';

const as = (id: string, roles: string) => ({
  'x-user-id': id,
  'x-user-roles': roles,
});

describe('S2-04 Danh mục chương trình đào tạo (E2E API)', () => {
  let app: INestApplication;
  const runningProgramIds = new Set<string>();

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ClassRunningLookup)
      .useValue({
        hasRunningClasses: (programId: string) =>
          runningProgramIds.has(programId),
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
      await http().get('/programs').expect(401);
      await http().post('/programs').send({}).expect(401);
    });

    it('GUEST không được xem danh mục chương trình (403 Forbidden)', async () => {
      await http()
        .get('/programs')
        .set(as('guest-1', 'GUEST'))
        .expect(403);
    });

    it('STUDENT và INSTRUCTOR được xem nhưng không được tạo/sửa/xoá', async () => {
      for (const role of ['STUDENT', 'INSTRUCTOR']) {
        const actor = as('u-1', role);
        await http().get('/programs').set(actor).expect(200);

        await http()
          .post('/programs')
          .set(actor)
          .send({
            code: 'PROG-TEST',
            name: 'Test',
            totalDuration: 10,
            standardTuition: 1000,
          })
          .expect(403);

        await http()
          .patch('/programs/prog-1')
          .set(actor)
          .send({ name: 'Hacker' })
          .expect(403);

        await http().delete('/programs/prog-1').set(actor).expect(403);
      }
    });

    it('TRAINING_MANAGER và ADMIN có toàn quyền quản lý chương trình', async () => {
      for (const role of ['TRAINING_MANAGER', 'ADMIN']) {
        const actor = as('mgr-1', role);
        const res = await http()
          .post('/programs')
          .set(actor)
          .send({
            code: `PROG-${role}`,
            name: `Chương trình của ${role}`,
            totalDuration: 50,
            standardTuition: 10000000,
          })
          .expect(201);

        expect(res.body.code).toBe(`PROG-${role}`);
      }
    });
  });

  describe('Validation & Khai báo thông tin', () => {
    const admin = as('admin-1', 'ADMIN');

    it('báo lỗi 400 khi thiếu các trường bắt buộc', async () => {
      const res = await http()
        .post('/programs')
        .set(admin)
        .send({})
        .expect(400);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.code).toBeDefined();
      expect(res.body.errors.name).toBeDefined();
      expect(res.body.errors.totalDuration).toBeDefined();
      expect(res.body.errors.standardTuition).toBeDefined();
    });

    it('báo lỗi 400 khi mã chứa ký tự đặc biệt không hợp lệ', async () => {
      const res = await http()
        .post('/programs')
        .set(admin)
        .send({
          code: 'PROG@#$%',
          name: 'Khoá học',
          totalDuration: 60,
          standardTuition: 10000000,
        })
        .expect(400);

      expect(res.body.errors.code).toContain('chữ cái, chữ số');
    });

    it('báo lỗi 400 khi tổng thời lượng <= 0 hoặc không phải số nguyên', async () => {
      const res = await http()
        .post('/programs')
        .set(admin)
        .send({
          code: 'PROG-VALID',
          name: 'Khoá học',
          totalDuration: -5,
          standardTuition: 10000000,
        })
        .expect(400);

      expect(res.body.errors.totalDuration).toBeDefined();
    });

    it('báo lỗi 400 khi học phí chuẩn < 0', async () => {
      const res = await http()
        .post('/programs')
        .set(admin)
        .send({
          code: 'PROG-VALID',
          name: 'Khoá học',
          totalDuration: 60,
          standardTuition: -100,
        })
        .expect(400);

      expect(res.body.errors.standardTuition).toBeDefined();
    });
  });

  describe('Quy tắc nghiệp vụ S2-04', () => {
    const tm = as('tm-1', 'TRAINING_MANAGER');
    let createdId: string;

    it('khai báo thành công chương trình mới với mã duy nhất', async () => {
      const res = await http()
        .post('/programs')
        .set(tm)
        .send({
          code: 'PROG-DEVOPS01',
          name: 'Khoá học DevOps & Cloud CI/CD',
          description: 'Học Docker, Kubernetes, Jenkins, GitHub Actions.',
          totalDuration: 64,
          standardTuition: 18000000,
          status: ProgramStatus.ACTIVE,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.code).toBe('PROG-DEVOPS01');
      expect(res.body.name).toBe('Khoá học DevOps & Cloud CI/CD');
      expect(res.body.description).toBe('Học Docker, Kubernetes, Jenkins, GitHub Actions.');
      expect(res.body.totalDuration).toBe(64);
      expect(res.body.standardTuition).toBe(18000000);
      expect(res.body.status).toBe(ProgramStatus.ACTIVE);

      createdId = res.body.id;
    });

    it('báo lỗi 409 Conflict khi tạo chương trình với mã đã tồn tại', async () => {
      const res = await http()
        .post('/programs')
        .set(tm)
        .send({
          code: 'prog-devops01', // Viết thường nhưng vẫn phải bắt trùng
          name: 'DevOps trùng mã',
          totalDuration: 60,
          standardTuition: 15000000,
        })
        .expect(409);

      expect(res.body.code).toBe('PROGRAM_CODE_EXISTS');
      expect(res.body.message).toContain('đã tồn tại');
    });

    it('kiểm tra trùng mã qua API check-code', async () => {
      const resAvailable = await http()
        .get('/programs/check-code?code=PROG-NOT-EXIST')
        .set(tm)
        .expect(200);
      expect(resAvailable.body.isAvailable).toBe(true);

      const resTaken = await http()
        .get('/programs/check-code?code=PROG-DEVOPS01')
        .set(tm)
        .expect(200);
      expect(resTaken.body.isAvailable).toBe(false);
    });

    it('cập nhật thông tin chương trình và kiểm tra trùng mã khi sửa', async () => {
      // Sửa hợp lệ
      const res = await http()
        .patch(`/programs/${createdId}`)
        .set(tm)
        .send({
          name: 'DevOps & SRE Master',
          totalDuration: 70,
        })
        .expect(200);

      expect(res.body.name).toBe('DevOps & SRE Master');
      expect(res.body.totalDuration).toBe(70);

      // Sửa trùng mã với prog-1
      await http()
        .patch(`/programs/${createdId}`)
        .set(tm)
        .send({
          code: 'PROG-FE01',
        })
        .expect(409);
    });

    it('ngừng áp dụng chương trình (deactivate)', async () => {
      const res = await http()
        .post(`/programs/${createdId}/deactivate`)
        .set(tm)
        .expect(200);

      expect(res.body.status).toBe(ProgramStatus.INACTIVE);
    });

    it('chương trình đang có lớp chạy KHÔNG được xoá, trả về 409 Conflict', async () => {
      // Giả lập chương trình đang có lớp chạy
      runningProgramIds.add(createdId);

      const res = await http()
        .delete(`/programs/${createdId}`)
        .set(tm)
        .expect(409);

      expect(res.body.code).toBe('PROGRAM_HAS_RUNNING_CLASSES');
      expect(res.body.message).toBe(PROGRAM_HAS_RUNNING_CLASSES_MESSAGE);

      // Xác nhận chương trình vẫn còn tồn tại
      await http().get(`/programs/${createdId}`).set(tm).expect(200);
    });

    it('khi lớp học đã kết thúc hoặc không có lớp chạy thì được xoá', async () => {
      // Gỡ cờ đang có lớp chạy
      runningProgramIds.delete(createdId);

      await http().delete(`/programs/${createdId}`).set(tm).expect(200);

      // Xác nhận đã xoá hẳn
      await http().get(`/programs/${createdId}`).set(tm).expect(404);
    });
  });

  describe('Tìm kiếm, lọc và phân trang', () => {
    const tm = as('tm-1', 'TRAINING_MANAGER');

    it('hỗ trợ tìm kiếm theo từ khoá q và phân trang', async () => {
      const res = await http()
        .get('/programs?q=Frontend&page=1&pageSize=5')
        .set(tm)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.items[0].code).toBe('PROG-FE01');
    });

    it('hỗ trợ lọc theo trạng thái', async () => {
      const res = await http()
        .get('/programs?status=INACTIVE')
        .set(tm)
        .expect(200);

      expect(res.body.items.every((p: { status: string }) => p.status === ProgramStatus.INACTIVE)).toBe(true);
    });
  });
});
