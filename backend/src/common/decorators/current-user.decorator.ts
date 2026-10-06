import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string };
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => (ctx.switchToHttp().getRequest<AuthenticatedRequest>()).user,
);
