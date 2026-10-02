import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { ActivationEmail, MailService } from '../users/mail.service';

const adminHeaders = { 'x-user-id': 'admin-1', 'x-user-roles': 'ADMIN' };

class FakeMailService extends MailService {
  readonly sent: ActivationEmail[] = [];
  async sendAccountActivation(email: ActivationEmail): Promise<void> {
    this.sent.push(email);
  }
}

describe('S1-08 + S1-09 dùng chung một kho người dùng', () => {
  let app: INestApplication;
  const mail = new FakeMailService();
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('assigns and revokes roles for a user created through the S1-08 API', async () => {
    const created = await http()
      .post('/users')
      .set(adminHeaders)
      .send({ fullName: 'Lê Thị Hoa', email: 'hoa@tms.vn', roles: ['STUDENT'] })
      .expect(201);
    const id = created.body.id as string;

    const assigned = await http().post(`/users/${id}/roles/TA`).set(adminHeaders).expect(201);
    expect(assigned.body.roles).toEqual(['STUDENT', 'TA']);

    // S1-08 nhìn thấy ngay vai trò vừa gán ở S1-09.
    const detail = await http().get(`/users/${id}`).set(adminHeaders).expect(200);
    expect(detail.body.roles).toEqual(['STUDENT', 'TA']);

    await http().delete(`/users/${id}/roles/STUDENT`).set(adminHeaders).expect(200);
    const after = await http().get(`/users/${id}/roles`).set(adminHeaders).expect(200);
    expect(after.body.roles).toEqual(['TA']);
  });

  it('shows a role granted in S1-09 when filtering users by role in S1-08', async () => {
    await http().post('/users/user-1/roles/ACCOUNTANT').set(adminHeaders).expect(201);

    const res = await http().get('/users?role=ACCOUNTANT').set(adminHeaders).expect(200);
    expect(res.body.items.map((u: { id: string }) => u.id)).toContain('user-1');
  });

  it('returns 404 USER_NOT_FOUND on role endpoints for an unknown user', async () => {
    const res = await http().get('/users/khong-co/roles').set(adminHeaders).expect(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
    await http().post('/users/khong-co/roles/TA').set(adminHeaders).expect(404);
    await http().delete('/users/khong-co/roles/TA').set(adminHeaders).expect(404);
  });

  it('still refuses to let an admin revoke their own ADMIN role', async () => {
    await http().delete('/users/admin-1/roles/ADMIN').set(adminHeaders).expect(400);
    const res = await http().get('/users/admin-1').set(adminHeaders).expect(200);
    expect(res.body.roles).toContain('ADMIN');
  });
});

describe('S1-08 link kích hoạt trỏ về frontend', () => {
  let app: INestApplication;
  const mail = new FakeMailService();
  const saved = { origin: process.env.FRONTEND_ORIGIN, url: process.env.FRONTEND_URL };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (saved.origin === undefined) delete process.env.FRONTEND_ORIGIN;
    else process.env.FRONTEND_ORIGIN = saved.origin;
    if (saved.url === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = saved.url;
    await app.close();
  });

  async function createAndGetLink(email: string): Promise<string> {
    await request(app.getHttpServer())
      .post('/users')
      .set(adminHeaders)
      .send({ fullName: 'Người Nhận Link', email, roles: ['STUDENT'] })
      .expect(201);
    return mail.sent[mail.sent.length - 1].activationLink;
  }

  it('defaults to the frontend dev port 5173, not the backend port 3000', async () => {
    delete process.env.FRONTEND_ORIGIN;
    delete process.env.FRONTEND_URL;
    expect(await createAndGetLink('link1@tms.vn')).toMatch(/^http:\/\/localhost:5173\/activate\?token=/);
  });

  it('uses FRONTEND_ORIGIN and drops a trailing slash', async () => {
    process.env.FRONTEND_ORIGIN = 'https://tms.example.edu.vn/';
    expect(await createAndGetLink('link2@tms.vn')).toMatch(/^https:\/\/tms\.example\.edu\.vn\/activate\?token=/);
  });

  it('still honours the older FRONTEND_URL name', async () => {
    delete process.env.FRONTEND_ORIGIN;
    process.env.FRONTEND_URL = 'https://cu.example.edu.vn';
    expect(await createAndGetLink('link3@tms.vn')).toMatch(/^https:\/\/cu\.example\.edu\.vn\/activate\?token=/);
  });
});
