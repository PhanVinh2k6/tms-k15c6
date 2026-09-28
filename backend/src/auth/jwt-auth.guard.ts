import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: { id: string; email: string; roles: string[] };
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.header('authorization');
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Thiếu access token');
    const payload = this.authService.verifyAccessToken(header.slice(7));
    request.authUser = { id: payload.sub, email: payload.email, roles: payload.roles };
    return true;
  }
}
