import { useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import './App.css'

type PermissionAction = 'view' | 'create' | 'edit' | 'delete'
type PermissionId =
  | 'courses'
  | 'classes'
  | 'students'
  | 'enrollment'
  | 'attendance'
  | 'grades'
  | 'tuition'
  | 'reports'
  | 'users'

type PermissionItem = {
  id: PermissionId
  title: string
  description: string
  icon: LucideIcon
}

type PermissionSet = Record<PermissionId, Record<PermissionAction, boolean>>

const permissionGroups: { label: string; items: PermissionItem[] }[] = [
  {
    label: 'Đào tạo',
    items: [
      { id: 'courses', title: 'Khóa học', description: 'Nội dung và danh mục khóa học', icon: BookOpen },
      { id: 'classes', title: 'Lớp học', description: 'Lịch học và phân công lớp', icon: Layers3 },
      { id: 'students', title: 'Học viên', description: 'Hồ sơ và thông tin học viên', icon: Users },
      { id: 'enrollment', title: 'Ghi danh', description: 'Đăng ký và xếp lớp', icon: FileText },
    ],
  },
  {
    label: 'Học tập & kết quả',
    items: [
      { id: 'attendance', title: 'Điểm danh', description: 'Theo dõi chuyên cần', icon: CalendarDays },
      { id: 'grades', title: 'Điểm số', description: 'Nhập và quản lý kết quả học tập', icon: ChartNoAxesColumnIncreasing },
    ],
  },
  {
    label: 'Tài chính & hệ thống',
    items: [
      { id: 'tuition', title: 'Học phí', description: 'Biểu phí và thanh toán', icon: FileText },
      { id: 'reports', title: 'Báo cáo', description: 'Thống kê và xuất dữ liệu', icon: ChartNoAxesColumnIncreasing },
      { id: 'users', title: 'Người dùng', description: 'Tài khoản và quyền truy cập', icon: Users },
    ],
  },
]

const actions: { id: PermissionAction; label: string }[] = [
  { id: 'view', label: 'Xem' },
  { id: 'create', label: 'Thêm' },
  { id: 'edit', label: 'Sửa' },
  { id: 'delete', label: 'Xóa' },
]

const roles = [
  { id: 'guest', initials: 'KH', name: 'Khách', detail: 'Truy cập công khai', tint: 'lilac' },
  { id: 'student', initials: 'HV', name: 'Học viên', detail: '248 người dùng', tint: 'blue' },
  { id: 'teacher', initials: 'GV', name: 'Giảng viên', detail: '32 người dùng', tint: 'violet' },
  { id: 'assistant', initials: 'TG', name: 'Trợ giảng', detail: '18 người dùng', tint: 'coral' },
  { id: 'training', initials: 'QL', name: 'Quản lý đào tạo', detail: '6 người dùng', tint: 'mint' },
  { id: 'admissions', initials: 'TS', name: 'Tư vấn tuyển sinh', detail: '12 người dùng', tint: 'pink' },
  { id: 'accountant', initials: 'KT', name: 'Kế toán', detail: '5 người dùng', tint: 'orange' },
  { id: 'admin', initials: 'AD', name: 'Quản trị hệ thống', detail: '3 người dùng', tint: 'lilac' },
] as const

const allPermissionItems = permissionGroups.flatMap((group) => group.items)

function createPermissionSet(enabled: boolean): PermissionSet {
  return Object.fromEntries(
    allPermissionItems.map((item) => [
      item.id,
      Object.fromEntries(actions.map((action) => [action.id, enabled])),
    ]),
  ) as PermissionSet
}

const initialPermissions: Record<string, PermissionSet> = {
  guest: createPermissionSet(false),
  student: createPermissionSet(false),
  teacher: createPermissionSet(false),
  assistant: createPermissionSet(false),
  training: createPermissionSet(false),
  admissions: createPermissionSet(false),
  accountant: createPermissionSet(false),
  admin: createPermissionSet(true),
}

const permissionStorageKey = 'eduflow.permission-settings'

function loadPermissions(): Record<string, PermissionSet> {
  try {
    const storedPermissions = localStorage.getItem(permissionStorageKey)
    return storedPermissions
      ? { ...initialPermissions, ...(JSON.parse(storedPermissions) as Record<string, PermissionSet>) }
      : initialPermissions
  } catch {
    return initialPermissions
  }
}

function persistPermissions(nextPermissions: Record<string, PermissionSet>) {
  try {
    localStorage.setItem(permissionStorageKey, JSON.stringify(nextPermissions))
  } catch {
    return
  }
}

const navigation = [
  { label: 'Tổng quan', icon: LayoutDashboard },
  { label: 'Khóa học', icon: BookOpen },
  { label: 'Lớp học', icon: CalendarDays },
  { label: 'Học viên', icon: Users },
  { label: 'Báo cáo', icon: ChartNoAxesColumnIncreasing },
]

function App() {
  const [activeRole, setActiveRole] = useState<string>('admin')
  const [permissions, setPermissions] = useState(loadPermissions)
  const [savedPermissions, setSavedPermissions] = useState(loadPermissions)
  const [query, setQuery] = useState('')
  const [savedNotice, setSavedNotice] = useState(false)
  const [activeNav, setActiveNav] = useState('Vai trò & phân quyền')

  const selectedRole = roles.find((role) => role.id === activeRole) ?? roles[0]
  const currentPermissions = permissions[activeRole]
  const isDirty = JSON.stringify(currentPermissions) !== JSON.stringify(savedPermissions[activeRole])
  const enabledPermissionCount = allPermissionItems.reduce(
    (count, item) => count + actions.filter((action) => currentPermissions[item.id][action.id]).length,
    0,
  )
  const normalizedQuery = query.trim().toLocaleLowerCase('vi')

  function togglePermission(permissionId: PermissionId, action: PermissionAction) {
    setSavedNotice(false)
    setPermissions((current) => ({
      ...current,
      [activeRole]: {
        ...current[activeRole],
        [permissionId]: {
          ...current[activeRole][permissionId],
          [action]: !current[activeRole][permissionId][action],
        },
      },
    }))
  }

  function saveChanges() {
    const nextPermissions = { ...savedPermissions, [activeRole]: currentPermissions }
    persistPermissions(nextPermissions)
    setSavedPermissions(nextPermissions)
    setSavedNotice(true)
  }

  function discardChanges() {
    setPermissions((current) => ({ ...current, [activeRole]: savedPermissions[activeRole] }))
    setSavedNotice(false)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Eduflow, trang tổng quan">
          <span className="brand-mark"><Layers3 size={20} strokeWidth={2.5} /></span>
          <span className="brand-copy"><strong>eduflow.</strong><small>TRAINING PLATFORM</small></span>
        </a>

        <nav className="side-navigation" aria-label="Điều hướng chính">
          <p className="nav-caption">Không gian làm việc</p>
          {navigation.map(({ label, icon: Icon }) => (
            <button
              className={`nav-link${activeNav === label ? ' is-current' : ''}`}
              key={label}
              onClick={() => setActiveNav(label)}
              type="button"
            >
              <Icon size={16} /> <span>{label}</span>
            </button>
          ))}
          <p className="nav-caption nav-caption-spaced">Quản trị hệ thống</p>
          <button className={`nav-link${activeNav === 'Người dùng' ? ' is-current' : ''}`} onClick={() => setActiveNav('Người dùng')} type="button">
            <Users size={16} /><span>Người dùng</span>
          </button>
          <button className={`nav-link${activeNav === 'Vai trò & phân quyền' ? ' is-current' : ''}`} onClick={() => setActiveNav('Vai trò & phân quyền')} type="button">
            <ShieldCheck size={16} /><span>Vai trò & phân quyền</span><span className="nav-indicator" />
          </button>
          <button className={`nav-link${activeNav === 'Cài đặt' ? ' is-current' : ''}`} onClick={() => setActiveNav('Cài đặt')} type="button">
            <Settings size={16} /><span>Cài đặt</span>
          </button>
        </nav>

        <div className="security-note">
          <span className="security-icon"><ShieldCheck size={19} /></span>
          <strong>Bảo mật là ưu tiên</strong>
          <p>Kiểm soát truy cập rõ ràng cho từng vai trò trong hệ thống.</p>
          <div className="security-rings" />
        </div>

        <button className="profile-button" type="button">
          <span className="avatar avatar-profile">AD</span>
          <span className="profile-copy"><strong>Quản trị viên</strong><small>System Admin</small></span>
          <MoreHorizontal size={19} />
        </button>
      </aside>

      <main className="main-content">
        <div className="top-accent" />
        <div className="mobile-heading">
          <button className="mobile-brand" type="button"><span className="brand-mark"><Layers3 size={18} /></span><strong>eduflow.</strong></button>
          <button className="icon-button" type="button" aria-label="Mở cài đặt"><Settings size={18} /></button>
        </div>

        <div className="workspace">
          <section className="roles-panel" aria-labelledby="roles-heading">
            <div className="roles-heading">
              <div>
                <h1 id="roles-heading">Danh sách vai trò</h1>
                <p>Chọn vai trò để cấu hình quyền</p>
              </div>
              <span className="count-badge">{String(roles.length).padStart(2, '0')}</span>
            </div>
            <div className="role-list">
              {roles.map((role) => (
                <button
                  className={`role-option${activeRole === role.id ? ' is-selected' : ''}`}
                  key={role.id}
                  onClick={() => { setActiveRole(role.id); setSavedNotice(false) }}
                  type="button"
                  aria-pressed={activeRole === role.id}
                >
                  <span className={`avatar avatar-${role.tint}`}>{role.initials}</span>
                  <span className="role-copy"><strong>{role.name}</strong><small>{role.detail}</small></span>
                  <ChevronRight className="role-chevron" size={15} />
                </button>
              ))}
            </div>
          </section>

          <section className="permissions-panel" aria-labelledby="permission-heading">
            <header className="permission-header">
              <span className={`avatar avatar-${selectedRole.tint} avatar-large`}>{selectedRole.initials}</span>
              <div className="permission-title">
                <div className="title-line">
                  <h2 id="permission-heading">{selectedRole.name}</h2>
                  {selectedRole.id === 'admin' && <span className="admin-tag">Admin</span>}
                </div>
                <p>{selectedRole.id === 'admin' ? 'Toàn quyền quản trị hệ thống' : 'Quyền truy cập theo phân hệ'} <span className="title-divider">·</span> {enabledPermissionCount} quyền đang bật</p>
              </div>
              <span className="active-status"><span /> Đang hoạt động</span>
            </header>

            <div className="permission-tools">
              <div className="access-copy">
                <strong>Chi tiết quyền truy cập</strong>
                <span>Bật hoặc tắt quyền theo từng phân hệ</span>
              </div>
              <label className="search-field">
                <Search size={15} />
                <input
                  aria-label="Tìm phân hệ"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm phân hệ..."
                  type="search"
                  value={query}
                />
                {query && <button type="button" aria-label="Xóa nội dung tìm kiếm" onClick={() => setQuery('')}><X size={14} /></button>}
              </label>
            </div>

            <div className="permission-table-wrap">
              <table className="permission-table">
                <thead>
                  <tr>
                    <th scope="col">Phân hệ / chức năng</th>
                    {actions.map((action) => <th scope="col" key={action.id}>{action.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {permissionGroups.map((group) => {
                    const visibleItems = group.items.filter((item) =>
                      `${item.title} ${item.description} ${group.label}`.toLocaleLowerCase('vi').includes(normalizedQuery),
                    )

                    if (!visibleItems.length) return null

                    return (
                      <FragmentGroup key={group.label} label={group.label}>
                        {visibleItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <tr key={item.id}>
                              <th className="resource-cell" scope="row">
                                <span className="resource-icon"><Icon size={16} /></span>
                                <span className="resource-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
                              </th>
                              {actions.map((action) => (
                                <td key={action.id}>
                                  <label className="permission-checkbox" aria-label={`${action.label} ${item.title}`}>
                                    <input
                                      checked={currentPermissions[item.id][action.id]}
                                      onChange={() => togglePermission(item.id, action.id)}
                                      type="checkbox"
                                    />
                                    <span><Check size={12} strokeWidth={3} /></span>
                                  </label>
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </FragmentGroup>
                    )
                  })}
                  {allPermissionItems.every((item) => !`${item.title} ${item.description} ${permissionGroups.find((group) => group.items.includes(item))?.label}`.toLocaleLowerCase('vi').includes(normalizedQuery)) && (
                    <tr><td className="empty-search" colSpan={5}>Không tìm thấy phân hệ phù hợp.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="save-bar" aria-live="polite">
              <div className={`save-status${isDirty ? ' has-changes' : ''}`}>
                {savedNotice ? <Check size={15} /> : <Clock3 size={15} />}
                <span>{savedNotice ? 'Thay đổi đã được lưu.' : isDirty ? 'Bạn có thay đổi chưa được lưu.' : 'Thay đổi được lưu khi nhấn “Lưu thay đổi”.'}</span>
              </div>
              <div className="save-actions">
                <button className="discard-button" disabled={!isDirty} onClick={discardChanges} type="button">Hủy thay đổi</button>
                <button className="save-button" disabled={!isDirty} onClick={saveChanges} type="button">
                  <Check size={15} /> Lưu thay đổi
                </button>
              </div>
            </footer>
          </section>

          <aside className="policy-banner">
            <LockKeyhole size={16} />
            <p><strong>Quy tắc bảo vệ cố định:</strong> Giảng viên không thể sửa hoặc xóa học phí; Kế toán không thể thêm, sửa hoặc xóa điểm số. Quyền quản trị viên luôn được giữ nguyên.</p>
          </aside>
          <footer className="page-footer">Eduflow Admin Console <span>·</span> Cấu hình phân quyền được lưu trên trình duyệt này</footer>
        </div>
        <button className="help-button" type="button" aria-label="Trợ giúp"><CircleHelp size={17} /></button>
      </main>
    </div>
  )
}

function FragmentGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <tr className="group-row"><th colSpan={5} scope="colgroup">{label}</th></tr>
      {children}
    </>
  )
}

export default App
