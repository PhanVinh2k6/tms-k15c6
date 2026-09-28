import { Role } from '../roles/role.types';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  roles: Role[];
  failedLoginAttempts: number;
  lockedUntil: number | null;
}

export type PublicUser = Omit<UserRecord, 'passwordHash' | 'failedLoginAttempts' | 'lockedUntil'>;
