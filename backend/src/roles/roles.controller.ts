import { BadRequestException, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PermissionGuard } from './permission.guard';
import { Permission } from './permission.types';
import { RequirePermission } from './require-permission.decorator';
import { Role } from './role.types';
import { RolesService } from './roles.service';

@Controller('users/:userId/roles')
@UseGuards(PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission(Permission.ROLE_READ)
  getRoles(@Param('userId') userId: string) {
    return { userId, roles: this.rolesService.listRoles(userId) };
  }

  @Post(':role')
  @RequirePermission(Permission.ROLE_WRITE)
  assignRole(@Param('userId') userId: string, @Param('role') role: string) {
    return { userId, roles: this.rolesService.assignRole(userId, this.parseRole(role)) };
  }

  @Delete(':role')
  @RequirePermission(Permission.ROLE_WRITE)
  revokeRole(@Req() request: Request, @Param('userId') userId: string, @Param('role') role: string) {
    return {
      userId,
      roles: this.rolesService.revokeRole(request.actor!.id, userId, this.parseRole(role)),
    };
  }

  private parseRole(value: string): Role {
    const normalized = value.toUpperCase() as Role;
    if (!Object.values(Role).includes(normalized)) {
      throw new BadRequestException(`Unsupported role: ${value}`);
    }
    return normalized;
  }
}
