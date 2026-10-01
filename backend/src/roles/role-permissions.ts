import { Permission } from './permission.types';
import { Role } from './role.types';

export const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  [Role.ADMIN]: new Set(Object.values(Permission)),

  [Role.INSTRUCTOR]: new Set([
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_WRITE,
    Permission.ASSIGNMENT_READ,
    Permission.ASSIGNMENT_WRITE,
    Permission.GRADE_READ,
    Permission.GRADE_WRITE,
    Permission.CLASS_READ,
  ]),

  [Role.TA]: new Set([
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_WRITE,
    Permission.ASSIGNMENT_READ,
    Permission.ASSIGNMENT_WRITE,
    Permission.GRADE_READ,
    Permission.CLASS_READ,
  ]),

  [Role.TRAINING_MANAGER]: new Set([
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.ROLE_READ,
    Permission.ROLE_WRITE,
    Permission.ATTENDANCE_READ,
    Permission.ASSIGNMENT_READ,
    Permission.ASSIGNMENT_WRITE,
    Permission.GRADE_READ,
    Permission.GRADE_WRITE,
    Permission.TUITION_READ,
    Permission.CLASS_READ,
    Permission.CLASS_WRITE,
    Permission.REPORT_READ,
  ]),

  [Role.ADMISSIONS]: new Set([
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.CLASS_READ,
    Permission.TUITION_READ,
    Permission.REPORT_READ,
  ]),

  [Role.ACCOUNTANT]: new Set([
    Permission.TUITION_READ,
    Permission.TUITION_WRITE,
    Permission.USER_READ,
    Permission.REPORT_READ,
  ]),

  [Role.STUDENT]: new Set([
    Permission.ATTENDANCE_READ,
    Permission.ASSIGNMENT_READ,
    Permission.GRADE_READ,
    Permission.TUITION_READ,
    Permission.CLASS_READ,
  ]),

  [Role.GUEST]: new Set([]),
};
