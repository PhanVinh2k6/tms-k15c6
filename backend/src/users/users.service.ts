import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
import { SessionRegistry } from '../sessions/session-registry.service';

const ACTIVATION_TTL_MS = 48 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_REQUESTED_MESSAGE = 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.';

@Injectable()
export class UsersService {
  /**
   * Kho tạm trong bộ nhớ (giống RolesService), sẽ thay bằng PostgreSQL.
   * Map giữ thứ tự thêm vào, nên đảo ngược lại là "mới tạo xếp trước".
   */
  private readonly users = new Map<string, UserAccount>();
  private readonly loginFailures = new Map<string, { attempts: number; lockedUntil: Date | null }>();

  /** Initialize the in-memory demo accounts and connect mail and optional session services. */
  constructor(private readonly mailService: MailService, @Optional() private readonly sessions?: SessionRegistry) {
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

    const frontendUrl = this.frontendUrl();
    try {
      await this.mailService.sendAccountActivation({
        to: user.email,
        fullName: user.fullName,
        temporaryPassword,
        activationLink: `${frontendUrl}/activate#token=${encodeURIComponent(token)}`,
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

  /** Return the stored account, including its password hash, by normalized email, or null. */
  findByEmailForAuth(email: string): UserAccount | null {
    const normalized = normalizeEmail(email);
    return [...this.users.values()].find((user) => user.email === normalized) ?? null;
  }

  /**
   * Return account status, roles, and session version for authentication checks.
   * @throws NotFoundException when the account does not exist.
   */
  getAuthState(id: string): { id: string; status: UserStatus; roles: Role[]; sessionVersion: number; fullName: string; email: string } {
    const user = this.getUser(id);
    return { id: user.id, status: user.status, roles: [...user.roles], sessionVersion: user.sessionVersion, fullName: user.fullName, email: user.email };
  }

  /** Allow login only for active accounts whose temporary lockout has expired or is absent. */
  isLoginAllowed(user: UserAccount): boolean {
    const failure = this.loginFailures.get(user.id);
    return user.status === UserStatus.ACTIVE && (!failure?.lockedUntil || failure.lockedUntil.getTime() <= Date.now());
  }

  /** Track a failed attempt; every fifth failure starts a 15-minute lockout and resets the count. */
  recordFailedLogin(userId: string): void {
    const current = this.loginFailures.get(userId) ?? { attempts: 0, lockedUntil: null };
    current.attempts += 1;
    if (current.attempts >= 5) {
      current.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      current.attempts = 0;
    }
    this.loginFailures.set(userId, current);
  }

  /** Remove the account's failed-attempt count and temporary lockout. */
  clearFailedLogins(userId: string): void { this.loginFailures.delete(userId); }

  /** Increment the account version so managed refresh tokens with older versions are rejected. */
  revokeAllSessions(userId: string): void { this.getUser(userId).sessionVersion += 1; }

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
    // Version tăng để refresh token cũ bị vô hiệu; current sid vẫn được giữ bởi registry.
    user.sessionVersion += 1;
    this.clearPasswordResetToken(user);
    user.updatedAt = new Date();

    return { message: 'Đổi mật khẩu thành công.' };
  }

  /**
   * S1-03: gửi liên kết đặt lại mật khẩu (hiệu lực 30 phút, dùng một lần).
   * Luôn trả cùng một thông báo dù email có tồn tại hay không, để không dò được tài khoản.
   * Chỉ tài khoản ACTIVE nhận được liên kết: tài khoản bị khoá không được tự mở lại bằng đường này.
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const normalizedEmail = normalizeEmail(email);
    const user = [...this.users.values()].find((candidate) => candidate.email === normalizedEmail);

    if (user && user.status === UserStatus.ACTIVE) {
      // Yêu cầu mới ghi đè token cũ, nên liên kết cũ tự mất hiệu lực.
      const { token, tokenHash } = generateActivationToken();
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = expiresAt;

      try {
        await this.mailService.sendPasswordReset({
          to: user.email,
          fullName: user.fullName,
          resetLink: `${this.frontendUrl()}/password-reset.html?token=${token}`,
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

    return { message: PASSWORD_RESET_REQUESTED_MESSAGE };
  }

  /**
   * Set the password and ACTIVE status for an account with a matching, unexpired token.
   * Clear the activation token and increment the session version on success.
   * @throws BadRequestException when no valid activation token matches.
   */
  async activateAccount(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = hashToken(token.trim());
    const user = [...this.users.values()].find((candidate) => candidate.status === UserStatus.PENDING_ACTIVATION && candidate.activationTokenHash === tokenHash && candidate.activationExpiresAt && candidate.activationExpiresAt.getTime() > Date.now());
    if (!user) throw new BadRequestException({ code: 'INVALID_ACTIVATION_TOKEN', message: 'Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.' });
    user.passwordHash = await hashPassword(newPassword);
    user.status = UserStatus.ACTIVE;
    user.mustChangePassword = false;
    user.activationTokenHash = null;
    user.activationExpiresAt = null;
    user.sessionVersion += 1;
    user.updatedAt = new Date();
    return { message: 'Kích hoạt tài khoản thành công.' };
  }

  /** S1-03: đặt mật khẩu mới bằng token trong liên kết; token bị huỷ ngay sau khi dùng và mọi phiên cũ bị thu hồi. */
  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const user = this.findUserByPasswordResetToken(token.trim());

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
    this.sessions?.revokeAllSessions(user.id);
    user.updatedAt = new Date();

    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }

  private findUserByPasswordResetToken(token: string): UserAccount | null {
    const tokenHash = hashToken(token);
    const now = Date.now();

    for (const user of this.users.values()) {
      if (
        user.status === UserStatus.ACTIVE &&
        user.passwordResetTokenHash === tokenHash &&
        user.passwordResetExpiresAt &&
        user.passwordResetExpiresAt.getTime() > now
      ) {
        return user;
      }
    }
    return null;
  }

  private clearPasswordResetToken(user: UserAccount): void {
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
  }

  /** Ưu tiên FRONTEND_ORIGIN, vẫn nhận FRONTEND_URL (tên cũ); 5173 là cổng mặc định của Vite. */
  private frontendUrl(): string {
    return (process.env.FRONTEND_ORIGIN ?? process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
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

  /** Serialize public account fields with sorted roles and ISO dates, excluding secrets. */
  toResponse(user: UserAccount): UserResponse {
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

  /** Insert an active demo account with its preset password hash and initial session version. */
  private seed(id: string, fullName: string, email: string, roles: Role[]): void {
    const now = new Date();
    this.users.set(id, {
      id,
      fullName,
      email,
      phone: null,
      roles: new Set(roles),
      status: UserStatus.ACTIVE,
      // Local demo account only: user@tms.local / User@123.
      // Keep only the scrypt hash here; never store the demo password in plaintext.
      passwordHash: id === 'user-1' ? 'scrypt$CAuJx3GTbSaQD/+w2L9JpQ==$7aBsAAwnaE4Nxx8+b5HBPokTl5hR7I8Xp4VTgbLxPo6sSUM5rS3wOctIoqyeKXuPEqUda/01dXXi4tGKE6RgCw==' : '$2b$12$rMB1aRUHcY.DtzrdLekgBe8.pj2MkxPLQQKxurasaQrpoW8jbkl0G',
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
