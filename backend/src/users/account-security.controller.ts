import { Body, Controller, Patch, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Actor } from '../roles/role.types';
import { SessionRegistry } from '../sessions/session-registry.service';
import { UsersService } from './users.service';
import { parseChangePassword } from './users.validation';

type AuthenticatedRequest = Request & { actor?: Actor };

/** Các thao tác chỉ dành cho tài khoản đang đăng nhập, không yêu cầu quyền Admin. */
@Controller('users/me')
export class AccountSecurityController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessions: SessionRegistry,
  ) {}

  @Patch('password')
  async changePassword(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const actor = request.actor;
    if (!actor) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập.' });
    }
    if (!actor.sessionId) {
      throw new UnauthorizedException({
        code: 'SESSION_ID_REQUIRED',
        message: 'Thiếu định danh phiên đăng nhập. Vui lòng đăng nhập lại.',
      });
    }

    const result = await this.usersService.changePassword(actor.id, parseChangePassword(body));
    const revokedOtherSessions = this.sessions.revokeOtherSessions(actor.id, actor.sessionId);
    return { ...result, revokedOtherSessions };
  }
}
