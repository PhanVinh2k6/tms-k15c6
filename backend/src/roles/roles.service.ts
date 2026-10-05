import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Role } from './role.types';

/**
 * Quản lý vai trò (S1-09). Không còn kho người dùng riêng: mọi thao tác đi qua UsersService (S1-08),
 * nên người dùng nào tạo được ở S1-08 thì gán / thu hồi vai trò được ở S1-09.
 * Người dùng không tồn tại → UsersService ném 404 USER_NOT_FOUND.
 */
@Injectable()
export class RolesService {
  constructor(private readonly usersService: UsersService) {}

  listRoles(userId: string): Role[] {
    return this.usersService.getRoles(userId);
  }

  assignRole(userId: string, role: Role): Role[] {
    return this.usersService.addRole(userId, role);
  }

  revokeRole(actorId: string, userId: string, role: Role): Role[] {
    if (actorId === userId && role === Role.ADMIN) {
      throw new BadRequestException('An administrator cannot revoke their own ADMIN role');
    }
    return this.usersService.removeRole(userId, role);
  }
}
