import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /** Configure Passport to read Bearer JWTs and verify their signature and expiry. */
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-only-access-secret-change-me-32-chars',
      ignoreExpiration: false,
    });
  }

  /** Project a verified JWT into the request user, defaulting missing roles to an empty list. */
  validate(payload: { sub: string; email: string; sid?: string; roles?: string[] }) {
    return { sub: payload.sub, email: payload.email, sid: payload.sid, roles: payload.roles ?? [] };
  }
}
