import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { AuthUsersService } from '../auth-users/auth-users.service';
import { User } from '../auth-users/user.entity';

function userFixture(): User {
  return {
    id: 'u-1',
    email: 'alice@example.com',
    fullName: 'Alice',
    passwordHash: '',
    phoneNumber: null,
    avatarUrl: null,
    bio: null,
    isActive: true,
    refreshTokenHash: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

function makeService(user = userFixture()) {
  const usersService = {
    create: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn().mockResolvedValue(user),
    findById: jest.fn().mockResolvedValue(user),
    setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    toPublic: jest.fn((value: User) => ({ id: value.id, email: value.email })),
  } as unknown as AuthUsersService;
  const jwtService = {
    signAsync: jest.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: user.id, email: user.email }),
  } as unknown as JwtService;
  const config = {
    getOrThrow: jest.fn((key: string) => (key === 'JWT_REFRESH_SECRET' ? 'refresh-secret' : 'access-secret')),
    get: jest.fn((key: string, fallback: string) => fallback),
  } as unknown as ConfigService;
  return { service: new AuthService(usersService, jwtService, config), usersService, jwtService };
}

describe('AuthService', () => {
  it('registers a user and returns an access/refresh token pair', async () => {
    const { service, usersService } = makeService();
    const dto: RegisterDto = { email: 'alice@example.com', fullName: 'Alice', password: 'password-123' };

    const result = await service.register(dto);

    expect(usersService.create).toHaveBeenCalledWith(dto);
    expect(result.data).toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('logs in with a valid password', async () => {
    const user = userFixture();
    user.passwordHash = await bcrypt.hash('password-123', 4);
    const { service, usersService } = makeService(user);
    const dto: LoginDto = { email: user.email, password: 'password-123', remember: true };

    await expect(service.login(dto)).resolves.toHaveProperty('data.accessToken', 'access-token');
    expect(usersService.findByEmail).toHaveBeenCalledWith(user.email, true);
  });

  it('rejects an invalid login', async () => {
    const user = userFixture();
    user.passwordHash = await bcrypt.hash('different-password', 4);
    const { service } = makeService(user);
    const dto: LoginDto = { email: user.email, password: 'wrong-password', remember: false };

    await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes and logs out a session', async () => {
    const user = userFixture();
    user.refreshTokenHash = await bcrypt.hash('old-refresh', 4);
    const { service, usersService, jwtService } = makeService(user);
    const dto: RefreshTokenDto = { refreshToken: 'old-refresh' };

    await expect(service.refresh(dto)).resolves.toHaveProperty('data.accessToken', 'access-token');
    await service.logout(user.id);

    expect(jwtService.verifyAsync).toHaveBeenCalled();
    expect(usersService.setRefreshTokenHash).toHaveBeenCalledWith(user.id, null);
  });
});
