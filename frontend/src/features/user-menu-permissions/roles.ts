import type { Permission } from './UserMenu'

export type DemoRole = {
  id: string
  name: string
  role: string
  roleCode: string
  permissions: Permission[]
}

export const demoRoles: DemoRole[] = [
  { id: 'guest', name: 'Khách truy cập', role: 'Khách truy cập', roleCode: 'Guest', permissions: ['dashboard.view'] },
  { id: 'student', name: 'Trần Minh Anh', role: 'Học viên', roleCode: 'Student', permissions: ['dashboard.view', 'courses.view', 'classes.view'] },
  { id: 'instructor', name: 'Nguyễn Văn An', role: 'Giảng viên', roleCode: 'Instructor', permissions: ['dashboard.view', 'courses.view', 'classes.view', 'students.view', 'reports.view'] },
  { id: 'ta', name: 'Phạm Minh Tú', role: 'Trợ giảng', roleCode: 'TA', permissions: ['dashboard.view', 'classes.view', 'students.view'] },
  { id: 'training', name: 'Lê Thu Hà', role: 'Quản lý đào tạo', roleCode: 'Training Manager', permissions: ['dashboard.view', 'courses.view', 'classes.view', 'students.view', 'reports.view'] },
  { id: 'admissions', name: 'Đỗ Hoàng Mai', role: 'Tư vấn tuyển sinh', roleCode: 'Admissions', permissions: ['dashboard.view', 'courses.view', 'students.view'] },
  { id: 'accountant', name: 'Vũ Đức Long', role: 'Kế toán', roleCode: 'Accountant', permissions: ['dashboard.view', 'reports.view'] },
  { id: 'admin', name: 'Lê Hoàng Nam', role: 'Quản trị hệ thống', roleCode: 'Admin', permissions: ['dashboard.view', 'courses.view', 'classes.view', 'students.view', 'reports.view', 'users.view', 'settings.view'] },
]
