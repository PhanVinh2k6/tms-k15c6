/** Một lớp học mà tài khoản đang phụ trách (giảng viên, trợ giảng, quản lý đào tạo…). */
export interface AssignedClass {
  id: string;
  name: string;
}

/** Cảnh báo trả về khi khoá một tài khoản đang phụ trách lớp học (S1-10). */
export interface HandoverWarning {
  message: string;
  classes: AssignedClass[];
}

/**
 * Cầu nối giữa module Tài khoản và module Lớp học.
 *
 * Module Lớp học chưa có (dự kiến Sprint 3) nên bản mặc định bên dưới luôn trả về rỗng.
 * Khi có, chỉ cần thay `NoClassAssignmentLookup` trong ClassAssignmentModule bằng bản đọc
 * dữ liệu lớp thật — code khoá tài khoản không phải sửa.
 */
export abstract class ClassAssignmentLookup {
  abstract findClassesOf(userId: string): AssignedClass[] | Promise<AssignedClass[]>;
}

export class NoClassAssignmentLookup extends ClassAssignmentLookup {
  findClassesOf(): AssignedClass[] {
    return [];
  }
}

export function buildHandoverWarning(classes: AssignedClass[]): HandoverWarning | null {
  if (classes.length === 0) {
    return null;
  }
  const names = classes.map((item) => item.name).join(', ');
  return {
    message: `Tài khoản này đang phụ trách ${classes.length} lớp học (${names}). Cần bàn giao cho người khác.`,
    classes,
  };
}

/** Khoá xong rồi mà không đọc được danh sách lớp thì vẫn phải báo, để quản trị viên tự kiểm tra. */
export const HANDOVER_CHECK_FAILED: HandoverWarning = {
  message: 'Đã khoá tài khoản nhưng chưa kiểm tra được các lớp học tài khoản này phụ trách. Hãy kiểm tra và bàn giao thủ công.',
  classes: [],
};
