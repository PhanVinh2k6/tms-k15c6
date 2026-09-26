import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from './role.types';

@Injectable()
export class RolesService {
  private readonly users = new Map<string, User>([
    ['admin-1', { id: 'admin-1', email: 'admin@tms.local', roles: new Set([Role.ADMIN]) }],
    ['user-1', { id: 'user-1', email: 'user@tms.local', roles: new Set([Role.INSTRUCTOR]) }],
  ]);

  listRoles(userId: string): Role[] {
    return [...this.getUser(userId).roles].sort();
  }

  assignRole(userId: string, role: Role): Role[] {
    const user = this.getUser(userId);
    user.roles.add(role);
    return this.listRoles(userId);
  }

  revokeRole(actorId: string, userId: string, role: Role): Role[] {
    const user = this.getUser(userId);
    if (actorId === userId && role === Role.ADMIN) {
      throw new BadRequestException('An administrator cannot revoke their own ADMIN role');
    }
    user.roles.delete(role);
    return this.listRoles(userId);
  }

  private getUser(userId: string): User {
    const user = this.users.get(userId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }
}
