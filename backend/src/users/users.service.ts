import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/auth.dto';
import { UpdateProfileDto } from './update-profile.dto';
import { User } from './user.entity';

export type PublicUser = Omit<User, 'passwordHash' | 'refreshTokenHash'>;

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async findByEmail(email: string, includeSecrets = false): Promise<User | null> {
    const query = this.users.createQueryBuilder('user').where('LOWER(user.email) = LOWER(:email)', { email });
    if (includeSecrets) query.addSelect(['user.passwordHash', 'user.refreshTokenHash']);
    return query.getOne();
  }

  async findById(id: string, includeSecrets = false): Promise<User> {
    const query = this.users.createQueryBuilder('user').where('user.id = :id', { id });
    if (includeSecrets) query.addSelect(['user.passwordHash', 'user.refreshTokenHash']);
    const user = await query.getOne();
    if (!user || !user.isActive) throw new NotFoundException('User không tồn tại hoặc đã bị khóa.');
    return user;
  }

  async create(dto: RegisterDto): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    if (await this.findByEmail(email)) throw new ConflictException('Email đã được sử dụng.');
    const user = this.users.create({
      email,
      fullName: dto.fullName.trim(),
      passwordHash: await bcrypt.hash(dto.password, 12),
      phoneNumber: null,
      avatarUrl: null,
      bio: null,
      isActive: true,
      refreshTokenHash: null,
    });
    return this.users.save(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.findById(id);
    Object.assign(user, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
      ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber.trim() }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.bio !== undefined && { bio: dto.bio.trim() }),
    });
    const saved = await this.users.save(user);
    return this.toPublic(saved);
  }

  async setRefreshTokenHash(id: string, token: string | null): Promise<void> {
    const user = await this.findById(id, true);
    user.refreshTokenHash = token ? await bcrypt.hash(token, 12) : null;
    await this.users.save(user);
  }

  toPublic(user: User): PublicUser {
    const publicUser = { ...user } as Partial<User>;
    delete publicUser.passwordHash;
    delete publicUser.refreshTokenHash;
    return publicUser as PublicUser;
  }
}
