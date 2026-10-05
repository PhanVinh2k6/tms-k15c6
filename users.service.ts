import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '../roles/role.types';
import { MailService } from './mail.service';
import { generateActivationToken, generateTemporaryPassword, hashPassword } from './password.util';
import {
  CreateUserInput,
  ListUsersQuery,
  PaginatedResult,
  UpdateUserInput,
  UserAccount,
  UserResponse,
  UserStatus,
} from './user.types';
import { normalizePhone, toSearchText } from './users.validation';

const ACTIVATION_TTL_MS = 48 * 60 * 60 * 1000;
const RESET_PASSWORD_TTL_MS = 30 * 60 * 1000; // 30 phút

@Injectable()
export class UsersService {
  /**
   * Kho tạm trong bộ nhớ (giống RolesService), sẽ thay bằng PostgreSQL.
   * Map giữ thứ tự thêm vào, nên đảo ngược lại là "mới tạo xếp trước".
   */
  private readonly users = new Map<string, UserAccount>();
  private readonly passwordResetTokens = new Map<string, { email: string; expiresAt: number; used: boolean }>();

  constructor(private readonly mailService: MailService) {
    this.seed('admin-1', 'Quản trị hệ thống', 'admin@tms.local', [Role.ADMIN]);
    this.seed('user-1', 'Giảng viên mẫu', 'user@tms.local', [Role.INSTRUCTOR]);
  }

  async create(input: CreateUserInput): Promise<UserResponse> {
    // Băm mật khẩu (bất đồng bộ) TRƯỚC khi kiểm tra trùng email, để bước "kiểm tra + lưu"
    // chạy liền một mạch, không bị request khác chen vào giữa.
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const { token, tokenHash } = generateActivationToken();

    this.assertEmailAvailable(input.email);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ACTIVATION_TTL_MS);
    const user: UserAccount = {
      id: randomUUID(),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      roles: new Set(input.roles),
      status: UserStatus.PENDING_ACTIVATION,
      passwordHash,
      mustChangePassword: true,
      activationTokenHash: tokenHash,
      activationExpiresAt: expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    try {
      await this.mailService.sendAccountActivation({
        to: user.email,
        fullName: user.fullName,
        temporaryPassword,
        activationLink: `${frontendUrl}/activate?token=${token}`,
        expiresAt,
      });
    } catch {
      // Không gửi được email thì người dùng không có mật khẩu để vào -> huỷ tạo tài khoản.
      this.users.delete(user.id);
      throw new ServiceUnavailableException({
        code: 'EMAIL_SEND_FAILED',
        message: 'Không gửi được email kích hoạt nên tài khoản chưa được tạo. Vui lòng thử lại.',
      });
    }

    return this.toResponse(user);
  }

  list(query: ListUsersQuery): PaginatedResult<UserResponse> {
    const keyword = query.q ? toSearchText(query.q) : undefined;
    const phoneKeyword = query.q ? normalizePhone(query.q) : undefined;

    const matched = [...this.users.values()].reverse().filter((user) => {
      if (query.role && !user.roles.has(query.role)) return false;
      if (query.status && user.status !== query.status) return false;
      if (!keyword) return true;
      return (
        toSearchText(user.fullName).includes(keyword) ||
        user.email.includes(keyword) ||
        (!!user.phone && /^\+?\d+$/.test(phoneKeyword!) && user.phone.includes(phoneKeyword!))
      );
    });

    const total = matched.length;
    const start = (query.page - 1) * query.pageSize;
    return {
      items: matched.slice(start, start + query.pageSize).map((user) => this.toResponse(user)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  findOne(id: string): UserResponse {
    return this.toResponse(this.getUser(id));
  }

  update(id: string, input: UpdateUserInput): UserResponse {
    const user = this.getUser(id);
    if (input.email !== undefined && input.email !== user.email) {
      this.assertEmailAvailable(input.email);
      user.email = input.email;
    }
    if (input.fullName !== undefined) user.fullName = input.fullName;
    if (input.phone !== undefined) user.phone = input.phone;
    user.updatedAt = new Date();
    return this.toResponse(user);
  }

  private assertEmailAvailable(email: string): void {
    for (const user of this.users.values()) {
      if (user.email === email) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: `Email ${email} đã được dùng cho tài khoản khác`,
        });
      }
    }
  }

  private getUser(id: string): UserAccount {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: `Không tìm thấy tài khoản ${id}` });
    }
    return user;
  }

  private toResponse(user: UserAccount): UserResponse {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      roles: [...user.roles].sort(),
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private seed(id: string, fullName: string, email: string, roles: Role[]): void {
    const now = new Date();
    this.users.set(id, {
      id,
      fullName,
      email,
      phone: null,
      roles: new Set(roles),
      status: UserStatus.ACTIVE,
      // Tài khoản mẫu chưa có mật khẩu: verifyPassword() luôn trả false với giá trị này.
      passwordHash: 'seed$no-password',
      mustChangePassword: false,
      activationTokenHash: null,
      activationExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
// 1. Gửi link đặt lại mật khẩu
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const genericMessage = 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.';
    
    // Tìm user theo email (chuẩn hóa chữ thường)
    const normalizedEmail = email.trim().toLowerCase();
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === normalizedEmail,
    );

    // Không tiết lộ tài khoản có tồn tại hay không (Yêu cầu 4 & 5)
    if (!user) {
      return { message: genericMessage };
    }

    // Tạo token ngẫu nhiên và lưu hạn 30 phút
    const token = randomUUID();
    this.passwordResetTokens.set(token, {
      email: user.email,
      expiresAt: Date.now() + RESET_PASSWORD_TTL_MS,
      used: false,
    });

    // Gửi email chứa link đặt lại mật khẩu
    await this.mailService.sendMail(
      user.email,
      'Đặt lại mật khẩu',
      `Nhấp vào liên kết sau để đặt lại mật khẩu (có hiệu lực trong 30 phút): http://localhost:3000/reset-password?token=${token}`,
    );

    return { message: genericMessage };
  }

  // 2. Xác nhận đổi mật khẩu mới bằng token
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const record = this.passwordResetTokens.get(token);

    // Kiểm tra token có tồn tại, còn hạn (30p), và chưa qua sử dụng (chỉ dùng 1 lần)
    if (!record || record.used || Date.now() > record.expiresAt) {
      throw new ConflictException('Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    // Đổi mật khẩu cho user
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === record.email.toLowerCase(),
    );

    if (user) {
      user.passwordHash = hashPassword(newPassword);
      record.used = true; // Đánh dấu đã dùng, không cho dùng lại
    }

    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }
}