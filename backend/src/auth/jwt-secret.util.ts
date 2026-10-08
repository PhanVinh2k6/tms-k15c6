import { ConfigService } from '@nestjs/config';

export type JwtSecretKey = 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET';

/** Read a JWT secret, allowing predictable defaults only in non-production environments. */
export function jwtSecret(config: ConfigService, key: JwtSecretKey): string {
  const value = config.get<string>(key);
  if (value) return value;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return `dev-only-${key}-change-me-32-chars`;
  }
  throw new Error(`${key} must be configured outside development and test environments.`);
}
