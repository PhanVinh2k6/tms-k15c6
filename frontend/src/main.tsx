import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { assignRole, getRoles, getUsers, revokeRole, type Role, type UserRecord } from './api'
import {
  ArrowLeft,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import './styles.css'

function App() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [roleCatalog, setRoleCatalog] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tất cả vai trò')
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [toast, setToast] = useState('')

  const loadData = async () => {
    setLoading(true)
    setApiError('')
    try {
      const [loadedUsers, loadedRoles] = await Promise.all([getUsers(), getRoles()])
      setUsers(loadedUsers)
      setRoleCatalog(loadedRoles)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Không thể tải dữ liệu từ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())
    const matchesRole = roleFilter === 'Tất cả vai trò' || user.roles.some((role) => role.label === roleFilter)
    return matchesQuery && matchesRole
  }), [users, query, roleFilter])

  const updateUser = (updated: UserRecord) => setUsers((current) => current.map((user) => user.id === updated.id ? updated : user))
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }

  const removeRole = async (user: UserRecord, roleId: string) => {
    setSaving(true)
    try {
      await revokeRole(user.id, roleId)
      const updated = { ...user, roles: user.roles.filter((role) => role.id !== roleId) }
      updateUser(updated)
      setSelectedUser(updated)
      notify('Đã thu hồi vai trò khỏi người dùng')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Thu hồi vai trò thất bại')
    } finally { setSaving(false) }
  }

  const addRole = async (role: Role) => {
    if (!selectedUser || selectedUser.roles.some((current) => current.id === role.id)) return
    setSaving(true)
    try {
      await assignRole(selectedUser.id, role.id)
      const updated = { ...selectedUser, roles: [...selectedUser.roles, role] }
      updateUser(updated)
      setSelectedUser(updated)
      setShowRoleMenu(false)
      notify('Đã gán vai trò mới thành công')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Gán vai trò thất bại')
    } finally { setSaving(false) }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><GraduationCap size={20} strokeWidth={2.4} /></div><div><strong>eduflow.</strong><span>QUẢN LÝ ĐÀO TẠO</span></div></div>
        <div className="side-section"><p className="side-label">KHÔNG GIAN LÀM VIỆC</p><NavItem icon={<LayoutDashboard />} label="Tổng quan" /><NavItem icon={<BookOpen />} label="Khóa học" /><NavItem icon={<BriefcaseBusiness />} label="Lớp học" /><NavItem icon={<Users />} label="Học viên" /><NavItem icon={<SlidersHorizontal />} label="Báo cáo" /></div>
        <div className="side-section management"><p className="side-label">QUẢN TRỊ HỆ THỐNG</p><NavItem icon={<Users />} label="Người dùng" /><NavItem icon={<ShieldCheck />} label="Vai trò & phân quyền" active /><NavItem icon={<Settings />} label="Cài đặt" /></div>
        <div className="support-card"><CircleHelp size={18} /><div><strong>Cần hỗ trợ?</strong><span>Liên hệ quản trị viên để được hướng dẫn sử dụng hệ thống.</span><a href="#">Trung tâm trợ giúp ↗</a></div></div>
        <div className="workspace-switch"><div className="workspace-icon">◉</div><div><strong>Trung tâm đào tạo</strong><span>Không gian làm việc</span></div><ChevronDown size={15} /></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div><h1>HỆ THỐNG QUẢN LÝ ĐÀO TẠO</h1><p>Quản lý tập trung, vận hành hiệu quả</p></div><div className="top-actions"><button className="icon-button" aria-label="Thông báo"><Bell size={18} /><i /></button><div className="user-menu"><div className="avatar lavender">MA</div><div><strong>Nguyễn Minh Anh</strong><span>Chuyên viên đào tạo</span></div><ChevronDown size={15} /></div></div></header>
        <div className="content">
          <div className="breadcrumbs"><span>Trang chủ</span><ChevronRight size={13} /><span>Quản trị hệ thống</span><ChevronRight size={13} /><strong>Gán vai trò</strong></div>
          {apiError && <div className="api-alert"><span>Không thể kết nối backend: {apiError}</span><button onClick={() => void loadData()}>Thử lại</button></div>}
          <section className="page-heading"><div><div className="eyebrow"><ShieldCheck size={15} /> PHÂN QUYỀN NGƯỜI DÙNG</div><h2>Gán và thu hồi vai trò</h2><p>Quản lý quyền truy cập của thành viên trong hệ thống đào tạo.</p></div><button className="primary-button" disabled={!users.length || loading} onClick={() => { setSelectedUser(users[0]); setShowRoleMenu(true) }}><Plus size={17} /> Gán vai trò mới</button></section>
          <section className="stats-grid"><StatCard label="Tổng người dùng" value="128" detail="Tăng 8% so với tháng trước" tone="purple" icon={<Users />} /><StatCard label="Đang hoạt động" value="124" detail="96,9% tổng số tài khoản" tone="green" icon={<Check />} /><StatCard label="Vai trò hệ thống" value="8" detail="Được cấu hình trong hệ thống" tone="blue" icon={<ShieldCheck />} /><StatCard label="Chờ phân quyền" value="4" detail="Cần được xử lý hôm nay" tone="orange" icon={<SlidersHorizontal />} /></section>
          <section className="table-card"><div className="table-toolbar"><div><h3>Danh sách người dùng</h3><p>Danh sách tài khoản và vai trò được gán</p></div><div className="toolbar-actions"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, email..." /></label><div className="select-wrap"><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option>Tất cả vai trò</option>{roleCatalog.map((role) => <option key={role.id}>{role.label}</option>)}</select><ChevronDown size={15} /></div></div></div>
            <div className="table-wrap"><table><thead><tr><th>NGƯỜI DÙNG</th><th>VAI TRÒ ĐƯỢC GÁN</th><th>TRẠNG THÁI</th><th>HOẠT ĐỘNG GẦN NHẤT</th><th /></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id}><td><div className="person-cell"><div className={`avatar ${user.color}`}>{user.initials}</div><div><strong>{user.name}</strong><span>{user.email}</span></div></div></td><td><div className="role-list">{user.roles.length ? user.roles.map((role) => <span className={`role-chip ${role.tone}`} key={role.id}>{role.label}</span>) : <span className="empty-role">Chưa gán vai trò</span>}</div></td><td><span className={`status ${user.status === 'Đang hoạt động' ? 'active' : 'paused'}`}><i />{user.status}</span></td><td className="last-active">{user.lastActive}</td><td><button className="row-menu" onClick={() => setSelectedUser(user)} aria-label={`Mở thao tác cho ${user.name}`}><MoreHorizontal size={19} /></button></td></tr>)}</tbody></table>{loading ? <div className="empty-state">Đang tải dữ liệu từ backend...</div> : !apiError && filteredUsers.length === 0 && <div className="empty-state">Không có người dùng từ backend.</div>}</div><div className="table-footer"><span>Hiển thị <strong>{filteredUsers.length}</strong> trên tổng số <strong>{users.length}</strong> người dùng</span><div className="pagination"><button disabled>‹</button><button className="current">1</button><button>2</button><button>3</button><span>...</span><button>13</button><button>›</button></div></div></section>
          <footer>© 2026 Eduflow. Hệ thống quản lý đào tạo <span>Trợ giúp & hỗ trợ ↗</span></footer>
        </div>
      </main>

      {selectedUser && <div className="drawer-backdrop" onClick={() => { setSelectedUser(null); setShowRoleMenu(false) }}><aside className="drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">QUẢN LÝ PHÂN QUYỀN</span><h3>Chi tiết người dùng</h3></div><button className="close-button" onClick={() => { setSelectedUser(null); setShowRoleMenu(false) }}><X size={19} /></button></div><div className="drawer-profile"><div className={`avatar large ${selectedUser.color}`}>{selectedUser.initials}</div><div><h4>{selectedUser.name}</h4><p>{selectedUser.email}</p><span className="status active"><i /> Đang hoạt động</span></div></div><div className="drawer-section"><div className="drawer-section-title"><div><strong>Vai trò hiện tại</strong><span>{selectedUser.roles.length} vai trò được gán</span></div><button className="add-role-button" onClick={() => setShowRoleMenu(!showRoleMenu)}><Plus size={15} /> Thêm vai trò</button></div>{showRoleMenu && <div className="role-dropdown">{roleCatalog.map((role) => <button key={role.id} disabled={selectedUser.roles.some((current) => current.id === role.id)} onClick={() => addRole(role)}><span className={`role-dot ${role.tone}`} />{role.label}{selectedUser.roles.some((current) => current.id === role.id) && <Check size={15} />}</button>)}</div>}<div className="assigned-list">{selectedUser.roles.map((role) => <div className="assigned-role" key={role.id}><div className={`role-icon ${role.tone}`}><ShieldCheck size={16} /></div><div><strong>{role.label}</strong><span>Được gán bởi Nguyễn Minh Anh · Hôm nay</span></div><button onClick={() => removeRole(selectedUser, role.id)} title="Thu hồi vai trò"><X size={16} /></button></div>)}{selectedUser.roles.length === 0 && <div className="drawer-empty"><ShieldCheck size={20} /><span>Người dùng chưa có vai trò nào.</span></div>}</div></div><div className="drawer-note"><CircleHelp size={16} /><p>Thay đổi vai trò sẽ có hiệu lực ngay lập tức trong toàn hệ thống.</p></div><div className="drawer-actions"><button className="secondary-button" onClick={() => { setSelectedUser(null); setShowRoleMenu(false) }}>Hủy</button><button className="primary-button" onClick={() => { notify('Đã lưu thay đổi phân quyền'); setSelectedUser(null); setShowRoleMenu(false) }}>Lưu thay đổi</button></div></aside></div>}
      {toast && <div className="toast"><span><Check size={15} /></span>{toast}</div>}
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) { return <div className={`nav-item ${active ? 'active' : ''}`}>{icon}<span>{label}</span>{active && <i />}</div> }
function StatCard({ label, value, detail, tone, icon }: { label: string; value: string; detail: string; tone: string; icon: React.ReactNode }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small className={tone === 'orange' ? 'warning' : ''}>{detail}</small></div></div> }

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
