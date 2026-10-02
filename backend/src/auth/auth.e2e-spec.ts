import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('S1-01 email/password login', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('logs in with valid credentials and returns the role-specific home path', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@tms.local', password: 'Admin123!' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.accessToken).toEqual(expect.any(String));
        expect(body.tokenType).toBe('Bearer');
        expect(body.redirectPath).toBe('/admin');
        expect(body.user).toEqual({ id: 'admin-1', email: 'admin@tms.local', roles: ['ADMIN'] });
        expect(body.user.passwordHash).toBeUndefined();
      });
  });

  it('uses one generic error for a wrong password and an unknown email', async () => {
    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@tms.local', password: 'wrong' })
      .expect(401);
    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@tms.local', password: 'wrong' })
      .expect(401);
    expect(wrongPassword.body.message).toBe('Email hoặc mật khẩu không đúng');
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('resets consecutive failures after a successful login', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({ email: 'user@tms.local', password: 'wrong' }).expect(401);
    await request(app.getHttpServer()).post('/auth/login').send({ email: 'user@tms.local', password: 'User123!' }).expect(201);
    await request(app.getHttpServer()).post('/auth/login').send({ email: 'user@tms.local', password: 'wrong' }).expect(401);
  });

  it('temporarily locks an account after five consecutive failures', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'student@tms.local', password: 'wrong' })
        .expect(401)
        .expect(({ body }) => expect(body.message).toBe('Email hoặc mật khẩu không đúng'));
    }
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@tms.local', password: 'Student123!' })
      .expect(429);
  });

  it('returns the authenticated user from the bearer token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@tms.local', password: 'Admin123!' })
      .expect(201);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.user.email).toBe('admin@tms.local'));
  });

  it('creates, lists, inspects, and revokes the authenticated session', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@tms.local', password: 'Admin123!' })
      .expect(201);
    const authorization = `Bearer ${login.body.accessToken}`;

    await request(app.getHttpServer())
      .get('/auth/session')
      .set('Authorization', authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body.session.id).toBe(login.body.sessionId);
        expect(body.session.userId).toBe('admin-1');
        expect(body.session.revokedAt).toBeNull();
      });

    await request(app.getHttpServer())
      .get('/auth/sessions')
      .set('Authorization', authorization)
      .expect(200)
      .expect(({ body }) => expect(body.sessions.map((session: { id: string }) => session.id)).toContain(login.body.sessionId));

    await request(app.getHttpServer()).delete('/auth/session').set('Authorization', authorization).expect(200, { success: true });
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', authorization).expect(401);
  });
});
