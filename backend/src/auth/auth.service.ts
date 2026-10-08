import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { AuthUsersService } from '../auth-users/auth-users.service';
import { User } from '../auth-users/user.entity';
import { randomUUID } from 'node:crypto';
import { Role } from '../roles/role.types';
import { SessionRegistry } from '../sessions/session-registry.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: AuthUsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessions?: SessionRegistry,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email, true);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }
    return this.issueTokens(user, dto.remember);
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-only-refresh-secret-change-me-32-chars',
      });
      const user = await this.usersService.findById(payload.sub, true);
      if (!user.refreshTokenHash || !(await bcrypt.compare(dto.refreshToken, user.refreshTokenHash))) {
        throw new UnauthorizedException('Refresh token không hợp lệ.');
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.');
    }
  }

  async logout(userId: string, sessionId?: string) {
    await this.usersService.setRefreshTokenHash(userId, null);
    if (sessionId) this.sessions?.revokeSession(userId, sessionId);
    return { message: 'Đăng xuất thành công.' };
  }

  private rolesFor(user: User): Role[] {
    if (user.id === 'admin-1' || user.email === 'admin@tms.local') return [Role.ADMIN];
    if (user.id === 'user-1' || user.email === 'user@tms.local') return [Role.INSTRUCTOR];
    return [];
  }
  private async issueTokens(user: User, remember = false) {
    const payload = { sub: user.id, email: user.email, sid: randomUUID(), roles: this.rolesFor(user) };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-only-access-secret-change-me-32-chars',
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-only-refresh-secret-change-me-32-chars',
      expiresIn: (remember ? this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') : '1d') as JwtSignOptions['expiresIn'],
    });
    await this.usersService.setRefreshTokenHash(user.id, refreshToken);
    this.sessions?.registerSession(user.id, payload.sid);
    return { data: { accessToken, refreshToken, user: this.usersService.toPublic(user) } };
  }
}
