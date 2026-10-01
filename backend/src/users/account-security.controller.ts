import { Body, Controller, Patch, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Actor } from '../roles/role.types';
import { UsersService } from './users.service';
import { parseChangePassword } from './users.validation';

type AuthenticatedRequest = Request & { actor?: Actor };

/** Các thao tác chỉ dành cho tài khoản đang đăng nhập, không yêu cầu quyền Admin. */
@Controller('users/me')
export class AccountSecurityController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('password')
  changePassword(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const actor = request.actor;
    if (!actor) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập.' });
    }

    return this.usersService.changePassword(actor.id, parseChangePassword(body));
  }
}
