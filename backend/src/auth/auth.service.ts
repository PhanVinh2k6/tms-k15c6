import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { AuthUsersService } from '../auth-users/auth-users.service';
import { User } from '../auth-users/user.entity';
import { Role } from '../roles/role.types';
import { SessionRegistry } from '../sessions/session-registry.service';
import { UsersService } from '../users/users.service';
import { UserAccount, UserStatus } from '../users/user.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authUsers: AuthUsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Optional() private readonly sessions?: SessionRegistry,
    @Optional() private readonly managedUsers?: UsersService,
  ) {}

  async register(dto: RegisterDto) { return this.issueTokens(await this.authUsers.create(dto)); }

  async login(dto: LoginDto) {
    if (this.managedUsers) {
      const user = this.managedUsers.findByEmailForAuth(dto.email);
      const valid = user && this.managedUsers.isLoginAllowed(user) && await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) {
        if (user && user.status === UserStatus.ACTIVE) this.managedUsers.recordFailedLogin(user.id);
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
      }
      this.managedUsers.clearFailedLogins(user.id);
      return this.issueTokens(user, dto.remember);
    }
    const user = await this.authUsers.findByEmail(dto.email, true);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    return this.issueTokens(user, dto.remember);
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; email: string; sessionVersion?: number }>(dto.refreshToken, { secret: this.refreshSecret() });
      const user = this.managedUsers?.getAuthState(payload.sub);
      if (user) {
        const account = this.managedUsers!.findByEmailForAuth(user.email);
        if (!account || !this.managedUsers!.isLoginAllowed(account) || payload.sessionVersion !== user.sessionVersion) throw new Error('invalid session');
        return this.issueTokens(account);
      }
      const legacy = await this.authUsers.findById(payload.sub, true);
      return this.issueTokens(legacy);
    } catch { throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.'); }
  }

  async logout(userId: string, sessionId?: string) {
    if (this.managedUsers) { this.managedUsers.revokeAllSessions(userId); this.sessions?.revokeAllSessions(userId); }
    else await this.authUsers.setRefreshTokenHash(userId, null);
    if (sessionId) this.sessions?.revokeSession(userId, sessionId);
    return { message: 'Đăng xuất thành công.' };
  }

  private async issueTokens(user: User | UserAccount, remember = false) {
    const managed = this.isManaged(user);
    const id = user.id;
    const email = user.email;
    const roles = managed ? [...user.roles] : this.legacyRoles(user as User);
    const sessionVersion = managed ? user.sessionVersion : undefined;
    const payload = { sub: id, email, sid: randomUUID(), roles, ...(sessionVersion !== undefined ? { sessionVersion } : {}) };
    const accessToken = await this.jwtService.signAsync(payload, { secret: this.accessSecret(), expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as JwtSignOptions['expiresIn'] });
    const refreshToken = await this.jwtService.signAsync(payload, { secret: this.refreshSecret(), expiresIn: (remember ? this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') : '1d') as JwtSignOptions['expiresIn'] });
    if (managed) this.sessions?.registerSession(id, payload.sid);
    else await this.authUsers.setRefreshTokenHash(id, refreshToken);
    const publicUser = managed ? this.managedUsers!.toResponse(user as UserAccount) : this.authUsers.toPublic(user as User);
    return { data: { accessToken, refreshToken, user: publicUser } };
  }

  private isManaged(user: User | UserAccount): user is UserAccount { return 'roles' in user && user.roles instanceof Set; }
  private legacyRoles(user: User): Role[] { return user.id === 'admin-1' || user.email === 'admin@tms.local' ? [Role.ADMIN] : user.id === 'user-1' ? [Role.INSTRUCTOR] : []; }
  private accessSecret(): string { return this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-only-access-secret-change-me-32-chars'; }
  private refreshSecret(): string { return this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-only-refresh-secret-change-me-32-chars'; }
}
