import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

const adminHeaders = { 'x-user-id': 'admin-1', 'x-user-roles': 'ADMIN' };
const instructorHeaders = { 'x-user-id': 'user-1', 'x-user-roles': 'INSTRUCTOR' };

describe('S1-09 role management API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('allows one user to hold multiple roles at the same time', async () => {
    await request(app.getHttpServer())
      .post('/users/user-1/roles/TRAINING_MANAGER')
      .set(adminHeaders)
      .expect(201)
      .expect(({ body }) => expect(body.roles).toEqual(expect.arrayContaining(['INSTRUCTOR', 'TRAINING_MANAGER'])));
  });

  it('makes a role change effective on the very next operation', async () => {
    await request(app.getHttpServer())
      .post('/users/user-1/roles/ACCOUNTANT')
      .set(adminHeaders)
      .expect(201);

    await request(app.getHttpServer())
      .get('/users/user-1/roles')
      .set(adminHeaders)
      .expect(200)
      .expect(({ body }) => expect(body.roles).toEqual(expect.arrayContaining(['ACCOUNTANT'])));

    await request(app.getHttpServer())
      .delete('/users/user-1/roles/ACCOUNTANT')
      .set(adminHeaders)
      .expect(200);

    await request(app.getHttpServer())
      .get('/users/user-1/roles')
      .set(adminHeaders)
      .expect(200)
      .expect(({ body }) => expect(body.roles).not.toContain('ACCOUNTANT'));
  });

  it('does not allow an administrator to revoke their own ADMIN role', async () => {
    await request(app.getHttpServer())
      .delete('/users/admin-1/roles/ADMIN')
      .set(adminHeaders)
      .expect(400);
  });

  it('only allows administrators to manage roles', async () => {
    await request(app.getHttpServer())
      .post('/users/user-1/roles/TA')
      .set(instructorHeaders)
      .expect(403);
  });
});
