import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { ActivationEmail, MailService, PasswordResetEmail } from './mail.service';
import { hashPassword, verifyPassword } from './password.util';
import { UserAccount, UserStatus } from './user.types';
import { UsersService } from './users.service';

class FakeMailService extends MailService {
  readonly resets: PasswordResetEmail[] = [];
  failing = false;
  async sendAccountActivation(_email: ActivationEmail): Promise<void> {}
  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    if (this.failing) {
      throw new Error('SMTP down');
    }
    this.resets.push(email);
  }
}

const GENERIC_MESSAGE = 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.';

describe('S1-03 đặt lại mật khẩu qua email', () => {
  let app: INestApplication;
  let mail: FakeMailService;
  let user: UserAccount;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    mail = new FakeMailService();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    const store = (app.get(UsersService) as unknown as { users: Map<string, UserAccount> }).users;
    user = store.get('user-1')!;
  });

  beforeEach(async () => {
    mail.resets.length = 0;
    mail.failing = false;
    user.status = UserStatus.ACTIVE;
    user.passwordHash = await hashPassword('OldPass123');
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.sessionVersion = 0;
  });

  afterAll(async () => app.close());

  const requestReset = (email: string) => http().post('/auth/password-reset/request').send({ email });
  const tokenFromLastMail = () => new URL(mail.resets[mail.resets.length - 1].resetLink).searchParams.get('token')!;

  it('gửi liên kết có hiệu lực 30 phút cho email tồn tại', async () => {
    const before = Date.now();
    const response = await requestReset('user@tms.local').expect(200);

    expect(response.body.message).toBe(GENERIC_MESSAGE);
    expect(mail.resets).toHaveLength(1);
    expect(mail.resets[0].to).toBe('user@tms.local');
    const ttl = mail.resets[0].expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThan(29 * 60 * 1000);
    expect(ttl).toBeLessThanOrEqual(30 * 60 * 1000 + 1000);
  });

  it('email không tồn tại vẫn trả đúng cùng thông báo và không gửi mail', async () => {
    const existing = await requestReset('user@tms.local').expect(200);
    mail.resets.length = 0;
    const missing = await requestReset('khong-co@tms.local').expect(200);

    expect(missing.body).toEqual(existing.body);
    expect(mail.resets).toHaveLength(0);
  });

  it('chuẩn hoá email (hoa/thường, khoảng trắng) khi tra cứu', async () => {
    await requestReset('  USER@TMS.LOCAL ').expect(200);
    expect(mail.resets).toHaveLength(1);
  });

  it('tài khoản bị khoá không nhận được liên kết nhưng thông báo vẫn giống nhau', async () => {
    user.status = UserStatus.LOCKED;
    const response = await requestReset('user@tms.local').expect(200);
    expect(response.body.message).toBe(GENERIC_MESSAGE);
    expect(mail.resets).toHaveLength(0);
  });

  it('từ chối email sai định dạng và trường lạ', async () => {
    await requestReset('khong-phai-email').expect(400);
    await http().post('/auth/password-reset/request').send({ email: 'user@tms.local', role: 'ADMIN' }).expect(400);
  });

  it('báo lỗi 503 và huỷ token nếu không gửi được email', async () => {
    mail.failing = true;
    await requestReset('user@tms.local').expect(503);
    expect(user.passwordResetTokenHash).toBeNull();
  });

  it('đặt lại mật khẩu bằng token, mật khẩu cũ hết hiệu lực và phiên cũ bị thu hồi', async () => {
    await requestReset('user@tms.local').expect(200);
    const token = tokenFromLastMail();

    const response = await http()
      .post('/auth/password-reset/confirm')
      .send({ token, newPassword: 'BrandNew456' })
      .expect(200);

    expect(response.body.message).toBe('Mật khẩu đã được đặt lại thành công.');
    expect(await verifyPassword('BrandNew456', user.passwordHash)).toBe(true);
    expect(await verifyPassword('OldPass123', user.passwordHash)).toBe(false);
    expect(user.sessionVersion).toBe(1);
  });

  it('liên kết chỉ dùng được một lần', async () => {
    await requestReset('user@tms.local').expect(200);
    const token = tokenFromLastMail();

    await http().post('/auth/password-reset/confirm').send({ token, newPassword: 'BrandNew456' }).expect(200);
    const second = await http()
      .post('/auth/password-reset/confirm')
      .send({ token, newPassword: 'Another789' })
      .expect(400);

    expect(second.body.code).toBe('INVALID_RESET_TOKEN');
    expect(await verifyPassword('BrandNew456', user.passwordHash)).toBe(true);
  });

  it('liên kết hết hạn sau 30 phút bị từ chối', async () => {
    await requestReset('user@tms.local').expect(200);
    const token = tokenFromLastMail();
    user.passwordResetExpiresAt = new Date(Date.now() - 1000);

    const response = await http()
      .post('/auth/password-reset/confirm')
      .send({ token, newPassword: 'BrandNew456' })
      .expect(400);
    expect(response.body.code).toBe('INVALID_RESET_TOKEN');
  });

  it('yêu cầu mới vô hiệu hoá liên kết cũ', async () => {
    await requestReset('user@tms.local').expect(200);
    const oldToken = tokenFromLastMail();
    await requestReset('user@tms.local').expect(200);
    const newToken = tokenFromLastMail();

    await http().post('/auth/password-reset/confirm').send({ token: oldToken, newPassword: 'BrandNew456' }).expect(400);
    await http().post('/auth/password-reset/confirm').send({ token: newToken, newPassword: 'BrandNew456' }).expect(200);
  });

  it('token sai hoặc mật khẩu yếu bị từ chối và không đổi mật khẩu', async () => {
    await requestReset('user@tms.local').expect(200);
    const token = tokenFromLastMail();

    await http().post('/auth/password-reset/confirm').send({ token: 'sai-token', newPassword: 'BrandNew456' }).expect(400);
    await http().post('/auth/password-reset/confirm').send({ token, newPassword: 'short1' }).expect(400);
    await http().post('/auth/password-reset/confirm').send({ token, newPassword: 'chiCoChuCai' }).expect(400);
    await http().post('/auth/password-reset/confirm').send({ token, newPassword: '1234567890' }).expect(400);

    expect(await verifyPassword('OldPass123', user.passwordHash)).toBe(true);
  });

  it('từ chối mật khẩu mới trùng mật khẩu hiện tại', async () => {
    await requestReset('user@tms.local').expect(200);
    const token = tokenFromLastMail();
    await http().post('/auth/password-reset/confirm').send({ token, newPassword: 'OldPass123' }).expect(409);
  });

  it('API không cần đăng nhập (không yêu cầu header actor)', async () => {
    await http().post('/auth/password-reset/request').send({ email: 'user@tms.local' }).expect(200);
  });
});
