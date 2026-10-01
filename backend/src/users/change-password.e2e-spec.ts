import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { UserAccount, UserStatus } from './user.types';
import { UsersService } from './users.service';
import { hashPassword, verifyPassword } from './password.util';

const userHeaders = { 'x-user-id': 'user-1', 'x-user-roles': 'INSTRUCTOR' };
const currentSessionHeaders = { ...userHeaders, 'x-session-id': 's1-04-test-current' };

describe('S1-04 change password API', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let user: UserAccount;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    usersService = app.get(UsersService);

    // Seed users intentionally have no password in the demo app; arrange a known
    // credential for API tests without adding a production backdoor.
    const store = (usersService as unknown as { users: Map<string, UserAccount> }).users;
    user = store.get('user-1')!;
  });

  beforeEach(async () => {
    user.passwordHash = await hashPassword('OldPass123');
    user.status = UserStatus.ACTIVE;
    user.sessionVersion = 0;
  });

  afterAll(async () => app.close());

  it('requires an authenticated actor', async () => {
    await http()
      .patch('/users/me/password')
      .send({ currentPassword: 'OldPass123', newPassword: 'NewPass123' })
      .expect(401);
  });

  it('requires a session ID for session-aware password changes', async () => {
    await http()
      .patch('/users/me/password')
      .set({ 'x-user-id': 'sessionless-user', 'x-user-roles': 'INSTRUCTOR' })
      .send({ currentPassword: 'OldPass123', newPassword: 'NewPass123' })
      .expect(401);
  });

  it('rejects an incorrect current password without changing the account', async () => {
    await http()
      .patch('/users/me/password')
      .set(currentSessionHeaders)
      .send({ currentPassword: 'WrongPass123', newPassword: 'NewPass123' })
      .expect(401);

    expect(await verifyPassword('OldPass123', user.passwordHash)).toBe(true);
    expect(user.sessionVersion).toBe(0);
  });

  it.each([
    ['too short', 'Abc1234'],
    ['without a letter', '12345678'],
    ['without a number', 'Password'],
  ])('rejects a new password %s', async (_label, newPassword) => {
    await http()
      .patch('/users/me/password')
      .set(currentSessionHeaders)
      .send({ currentPassword: 'OldPass123', newPassword })
      .expect(400);

    expect(await verifyPassword('OldPass123', user.passwordHash)).toBe(true);
  });

  it('keeps the current session and revokes other sessions after changing the password', async () => {
    const otherSessionHeaders = {
      'x-user-id': 'user-1',
      'x-user-roles': 'ADMIN',
      'x-session-id': 's1-04-test-other',
    };
    // Ghi nhận session khác qua middleware trong RolesModule; registry phải dùng chung.
    await http().get('/users/user-1/roles').set(otherSessionHeaders).expect(200);

    const response = await http()
      .patch('/users/me/password')
      .set(currentSessionHeaders)
      .send({ currentPassword: 'OldPass123', newPassword: 'NewPass456' })
      .expect(200);

    expect(response.body).toEqual({ message: 'Đổi mật khẩu thành công.', revokedOtherSessions: 1 });
    expect(await verifyPassword('OldPass123', user.passwordHash)).toBe(false);
    expect(await verifyPassword('NewPass456', user.passwordHash)).toBe(true);
    expect(user.sessionVersion).toBe(1);

    await http()
      .patch('/users/me/password')
      .set(otherSessionHeaders)
      .send({ currentPassword: 'NewPass456', newPassword: 'Another789' })
      .expect(401);

    await http()
      .patch('/users/me/password')
      .set(userHeaders)
      .send({ currentPassword: 'NewPass456', newPassword: 'Another789' })
      .expect(401);

    // Phiên đang thao tác vẫn hợp lệ sau khi đổi mật khẩu.
    await http()
      .patch('/users/me/password')
      .set(currentSessionHeaders)
      .send({ currentPassword: 'NewPass456', newPassword: 'NextPass789' })
      .expect(200);
    expect(user.sessionVersion).toBe(2);
  });

  it('rejects reusing the current password', async () => {
    await http()
      .patch('/users/me/password')
      .set(currentSessionHeaders)
      .send({ currentPassword: 'OldPass123', newPassword: 'OldPass123' })
      .expect(409);

    expect(user.sessionVersion).toBe(0);
  });

  it('does not allow the caller to target another user', async () => {
    await http()
      .patch('/users/me/password')
      .set(currentSessionHeaders)
      .send({ userId: 'admin-1', currentPassword: 'OldPass123', newPassword: 'NewPass456' })
      .expect(400);
  });
});
