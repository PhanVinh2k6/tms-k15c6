import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { ActivationEmail, MailService } from './mail.service';

const adminHeaders = { 'x-user-id': 'admin-1', 'x-user-roles': 'ADMIN' };
const instructorHeaders = { 'x-user-id': 'user-1', 'x-user-roles': 'INSTRUCTOR' };

class FakeMailService extends MailService {
  readonly sent: ActivationEmail[] = [];
  async sendAccountActivation(email: ActivationEmail): Promise<void> {
    this.sent.push(email);
  }
}

describe('S1-08 xoá tài khoản (DELETE /users/:id)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  const createUser = async (email: string, roles: string[] = ['STUDENT']): Promise<string> => {
    const res = await http()
      .post('/users')
      .set(adminHeaders)
      .send({ fullName: 'Người Thử Xoá', email, phone: null, roles })
      .expect(201);
    return res.body.id as string;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(new FakeMailService())
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('xoá hẳn tài khoản: không còn trong danh sách và không đọc được nữa', async () => {
    const id = await createUser('xoa1@tms.vn');
    const res = await http().delete(`/users/${id}`).set(adminHeaders).expect(200);
    expect(res.body).toEqual({ id });

    await http().get(`/users/${id}`).set(adminHeaders).expect(404);
    const list = await http().get('/users?q=xoa1@tms.vn').set(adminHeaders).expect(200);
    expect(list.body.total).toBe(0);
  });

  it('cho phép tạo lại tài khoản với email vừa xoá', async () => {
    const id = await createUser('xoa2@tms.vn');
    await http().delete(`/users/${id}`).set(adminHeaders).expect(200);
    await createUser('xoa2@tms.vn');
  });

  it('trả 404 USER_NOT_FOUND khi xoá hai lần hoặc id lạ', async () => {
    const id = await createUser('xoa3@tms.vn');
    await http().delete(`/users/${id}`).set(adminHeaders).expect(200);
    const again = await http().delete(`/users/${id}`).set(adminHeaders).expect(404);
    expect(again.body.code).toBe('USER_NOT_FOUND');
    await http().delete('/users/khong-co').set(adminHeaders).expect(404);
  });

  it('không cho tự xoá chính mình (403 CANNOT_DELETE_SELF)', async () => {
    const res = await http().delete('/users/admin-1').set(adminHeaders).expect(403);
    expect(res.body.code).toBe('CANNOT_DELETE_SELF');
    await http().get('/users/admin-1').set(adminHeaders).expect(200);
  });

  it('không xoá Quản trị hệ thống cuối cùng, nhưng xoá được khi còn admin khác', async () => {
    const otherAdmin = await createUser('admin2@tms.vn', ['ADMIN']);
    const secondActor = { 'x-user-id': otherAdmin, 'x-user-roles': 'ADMIN' };

    // Còn 2 admin: admin-1 xoá được admin thứ hai.
    await http().delete(`/users/${otherAdmin}`).set(adminHeaders).expect(200);

    // Chỉ còn admin-1: người khác (đóng vai admin) không được xoá admin cuối cùng.
    const res = await http().delete('/users/admin-1').set(secondActor).expect(409);
    expect(res.body.code).toBe('CANNOT_DELETE_LAST_ADMIN');
  });

  it('chỉ Quản trị hệ thống được xoá, và phải đăng nhập', async () => {
    const id = await createUser('xoa4@tms.vn');
    await http().delete(`/users/${id}`).set(instructorHeaders).expect(403);
    await http().delete(`/users/${id}`).expect(401);
    await http().get(`/users/${id}`).set(adminHeaders).expect(200);
  });
});
