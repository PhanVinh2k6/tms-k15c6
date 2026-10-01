import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('SCRUM-32 - standardized 401/403 responses', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 - returns standardized unauthorized response', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập không hợp lệ.',
    });
  });

  it('403 - returns standardized forbidden response for non-admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('x-user-id', 'user-1')
      .set('x-user-roles', 'INSTRUCTOR')
      .expect(403);

    expect(res.body).toEqual({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Chỉ quản trị hệ thống mới được phép quản lý vai trò.',
    });
  });
});
