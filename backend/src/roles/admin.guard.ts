import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Role } from './role.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.actor?.roles.has(Role.ADMIN)) {
      throw new ForbiddenException('Only system administrators can manage user roles');
    }
    return true;
  }
}
