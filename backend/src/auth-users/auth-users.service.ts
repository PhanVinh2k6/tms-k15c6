import { ConflictException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/auth.dto';
import { UpdateProfileDto } from './update-profile.dto';
import { User } from './user.entity';
export type PublicUser = Omit<User, 'passwordHash' | 'refreshTokenHash'>;

/** S1 local mode works without PostgreSQL; DATABASE_URL switches this service to PostgreSQL. */
@Injectable()
export class AuthUsersService {
  private readonly memoryUsers = new Map<string, User>();
  constructor(@Optional() @InjectRepository(User) private readonly users?: Repository<User>) {
    if (!this.users) {
      this.memoryUsers.set('admin-1', this.newUser('admin-1', 'admin@tms.local', 'Quản trị hệ thống', '$2b$12$rMB1aRUHcY.DtzrdLekgBe8.pj2MkxPLQQKxurasaQrpoW8jbkl0G'));
      this.memoryUsers.set('user-1', this.newUser('user-1', 'user@tms.local', 'Giảng viên mẫu', '$2b$12$a9SGqhSTOWtQ2GgLe0IBHOEuRJrKIesIIeCw9rhXkzYl6B5xm/8.2'));
    }
  }
  async findByEmail(email: string, includeSecrets = false): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    if (this.users) {
      const query = this.users.createQueryBuilder('user').where('LOWER(user.email) = LOWER(:email)', { email: normalized });
      if (includeSecrets) query.addSelect(['user.passwordHash', 'user.refreshTokenHash']);
      return query.getOne();
    }
    const user = [...this.memoryUsers.values()].find((item) => item.email === normalized);
    return user ? this.copyMemoryUser(user, includeSecrets) : null;
  }
  async findById(id: string, includeSecrets = false): Promise<User> {
    if (this.users) {
      const query = this.users.createQueryBuilder('user').where('user.id = :id', { id });
      if (includeSecrets) query.addSelect(['user.passwordHash', 'user.refreshTokenHash']);
      const user = await query.getOne();
      if (!user || !user.isActive) throw new NotFoundException('User không tồn tại hoặc đã bị khóa.');
      return user;
    }
    const user = this.memoryUsers.get(id);
    if (!user || !user.isActive) throw new NotFoundException('User không tồn tại hoặc đã bị khóa.');
    return this.copyMemoryUser(user, includeSecrets);
  }
  async create(dto: RegisterDto): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    if (await this.findByEmail(email)) throw new ConflictException('Email đã được sử dụng.');
    const user = this.newUser(randomUUID(), email, dto.fullName.trim(), await bcrypt.hash(dto.password, 12));
    if (this.users) return this.users.save(user);
    this.memoryUsers.set(user.id, user);
    return this.copyMemoryUser(user, true);
  }
  async updateProfile(id: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.findById(id);
    Object.assign(user, {
      ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
      ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber.trim() }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.bio !== undefined && { bio: dto.bio.trim() }),
    });
    const saved = this.users ? await this.users.save(user) : (this.memoryUsers.set(id, user), user);
    return this.toPublic(saved);
  }
  async setRefreshTokenHash(id: string, token: string | null): Promise<void> {
    const user = await this.findById(id, true);
    user.refreshTokenHash = token ? await bcrypt.hash(token, 12) : null;
    if (this.users) await this.users.save(user);
    else this.memoryUsers.set(id, user);
  }
  toPublic(user: User): PublicUser {
    const publicUser = { ...user } as Partial<User>;
    delete publicUser.passwordHash;
    delete publicUser.refreshTokenHash;
    return publicUser as PublicUser;
  }
  private newUser(id: string, email: string, fullName: string, passwordHash: string): User {
    return Object.assign(new User(), { id, email, fullName, passwordHash, phoneNumber: null, avatarUrl: null, bio: null, isActive: true, refreshTokenHash: null, createdAt: new Date(), updatedAt: new Date() });
  }
  private copyMemoryUser(user: User, includeSecrets: boolean): User {
    const copy = { ...user } as Partial<User>;
    if (!includeSecrets) { delete copy.passwordHash; delete copy.refreshTokenHash; }
    return copy as User;
  }
}
