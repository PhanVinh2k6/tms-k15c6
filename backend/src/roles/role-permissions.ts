import { Permission } from './permission.types';
import { Role } from './role.types';

/** Quyền ADMIN không tự động có (xem ghi chú ma trận bên dưới). */
const ADMIN_EXCLUDED: Permission[] = [Permission.LEAD_DELETE];

/**
 * Ma trận quyền (S1-05). Mặc định từ chối: vai trò không liệt kê quyền nào thì không được làm gì.
 * USER_WRITE, ROLE_READ, ROLE_WRITE chỉ dành cho ADMIN — tránh việc vai trò khác tự cấp quyền Admin cho mình.
 * LEAD_DELETE chỉ dành cho TRAINING_MANAGER (S2-09 AC3: "Chỉ Quản lý đào tạo được xoá lead") — kể cả ADMIN cũng không có.
 */
export const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  [Role.ADMIN]: new Set(Object.values(Permission).filter((permission) => !ADMIN_EXCLUDED.includes(permission))),

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
    Permission.ATTENDANCE_READ,
    Permission.ASSIGNMENT_READ,
    Permission.ASSIGNMENT_WRITE,
    Permission.GRADE_READ,
    Permission.GRADE_WRITE,
    Permission.TUITION_READ,
    Permission.CLASS_READ,
    Permission.CLASS_WRITE,
    Permission.REPORT_READ,
    Permission.LEAD_READ,
    Permission.LEAD_DELETE,
  ]),

  [Role.ADMISSIONS]: new Set([
    Permission.USER_READ,
    Permission.CLASS_READ,
    Permission.TUITION_READ,
    Permission.REPORT_READ,
    Permission.LEAD_READ,
    Permission.LEAD_WRITE,
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
