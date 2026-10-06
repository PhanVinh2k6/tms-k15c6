import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RegisterDto } from '../auth/auth.dto';
import { AuthUsersService } from './auth-users.service';
import { UpdateProfileDto } from './update-profile.dto';
import { User } from './user.entity';

type QueryBuilderStub = Pick<SelectQueryBuilder<User>, 'where' | 'addSelect' | 'getOne'>;

function makeRepository(existing: User | null = null) {
  const query: QueryBuilderStub = {
    where: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(existing),
  };
  const repository = {
    createQueryBuilder: jest.fn().mockReturnValue(query),
    create: jest.fn((input: Partial<User>) => ({ id: 'u-1', ...input }) as User),
    save: jest.fn(async (user: User) => user),
  } as unknown as Repository<User>;
  return { repository, query };
}

const registerDto: RegisterDto = {
  email: 'alice@example.com',
  fullName: ' Alice ',
  password: 'password-123',
};

function userFixture(): User {
  return {
    id: 'u-1',
    email: 'alice@example.com',
    fullName: 'Alice',
    passwordHash: 'secret-hash',
    phoneNumber: null,
    avatarUrl: null,
    bio: null,
    isActive: true,
    refreshTokenHash: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
}

describe('AuthUsersService', () => {
  it('creates a normalized user and never stores a plain password', async () => {
    const { repository } = makeRepository();
    const service = new AuthUsersService(repository);

    const created = await service.create(registerDto);

    expect(created.email).toBe('alice@example.com');
    expect(created.fullName).toBe('Alice');
    expect(created.passwordHash).not.toBe(registerDto.password);
    expect(repository.save).toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    const { repository } = makeRepository(userFixture());
    const service = new AuthUsersService(repository);

    await expect(service.create(registerDto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects missing or inactive users', async () => {
    const missing = new AuthUsersService(makeRepository().repository);
    await expect(missing.findById('missing')).rejects.toBeInstanceOf(NotFoundException);

    const inactive = userFixture();
    inactive.isActive = false;
    const service = new AuthUsersService(makeRepository(inactive).repository);
    await expect(service.findById(inactive.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates profile and strips secret fields from the public response', async () => {
    const user = userFixture();
    const { repository } = makeRepository(user);
    const service = new AuthUsersService(repository);
    const dto: UpdateProfileDto = { fullName: ' Updated ', bio: 'About me' };

    const result = await service.updateProfile(user.id, dto);

    expect(result).toMatchObject({ fullName: 'Updated', bio: 'About me' });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('refreshTokenHash');
  });

  it('hashes and clears refresh tokens', async () => {
    const user = userFixture();
    const { repository } = makeRepository(user);
    const service = new AuthUsersService(repository);

    await service.setRefreshTokenHash(user.id, 'refresh-token');
    expect(user.refreshTokenHash).not.toBe('refresh-token');
    await service.setRefreshTokenHash(user.id, null);
    expect(user.refreshTokenHash).toBeNull();
  });
});
