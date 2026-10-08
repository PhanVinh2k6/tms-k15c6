import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { SessionRegistry } from '../sessions/session-registry.service';
import { Actor, Role } from './role.types';
declare module 'express-serve-static-core' { interface Request { actor?: Actor } }
type AccessPayload = { sub: string; email: string; roles?: Role[]; sid?: string };
@Injectable()
export class ActorMiddleware implements NestMiddleware {
  constructor(private readonly sessions: SessionRegistry, private readonly jwt: JwtService, private readonly config: ConfigService) {}
  async use(req: Request, _res: Response, next: NextFunction) {
    // Header identity is retained only for isolated e2e tests; production requests must carry JWT.
    if (process.env.NODE_ENV === 'test') {
      const id = req.header('x-user-id');
      const rawRoles = req.header('x-user-roles');
      if (!id || !rawRoles) throw this.unauthorized();
      const roles = new Set(rawRoles.split(',').map((role) => role.trim()).filter(Boolean) as Role[]);
      const sessionId = req.header('x-session-id')?.trim();
      this.sessions.registerSession(id, sessionId || `legacy:${id}`);
      req.actor = { id, roles, sessionId };
      next();
      return;
    }
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw this.unauthorized();
    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-only-access-secret-change-me-32-chars',
      });
      if (!payload.sub || !payload.sid || !Array.isArray(payload.roles)) throw this.unauthorized();
      const roles = new Set(payload.roles.filter((role) => Object.values(Role).includes(role)));
      this.sessions.registerSession(payload.sub, payload.sid);
      req.actor = { id: payload.sub, roles, sessionId: payload.sid };
      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw this.unauthorized();
    }
  }
  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Bạn chưa đăng nhập hoặc phiên đăng nhập không hợp lệ.' });
  }
}
