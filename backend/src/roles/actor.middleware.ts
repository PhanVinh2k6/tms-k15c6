import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SessionRegistry } from '../sessions/session-registry.service';
import { Actor, Role } from './role.types';

declare module 'express-serve-static-core' {
  interface Request {
    actor?: Actor;
  }
}

@Injectable()
export class ActorMiddleware implements NestMiddleware {
  constructor(private readonly sessions: SessionRegistry) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const id = req.header('x-user-id');
    const rawRoles = req.header('x-user-roles');
    const sessionId = req.header('x-session-id')?.trim();

    if (!id || !rawRoles) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập không hợp lệ.',
      });
    }

    const roles = new Set(
      rawRoles.split(',').map((role) => role.trim()).filter(Boolean) as Role[],
    );
    // Backward-compatible calls without a session ID share a legacy session.
    // Password changes still require an explicit ID so the current session is identifiable.
    this.sessions.registerSession(id, sessionId || `legacy:${id}`);
    req.actor = { id, roles, sessionId };
    next();
  }
}
