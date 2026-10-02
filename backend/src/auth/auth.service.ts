import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Role } from '../roles/role.types';
import { UsersService } from '../users/users.service';
import { PublicUser, UserRecord } from '../users/user.types';
import { SessionService } from './session/session.service';

export const LOGIN_ERROR = 'Email hoặc mật khẩu không đúng';
export const LOCKOUT_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: Role[];
  jti: string;
}

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  sessionId: string;
  user: PublicUser;
  redirectPath: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET ?? 'dev-only-change-this-secret';
  private readonly accessTokenTtlSeconds = 15 * 60;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      await bcrypt.compare(password, '$2b$12$ITd85cDlANk6vzdCj2UFku.ITgctth8L7ay1MxUlAV5sqPI19A0yu');
      throw new UnauthorizedException(LOGIN_ERROR);
    }

    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      throw new HttpException('Tài khoản tạm khóa trong 15 phút do đăng nhập sai quá nhiều lần', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (user.lockedUntil && user.lockedUntil <= Date.now()) {
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      }
      this.usersService.save(user);
      throw new UnauthorizedException(LOGIN_ERROR);
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    this.usersService.save(user);

    const session = this.sessionService.create(user.id, this.accessTokenTtlSeconds);
    const token = jwt.sign({ sub: user.id, email: user.email, roles: user.roles, jti: session.id }, this.jwtSecret, {
      expiresIn: this.accessTokenTtlSeconds,
    });

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtlSeconds,
      sessionId: session.id,
      user: this.toPublicUser(user),
      redirectPath: this.redirectForRoles(user.roles),
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as AccessTokenPayload;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  isSessionActive(payload: AccessTokenPayload): boolean {
    return this.sessionService.isActive(payload.jti, payload.sub);
  }

  getSession(sessionId: string, userId: string) {
    const session = this.sessionService.find(sessionId);
    if (!session || session.userId !== userId || !this.sessionService.isActive(sessionId, userId)) {
      throw new UnauthorizedException('Session không hợp lệ hoặc đã hết hạn');
    }
    return session;
  }

  revokeSession(sessionId: string, userId: string): void {
    this.sessionService.revoke(sessionId, userId);
  }

  listSessions(userId: string) {
    return this.sessionService.listForUser(userId);
  }

  getPublicUser(id: string): PublicUser {
    const user = this.usersService.findById(id);
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');
    return this.toPublicUser(user);
  }

  private toPublicUser(user: UserRecord): PublicUser {
    return { id: user.id, email: user.email, roles: user.roles };
  }

  private redirectForRoles(roles: Role[]): string {
    const priority: Array<[Role, string]> = [
      [Role.ADMIN, '/admin'],
      [Role.TRAINING_MANAGER, '/training-manager'],
      [Role.INSTRUCTOR, '/instructor'],
      [Role.TA, '/ta'],
      [Role.ADMISSIONS, '/admissions'],
      [Role.ACCOUNTANT, '/accounting'],
      [Role.STUDENT, '/student'],
    ];
    return priority.find(([role]) => roles.includes(role))?.[1] ?? '/';
  }
}
