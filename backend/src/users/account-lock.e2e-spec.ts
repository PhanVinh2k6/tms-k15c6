import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { AssignedClass, ClassAssignmentLookup } from './class-assignment';
import { ActivationEmail, MailService } from './mail.service';
import { UserAccount } from './user.types';
import { UsersService } from './users.service';

const adminHeaders = { 'x-user-id': 'admin-1', 'x-user-roles': 'ADMIN' };
const instructorHeaders = { 'x-user-id': 'user-1', 'x-user-roles': 'INSTRUCTOR' };

class FakeMailService extends MailService {
  async sendAccountActivation(_email: ActivationEmail): Promise<void> {}
}

/** Giả lập module Lớp học (chưa có): cho trước user nào đang phụ trách lớp nào. */
class FakeClassAssignmentLookup extends ClassAssignmentLookup {
  readonly classesByUser = new Map<string, AssignedClass[]>();
  failing = false;

  findClassesOf(userId: string): AssignedClass[] {
    if (this.failing) throw new Error('class service down');
    return this.classesByUser.get(userId) ?? [];
  }
}

describe('S1-10 khoá và mở khoá tài khoản', () => {
  let app: INestApplication;
  const classes = new FakeClassAssignmentLookup();
  const http = () => request(app.getHttpServer());
  let counter = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(new FakeMailService())
      .overrideProvider(ClassAssignmentLookup)
      .useValue(classes)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  afterEach(() => {
    classes.classesByUser.clear();
    classes.failing = false;
  });

  /** Mỗi test tự tạo một tài khoản riêng (trạng thái chờ kích hoạt) để không dẫm lên nhau. */
  async function createUser(roles: string[] = ['INSTRUCTOR']) {
    counter += 1;
    const res = await http()
      .post('/users')
      .set(adminHeaders)
      .send({ fullName: `Nhân sự ${counter}`, email: `nhansu${counter}@tms.vn`, roles })
      .expect(201);
    return res.body as { id: string; status: string };
  }

  const lock = (id: string, body: unknown = { reason: 'Nghỉ việc ngày 30/09' }, headers = adminHeaders) =>
    http().post(`/users/${id}/lock`).set(headers).send(body as object);
  const unlock = (id: string, headers = adminHeaders) => http().post(`/users/${id}/unlock`).set(headers);
  const getUser = async (id: string) => (await http().get(`/users/${id}`).set(adminHeaders).expect(200)).body;

  describe('khoá tài khoản', () => {
    it('đổi trạng thái sang LOCKED và lưu lý do (đã cắt khoảng trắng thừa)', async () => {
      const { id } = await createUser();

      const res = await lock(id, { reason: '  Nghỉ việc ngày 30/09  ' }).expect(200);

      expect(res.body.user).toMatchObject({ id, status: 'LOCKED', lockedReason: 'Nghỉ việc ngày 30/09' });
      expect(new Date(res.body.user.lockedAt).getTime()).not.toBeNaN();
      expect(res.body.handoverWarning).toBeNull();
      expect(res.body.user).not.toHaveProperty('passwordHash');

      const stored = await getUser(id);
      expect(stored).toMatchObject({ status: 'LOCKED', lockedReason: 'Nghỉ việc ngày 30/09' });
    });

    it('tài khoản bị khoá hiện ra khi lọc theo trạng thái LOCKED', async () => {
      const { id } = await createUser();
      await lock(id).expect(200);

      const res = await http().get('/users?status=LOCKED').set(adminHeaders).expect(200);
      expect(res.body.items.map((user: { id: string }) => user.id)).toContain(id);
      expect(res.body.items.every((user: { status: string }) => user.status === 'LOCKED')).toBe(true);
    });

    it.each([
      ['không gửi lý do', {}],
      ['lý do rỗng', { reason: '' }],
      ['lý do chỉ có dấu cách', { reason: '     ' }],
      ['lý do quá ngắn', { reason: 'ok' }],
      ['lý do quá dài', { reason: 'x'.repeat(501) }],
      ['lý do không phải chuỗi', { reason: 123 }],
    ])('bắt buộc ghi lý do: %s -> 400 và tài khoản không bị khoá', async (_name, body) => {
      const { id } = await createUser();

      const res = await lock(id, body).expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(Object.keys(res.body.errors)).toEqual(['reason']);
      expect((await getUser(id)).status).toBe('PENDING_ACTIVATION');
    });

    it('chấp nhận lý do dài đúng 500 ký tự', async () => {
      const { id } = await createUser();
      await lock(id, { reason: 'x'.repeat(500) }).expect(200);
    });

    it('khoá tài khoản đã khoá -> 409 và giữ nguyên lý do cũ', async () => {
      const { id } = await createUser();
      await lock(id, { reason: 'Lý do thứ nhất' }).expect(200);

      const res = await lock(id, { reason: 'Lý do thứ hai' }).expect(409);

      expect(res.body.code).toBe('ALREADY_LOCKED');
      expect((await getUser(id)).lockedReason).toBe('Lý do thứ nhất');
    });

    it('không cho quản trị viên tự khoá chính mình', async () => {
      const res = await lock('admin-1').expect(400);

      expect(res.body.code).toBe('CANNOT_LOCK_SELF');
      expect((await getUser('admin-1')).status).toBe('ACTIVE');
    });

    it('khoá được một quản trị viên khác', async () => {
      const other = await createUser(['ADMIN']);
      await lock(other.id).expect(200);
      expect((await getUser(other.id)).status).toBe('LOCKED');
    });

    it('tài khoản không tồn tại -> 404', async () => {
      const res = await lock('khong-co').expect(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });

    it('chỉ quản trị viên mới được khoá', async () => {
      const { id } = await createUser();

      await lock(id, { reason: 'Thử khoá' }, instructorHeaders).expect(403);
      await http().post(`/users/${id}/lock`).send({ reason: 'Thử khoá' }).expect(401);
      expect((await getUser(id)).status).toBe('PENDING_ACTIVATION');
    });
  });

  it('khoá tăng sessionVersion để thu hồi phiên cũ; mở khoá không giảm lại', async () => {
    // Module Auth (S1-01) đọc số này khi kiểm tra token; ở đây chỉ kiểm tra phía S1-10 có tăng đúng không.
    const store = (app.get(UsersService) as unknown as { users: Map<string, UserAccount> }).users;
    const { id } = await createUser();
    expect(store.get(id)!.sessionVersion).toBe(0);

    await lock(id).expect(200);
    expect(store.get(id)!.sessionVersion).toBe(1);

    await unlock(id).expect(200);
    expect(store.get(id)!.sessionVersion).toBe(1);

    await lock(id).expect(200);
    expect(store.get(id)!.sessionVersion).toBe(2);
  });

  describe('cảnh báo bàn giao lớp học', () => {
    it('liệt kê các lớp người đó đang phụ trách', async () => {
      const { id } = await createUser();
      classes.classesByUser.set(id, [
        { id: 'c1', name: 'Java K15' },
        { id: 'c2', name: 'NodeJS K16' },
      ]);

      const res = await lock(id).expect(200);

      expect(res.body.user.status).toBe('LOCKED');
      expect(res.body.handoverWarning.classes).toEqual([
        { id: 'c1', name: 'Java K15' },
        { id: 'c2', name: 'NodeJS K16' },
      ]);
      expect(res.body.handoverWarning.message).toContain('2 lớp học');
      expect(res.body.handoverWarning.message).toContain('Java K15, NodeJS K16');
    });

    it('không cảnh báo khi người đó không phụ trách lớp nào', async () => {
      const { id } = await createUser();
      const res = await lock(id).expect(200);
      expect(res.body.handoverWarning).toBeNull();
    });

    it('đọc lớp học bị lỗi thì tài khoản vẫn bị khoá và vẫn có cảnh báo kiểm tra thủ công', async () => {
      const { id } = await createUser();
      classes.failing = true;

      const res = await lock(id).expect(200);

      expect(res.body.user.status).toBe('LOCKED');
      expect(res.body.handoverWarning.message).toContain('chưa kiểm tra được');
      expect((await getUser(id)).status).toBe('LOCKED');
    });
  });

  describe('mở khoá tài khoản', () => {
    it('trả về trạng thái trước khi khoá và xoá lý do khoá', async () => {
      const { id } = await createUser();
      await lock(id).expect(200);

      const res = await unlock(id).expect(200);

      expect(res.body.user).toMatchObject({ id, status: 'PENDING_ACTIVATION', lockedReason: null, lockedAt: null });
      expect(await getUser(id)).toMatchObject({ status: 'PENDING_ACTIVATION', lockedReason: null });
    });

    it('tài khoản đang hoạt động khoá rồi mở khoá thì quay lại ACTIVE', async () => {
      const other = await createUser(['TA']);
      await lock(other.id).expect(200);
      await unlock(other.id).expect(200);
      // Tài khoản mẫu user-1 đang ACTIVE.
      await lock('user-1').expect(200);
      expect((await getUser('user-1')).status).toBe('LOCKED');

      const res = await unlock('user-1').expect(200);

      expect(res.body.user.status).toBe('ACTIVE');
    });

    it('khoá lại lần hai vẫn bắt buộc lý do mới', async () => {
      const { id } = await createUser();
      await lock(id, { reason: 'Lần một' }).expect(200);
      await unlock(id).expect(200);

      await lock(id, {}).expect(400);
      const res = await lock(id, { reason: 'Lần hai' }).expect(200);
      expect(res.body.user.lockedReason).toBe('Lần hai');
    });

    it('mở khoá tài khoản không bị khoá -> 409', async () => {
      const { id } = await createUser();
      const res = await unlock(id).expect(409);
      expect(res.body.code).toBe('NOT_LOCKED');
    });

    it('tài khoản không tồn tại -> 404; không phải quản trị viên -> 403', async () => {
      await unlock('khong-co').expect(404);
      const { id } = await createUser();
      await lock(id).expect(200);
      await unlock(id, instructorHeaders).expect(403);
      expect((await getUser(id)).status).toBe('LOCKED');
    });
  });

  it('sửa thông tin cá nhân không làm mất trạng thái khoá', async () => {
    const { id } = await createUser();
    await lock(id).expect(200);

    await http().patch(`/users/${id}`).set(adminHeaders).send({ fullName: 'Tên mới' }).expect(200);

    expect(await getUser(id)).toMatchObject({ fullName: 'Tên mới', status: 'LOCKED' });
  });
});
