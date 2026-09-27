import { Injectable, Logger } from '@nestjs/common';

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
}

/**
 * Bản dùng khi phát triển: in email ra terminal thay vì gửi thật.
 * KHÔNG dùng cho production vì mật khẩu tạm bị in ra log.
 */
@Injectable()
export class ConsoleMailService extends MailService {
  private readonly logger = new Logger('MailService');

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
