import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Actor, Role } from './role.types';

declare module 'express-serve-static-core' {
  interface Request {
    actor?: Actor;
  }
}

@Injectable()
export class ActorMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const id = req.header('x-user-id');
    const rawRoles = req.header('x-user-roles');

    if (!id || !rawRoles) {
      throw new UnauthorizedException('Missing authenticated user context');
    }

    const roles = new Set(
      rawRoles.split(',').map((role) => role.trim()).filter(Boolean) as Role[],
    );
    req.actor = { id, roles };
    next();
  }
}
