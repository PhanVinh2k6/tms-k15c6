import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { Role } from '../roles/role.types';
import { MailService } from './mail.service';
import {
  generateActivationToken,
  generateTemporaryPassword,
  hashPassword,
  hashToken,
  verifyPassword,
} from './password.util';
import {
  CreateUserInput,
  ListUsersQuery,
  PaginatedResult,
  UpdateUserInput,
  UserAccount,
  UserResponse,
  UserStatus,
  ChangePasswordInput,
} from './user.types';
import { normalizeEmail, normalizePhone, toSearchText } from './users.validation';

const ACTIVATION_TTL_MS = 48 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class UsersService {
  /**
   * Kho tạm trong bộ nhớ (giống RolesService), sẽ thay bằng PostgreSQL.
   * Map giữ thứ tự thêm vào, nên đảo ngược lại là "mới tạo xếp trước".
   */
  private readonly users = new Map<string, UserAccount>();
  lastPasswordResetToken: string | null = null;

  constructor(private readonly mailService: MailService) {
    this.seed('admin-1', 'Quản trị hệ thống', 'admin@tms.local', [Role.ADMIN]);
    this.seed('user-1', 'Giảng viên mẫu', 'user@tms.local', [Role.INSTRUCTOR]);
    this.seed('accountant-1', 'Kế toán mẫu', 'accountant@tms.local', [Role.ACCOUNTANT]);
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
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      sessionVersion: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);

    // Ưu tiên FRONTEND_ORIGIN, vẫn nhận FRONTEND_URL (tên cũ); 5173 là cổng mặc định của frontend (Vite).
    const frontendUrl = (process.env.FRONTEND_ORIGIN ?? process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(
      /\/+$/,
      '',
    );
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

  // ---------------------------------------------------------------------------
  // Vai trò (S1-09). RolesService gọi vào đây để S1-08 và S1-09 dùng chung MỘT kho dữ liệu:
  // user tạo ở S1-08 gán được vai trò ở S1-09, và vai trò gán ở S1-09 hiện ngay trong S1-08.
  // ---------------------------------------------------------------------------

  getRoles(id: string): Role[] {
    return [...this.getUser(id).roles].sort();
  }

  addRole(id: string, role: Role): Role[] {
    const user = this.getUser(id);
    user.roles.add(role);
    user.updatedAt = new Date();
    return this.getRoles(id);
  }

  removeRole(id: string, role: Role): Role[] {
    const user = this.getUser(id);
    user.roles.delete(role);
    user.updatedAt = new Date();
    return this.getRoles(id);
  }

  /**
   * Xoá hẳn tài khoản (không khôi phục được). Không cho tự xoá mình, và không xoá Quản trị hệ thống
   * cuối cùng để hệ thống luôn còn người quản lý. Muốn giữ lại dữ liệu thì dùng khoá tài khoản (S1-10).
   */
  remove(id: string, actorId: string): { id: string } {
    const user = this.getUser(id);
    if (user.id === actorId) {
      throw new ForbiddenException({ code: 'CANNOT_DELETE_SELF', message: 'Bạn không thể tự xoá tài khoản của mình.' });
    }
    if (user.roles.has(Role.ADMIN)) {
      const admins = [...this.users.values()].filter((item) => item.roles.has(Role.ADMIN));
      if (admins.length <= 1) {
        throw new ConflictException({
          code: 'CANNOT_DELETE_LAST_ADMIN',
          message: 'Không thể xoá Quản trị hệ thống cuối cùng.',
        });
      }
    }
    this.users.delete(id);
    return { id };
  }

  /**
   * Đổi mật khẩu của chính user hiện tại. sessionVersion được tăng để auth layer
   * vô hiệu hóa token/phiên cũ sau khi tích hợp S1-01/S1-02.
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<{ message: string }> {
    const user = this.getUser(userId);
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({ code: 'ACCOUNT_NOT_ACTIVE', message: 'Tài khoản chưa hoạt động.' });
    }

    const matches = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException({
        code: 'CURRENT_PASSWORD_INVALID',
        message: 'Mật khẩu hiện tại không chính xác.',
      });
    }
    if (input.currentPassword === input.newPassword) {
      throw new ConflictException({
        code: 'PASSWORD_UNCHANGED',
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      });
    }

    user.passwordHash = await hashPassword(input.newPassword);
    user.mustChangePassword = false;
    user.sessionVersion += 1;
    this.clearPasswordResetToken(user);
    user.updatedAt = new Date();

    return { message: 'Đổi mật khẩu thành công.' };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const normalizedEmail = normalizeEmail(email);
    const user = [...this.users.values()].find((candidate) => candidate.email === normalizedEmail);

    if (user) {
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      const tokenHash = hashToken(token);

      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = expiresAt;
      this.lastPasswordResetToken = token;

      const frontendUrl = (process.env.FRONTEND_ORIGIN ?? process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
      try {
        await this.mailService.sendPasswordReset({
          to: user.email,
          fullName: user.fullName,
          resetLink: `${frontendUrl}/reset-password?token=${token}`,
          expiresAt,
        });
      } catch {
        this.clearPasswordResetToken(user);
        throw new ServiceUnavailableException({
          code: 'EMAIL_SEND_FAILED',
          message: 'Không gửi được email đặt lại mật khẩu. Vui lòng thử lại.',
        });
      }
    }

    return { message: 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.' };
  }

  async requestPasswordResetLink(email: string): Promise<{ message: string }> {
    return this.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.confirmPasswordReset(token, newPassword);
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const trimmedToken = token.trim();
    const user = this.findUserByPasswordResetToken(trimmedToken);

    if (!user) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      });
    }

    if (await verifyPassword(newPassword, user.passwordHash)) {
      throw new ConflictException({
        code: 'PASSWORD_UNCHANGED',
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    user.sessionVersion += 1;
    this.clearPasswordResetToken(user);
    user.updatedAt = new Date();

    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }

  private findUserByPasswordResetToken(token: string): UserAccount | null {
    const tokenHash = hashToken(token);
    const now = Date.now();

    for (const user of this.users.values()) {
      const expiresAt = user.passwordResetExpiresAt;
      const hashedToken = user.passwordResetTokenHash;
      if (hashedToken && expiresAt && expiresAt.getTime() > now && hashedToken === tokenHash) {
        return user;
      }
    }

    return null;
  }

  private clearPasswordResetToken(user: UserAccount): void {
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
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

  // ---------------------------------------------------------------------------
  // Khoá / mở khoá tài khoản (S1-10).
  // Khoá = đổi status sang LOCKED + tăng sessionVersion (dùng chung bộ đếm với đổi mật khẩu S1-04).
  // Khi tích hợp Auth (S1-01/S1-02), Auth phải: chỉ cho đăng nhập khi status = ACTIVE, và chỉ chấp nhận
  // token mang đúng sessionVersion hiện tại. Lúc đó khoá xong sẽ chặn cả đăng nhập lẫn phiên đang mở,
  // và phiên cũ không sống lại sau khi mở khoá. Hiện chưa có Auth nên ActorMiddleware chưa chặn gì.
  // ---------------------------------------------------------------------------

  lock(id: string, reason: string, actorId: string): UserResponse {
    const user = this.getUser(id);
    if (user.id === actorId) {
      throw new BadRequestException({
        code: 'CANNOT_LOCK_SELF',
        message: 'Không thể tự khoá tài khoản của chính mình',
      });
    }
    if (user.status === UserStatus.LOCKED) {
      throw new ConflictException({ code: 'ALREADY_LOCKED', message: 'Tài khoản này đã bị khoá' });
    }

    const now = new Date();
    user.statusBeforeLock = user.status;
    user.status = UserStatus.LOCKED;
    user.lockedReason = reason;
    user.lockedAt = now;
    user.lockedById = actorId;
    user.sessionVersion += 1; // thu hồi mọi phiên đang mở
    user.updatedAt = now;
    return this.toResponse(user);
  }

  unlock(id: string): UserResponse {
    const user = this.getUser(id);
    if (user.status !== UserStatus.LOCKED) {
      throw new ConflictException({ code: 'NOT_LOCKED', message: 'Tài khoản này không bị khoá' });
    }

    // Trả về đúng trạng thái trước khi khoá: tài khoản chưa kích hoạt vẫn phải kích hoạt, không được "nhảy cóc".
    user.status = user.statusBeforeLock ?? UserStatus.ACTIVE;
    user.statusBeforeLock = null;
    user.lockedReason = null;
    user.lockedAt = null;
    user.lockedById = null;
    user.updatedAt = new Date();
    return this.toResponse(user);
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
      lockedReason: user.lockedReason ?? null,
      lockedAt: user.lockedAt ? user.lockedAt.toISOString() : null,
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
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      sessionVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
}
