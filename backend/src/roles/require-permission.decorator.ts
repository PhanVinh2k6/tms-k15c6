import { SetMetadata } from '@nestjs/common';
import { Permission } from './permission.types';

export const REQUIRED_PERMISSION_KEY = 'required_permission';

export const RequirePermission = (permission: Permission) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
