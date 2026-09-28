import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '../roles/role.types';
import { UserRecord } from './user.types';

@Injectable()
export class UsersService {
  private readonly users = new Map<string, UserRecord>();

  constructor() {
    // Development seeds only. Production should load these records from PostgreSQL.
    this.addSeed('admin-1', 'admin@tms.local', 'Admin123!', [Role.ADMIN]);
    this.addSeed('user-1', 'user@tms.local', 'User123!', [Role.INSTRUCTOR]);
    this.addSeed('student-1', 'student@tms.local', 'Student123!', [Role.STUDENT]);
  }

  findByEmail(email: string): UserRecord | undefined {
    return this.users.get(email.trim().toLowerCase());
  }

  findById(id: string): UserRecord | undefined {
    return [...this.users.values()].find((user) => user.id === id);
  }

  save(user: UserRecord): UserRecord {
    this.users.set(user.email, user);
    return user;
  }

  private addSeed(id: string, email: string, password: string, roles: Role[]): void {
    const normalizedEmail = email.toLowerCase();
    this.users.set(normalizedEmail, {
      id,
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(password, 12),
      roles,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }
}
