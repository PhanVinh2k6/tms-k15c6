import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { ActivationEmail, MailService } from './mail.service';

const adminHeaders = { 'x-user-id': 'admin-1', 'x-user-roles': 'ADMIN' };
const instructorHeaders = { 'x-user-id': 'user-1', 'x-user-roles': 'INSTRUCTOR' };

/** Thay email thật bằng bản ghi nhận lại, để test kiểm tra được nội dung email. */
class FakeMailService extends MailService {
  async sendPasswordReset(): Promise<void> {}
  readonly sent: ActivationEmail[] = [];
  async sendAccountActivation(email: ActivationEmail): Promise<void> {
    this.sent.push(email);
  }
}

describe('S1-08 user account management API', () => {
  let app: INestApplication;
  const mail = new FakeMailService();
  const http = () => request(app.getHttpServer());

  const minhAnh = {
    fullName: 'Nguyễn Minh Anh',
    email: '  MinhAnh@TMS.vn ',
    phone: '0912 345 678',
    roles: ['instructor'],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  describe('AC1 — tạo tài khoản gửi email kích hoạt kèm mật khẩu tạm', () => {
    it('creates a pending account and emails a temporary password + activation link', async () => {
      const res = await http().post('/users').set(adminHeaders).send(minhAnh).expect(201);

      expect(res.body).toMatchObject({
        fullName: 'Nguyễn Minh Anh',
        email: 'minhanh@tms.vn',
        phone: '0912345678',
        roles: ['INSTRUCTOR'],
        status: 'PENDING_ACTIVATION',
      });
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('activationTokenHash');
      expect(JSON.stringify(res.body)).not.toContain(mail.sent[0].temporaryPassword);

      expect(mail.sent).toHaveLength(1);
      expect(mail.sent[0].to).toBe('minhanh@tms.vn');
      expect(mail.sent[0].temporaryPassword).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w]).{12}$/);
      expect(mail.sent[0].activationLink).toMatch(/\/activate#token=[\w-]{20,}$/);
    });

    it('does not keep the account when the activation email cannot be sent', async () => {
      const spy = jest.spyOn(mail, 'sendAccountActivation').mockRejectedValueOnce(new Error('SMTP down'));
      const res = await http()
        .post('/users')
        .set(adminHeaders)
        .send({ fullName: 'Lỗi Email', email: 'mailfail@tms.vn', roles: ['TA'] })
        .expect(503);
      spy.mockRestore();

      expect(res.body.code).toBe('EMAIL_SEND_FAILED');
      const search = await http().get('/users?q=mailfail').set(adminHeaders).expect(200);
      expect(search.body.total).toBe(0);
    });
  });

  describe('AC2 — email trùng bị từ chối kèm thông báo cụ thể', () => {
    it('rejects a duplicate email regardless of case/whitespace', async () => {
      const before = mail.sent.length;
      const res = await http()
        .post('/users')
        .set(adminHeaders)
        .send({ ...minhAnh, email: 'MINHANH@tms.vn' })
        .expect(409);

      expect(res.body).toEqual({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email minhanh@tms.vn đã được dùng cho tài khoản khác',
      });
      expect(mail.sent.length).toBe(before);
    });

    it('rejects changing an email to one that is already used', async () => {
      const res = await http()
        .patch('/users/user-1')
        .set(adminHeaders)
        .send({ email: 'minhanh@tms.vn' })
        .expect(409);
      expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('returns field errors for invalid input', async () => {
      const res = await http()
        .post('/users')
        .set(adminHeaders)
        .send({ fullName: ' ', email: 'not-an-email', phone: '123', roles: [] })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(Object.keys(res.body.errors).sort()).toEqual(['email', 'fullName', 'phone', 'roles']);
    });
  });

  describe('AC3 — tìm theo tên, email, SĐT; lọc theo vai trò và trạng thái', () => {
    const emailsOf = (body: { items: { email: string }[] }) => body.items.map((u) => u.email);

    it('finds by name without Vietnamese diacritics', async () => {
      const res = await http().get('/users').query({ q: 'nguyen minh' }).set(adminHeaders).expect(200);
      expect(emailsOf(res.body)).toEqual(['minhanh@tms.vn']);
    });

    it('finds by part of an email', async () => {
      const res = await http().get('/users').query({ q: 'MinhAnh@' }).set(adminHeaders).expect(200);
      expect(emailsOf(res.body)).toEqual(['minhanh@tms.vn']);
    });

    it('finds by phone number in any common format', async () => {
      for (const q of ['0912345', '+84912345678', '0912.345.678']) {
        const res = await http().get('/users').query({ q }).set(adminHeaders).expect(200);
        expect(emailsOf(res.body)).toEqual(['minhanh@tms.vn']);
      }
    });

    it('filters by role and by status', async () => {
      const byRole = await http().get('/users?role=instructor').set(adminHeaders).expect(200);
      expect(emailsOf(byRole.body)).toEqual(expect.arrayContaining(['minhanh@tms.vn', 'user@tms.local']));
      expect(emailsOf(byRole.body)).not.toContain('admin@tms.local');

      const pendingInstructors = await http()
        .get('/users?role=INSTRUCTOR&status=PENDING_ACTIVATION')
        .set(adminHeaders)
        .expect(200);
      expect(emailsOf(pendingInstructors.body)).toEqual(['minhanh@tms.vn']);
    });

    it('rejects unknown role or status values', async () => {
      await http().get('/users?role=HACKER').set(adminHeaders).expect(400);
      await http().get('/users?status=DELETED').set(adminHeaders).expect(400);
    });
  });

  describe('AC4 — danh sách phân trang, mặc định 20 dòng', () => {
    beforeAll(async () => {
      for (let i = 1; i <= 25; i++) {
        await http()
          .post('/users')
          .set(adminHeaders)
          .send({ fullName: `Học viên ${i}`, email: `hv${i}@tms.vn`, roles: ['STUDENT'] })
          .expect(201);
      }
    });

    it('returns 20 rows by default with paging metadata', async () => {
      const res = await http().get('/users').set(adminHeaders).expect(200);
      // 3 tài khoản mẫu + Minh Anh + 25 học viên = 29
      expect(res.body).toMatchObject({ page: 1, pageSize: 20, total: 29, totalPages: 2 });
      expect(res.body.items).toHaveLength(20);
      expect(res.body.items[0].email).toBe('hv25@tms.vn'); // mới tạo xếp trước
    });

    it('returns the remaining rows on the next page', async () => {
      const res = await http().get('/users?page=2').set(adminHeaders).expect(200);
      expect(res.body.items).toHaveLength(9);
    });

    it('combines paging with filters', async () => {
      const res = await http().get('/users?role=STUDENT&pageSize=10&page=3').set(adminHeaders).expect(200);
      expect(res.body).toMatchObject({ page: 3, pageSize: 10, total: 25, totalPages: 3 });
      expect(res.body.items).toHaveLength(5);
    });

    it('rejects invalid paging values', async () => {
      await http().get('/users?pageSize=1000').set(adminHeaders).expect(400);
      await http().get('/users?page=0').set(adminHeaders).expect(400);
      await http().get('/users?page=abc').set(adminHeaders).expect(400);
    });
  });

  describe('Xem và sửa tài khoản', () => {
    it('gets one account by id', async () => {
      const res = await http().get('/users/user-1').set(adminHeaders).expect(200);
      expect(res.body).toMatchObject({ id: 'user-1', email: 'user@tms.local', roles: ['INSTRUCTOR'] });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await http().get('/users/does-not-exist').set(adminHeaders).expect(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });

    it('updates name, email and phone', async () => {
      const res = await http()
        .patch('/users/user-1')
        .set(adminHeaders)
        .send({ fullName: 'Trần Văn Bình', email: 'Binh@TMS.vn', phone: '+84 987 654 321' })
        .expect(200);
      expect(res.body).toMatchObject({ fullName: 'Trần Văn Bình', email: 'binh@tms.vn', phone: '0987654321' });
    });

    it('does not allow changing roles or status through this endpoint', async () => {
      const res = await http()
        .patch('/users/user-1')
        .set(adminHeaders)
        .send({ roles: ['ADMIN'], status: 'ACTIVE' })
        .expect(400);
      expect(Object.keys(res.body.errors).sort()).toEqual(['roles', 'status']);
    });
  });

  describe('Phân quyền', () => {
    it('only allows administrators', async () => {
      await http().get('/users').set(instructorHeaders).expect(403);
      await http().post('/users').set(instructorHeaders).send(minhAnh).expect(403);
      await http().patch('/users/user-1').set(instructorHeaders).send({ fullName: 'X Y' }).expect(403);
    });

    it('requires an authenticated user', async () => {
      await http().get('/users').expect(401);
    });
  });
});
