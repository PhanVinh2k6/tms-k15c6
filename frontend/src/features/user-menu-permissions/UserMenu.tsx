import { useState } from 'react'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import './user-menu.css'

export type Permission =
  | 'dashboard.view'
  | 'courses.view'
  | 'classes.view'
  | 'students.view'
  | 'reports.view'
  | 'users.view'
  | 'settings.view'

type MenuItem = {
  label: string
  permission: Permission
  icon: LucideIcon
}

export type CurrentUser = {
  name: string
  role: string
  initials?: string
}

export type UserMenuProps = {
  user?: CurrentUser
  permissions?: Permission[]
  activePath?: string
  onNavigate?: (label: string) => void
}

const defaultUser: CurrentUser = {
  name: 'Nguyễn Văn An',
  role: 'Giảng viên',
}

const menuItems: MenuItem[] = [
  { label: 'Tổng quan', permission: 'dashboard.view', icon: LayoutDashboard },
  { label: 'Khóa học', permission: 'courses.view', icon: BookOpen },
  { label: 'Lớp học', permission: 'classes.view', icon: CalendarDays },
  { label: 'Học viên', permission: 'students.view', icon: Users },
  { label: 'Báo cáo', permission: 'reports.view', icon: BarChart3 },
  { label: 'Người dùng', permission: 'users.view', icon: UserRound },
  { label: 'Cài đặt', permission: 'settings.view', icon: Settings },
]

const defaultPermissions: Permission[] = [
  'dashboard.view',
  'courses.view',
  'classes.view',
  'students.view',
]

function getInitials(user: CurrentUser) {
  if (user.initials) return user.initials
  return user.name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function UserMenu({
  user = defaultUser,
  permissions = defaultPermissions,
  activePath = 'Tổng quan',
  onNavigate,
}: UserMenuProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const allowed = new Set(permissions)
  const visibleItems = menuItems.filter((item) => allowed.has(item.permission))

  function navigate(label: string) {
    onNavigate?.(label)
    setMobileOpen(false)
  }

  return (
    <div className="permission-shell">
      <header className="mobile-topbar">
        <button
          className="icon-button"
          type="button"
          aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <a className="compact-brand" href="#top" aria-label="TMS trang chủ">
          <span className="brand-symbol"><GraduationCap size={18} /></span>
          <strong>TMS.</strong>
        </a>
        <button className="mobile-avatar" type="button" aria-label={`Tài khoản ${user.name}`}>
          {getInitials(user)}
        </button>
      </header>

      <aside className={`permission-sidebar${mobileOpen ? ' is-open' : ''}`}>
        <div className="sidebar-head">
          <a className="brand-lockup" href="#top" aria-label="TMS trang chủ">
            <span className="brand-symbol"><GraduationCap size={20} /></span>
            <span><strong>TMS.</strong><small>TRAINING PLATFORM</small></span>
          </a>
          <button className="icon-button sidebar-close" type="button" aria-label="Đóng menu" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="permission-nav" aria-label="Điều hướng chính">
          <p className="nav-label">Không gian làm việc</p>
          {visibleItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={`nav-item${activePath === label ? ' is-active' : ''}`}
              onClick={() => navigate(label)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <ShieldCheck size={18} />
          <span>Menu được hiển thị theo quyền truy cập của bạn.</span>
        </div>

        <button className="account-card" type="button">
          <span className="account-avatar">{getInitials(user)}</span>
          <span className="account-copy">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </span>
          <ChevronDown size={17} aria-hidden="true" />
        </button>
      </aside>

      {mobileOpen && <button className="mobile-backdrop" type="button" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}

      <main className="permission-content" id="top">
        <div className="content-header">
          <div>
            <p className="eyebrow">KHÔNG GIAN LÀM VIỆC</p>
            <h1>Xin chào, {user.name.split(' ').slice(-1)[0]}!</h1>
            <p>Chọn một chức năng từ menu để bắt đầu.</p>
          </div>
          <div className="user-summary" aria-label={`Đang đăng nhập với tên ${user.name}, vai trò ${user.role}`}>
            <span className="summary-avatar">{getInitials(user)}</span>
            <span><strong>{user.name}</strong><small>{user.role}</small></span>
          </div>
        </div>

        <section className="permission-card" aria-labelledby="permission-heading">
          <div className="card-icon"><ShieldCheck size={22} /></div>
          <div>
            <h2 id="permission-heading">Bạn đang xem menu phù hợp với quyền của mình</h2>
            <p>{visibleItems.length} chức năng đang khả dụng. Các chức năng không thuộc quyền đã được ẩn khỏi menu.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
