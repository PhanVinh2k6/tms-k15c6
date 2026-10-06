import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
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

  async logout(userId: string) {
    await this.usersService.setRefreshTokenHash(userId, null);
    return { message: 'Đăng xuất thành công.' };
  }

  private async issueTokens(user: User, remember = false) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: remember ? this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') : '1d',
    });
    await this.usersService.setRefreshTokenHash(user.id, refreshToken);
    return { data: { accessToken, refreshToken, user: this.usersService.toPublic(user) } };
  }
}
