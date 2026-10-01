import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import {
  REQUIRED_PERMISSION_KEY,
} from './require-permission.decorator';
import { Permission } from './permission.types';
import { ROLE_PERMISSIONS } from './role-permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<Permission>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Chức năng này chưa được cấp quyền.',
      });
    }

    const request = context.switchToHttp().getRequest<Request>();
    const roles = request.actor?.roles;

    if (!roles || roles.size === 0) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền thực hiện thao tác này.',
      });
    }

    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role];

      if (permissions?.has(permission)) {
        return true;
      }
    }

    throw new ForbiddenException({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Bạn không có quyền thực hiện thao tác này.',
    });
  }
}
