import { Injectable, Logger } from '@nestjs/common';

export interface PasswordResetEmail {
  to: string;
  fullName: string;
  resetLink: string;
  expiresAt: Date;
}

export interface ActivationEmail {
  to: string;
  fullName: string;
  temporaryPassword: string;
  activationLink: string;
  expiresAt: Date;
}

/**
 * Cổng gửi email. Service chỉ phụ thuộc vào lớp trừu tượng này,
 * nên khi có SMTP thật chỉ cần viết lớp mới và đổi `useClass` trong UsersModule.
 */
export abstract class MailService {
  abstract sendAccountActivation(email: ActivationEmail): Promise<void>;

  // Có implementation mặc định để các fake mail service cũ vẫn tương thích.
  async sendPasswordReset(_email: PasswordResetEmail): Promise<void> {}
}

/**
 * Bản dùng khi phát triển: in email ra terminal thay vì gửi thật.
 * KHÔNG dùng cho production vì mật khẩu tạm bị in ra log.
 */
@Injectable()
export class ConsoleMailService extends MailService {
  private readonly logger = new Logger('MailService');

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    this.logger.log(
      [`[DEV] Email đặt lại mật khẩu gửi tới ${email.to} (${email.fullName})`, `  Link đặt lại: ${email.resetLink}`, `  Hết hạn lúc: ${email.expiresAt.toISOString()}`].join('\n'),
    );
  }

  async sendAccountActivation(email: ActivationEmail): Promise<void> {
    this.logger.log(
      [
        `[DEV] Email kích hoạt gửi tới ${email.to} (${email.fullName})`,
        `  Link kích hoạt: ${email.activationLink}`,
        `  Mật khẩu tạm: ${email.temporaryPassword}`,
        `  Hết hạn lúc: ${email.expiresAt.toISOString()}`,
      ].join('\n'),
    );
  }
}
