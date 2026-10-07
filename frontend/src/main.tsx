import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bell, BriefcaseBusiness, CalendarDays, ChevronDown, CircleHelp, Edit3,
  GraduationCap, LayoutDashboard, LockKeyhole, MapPin,
  Menu, Pencil, Phone, Settings, ShieldCheck, SlidersHorizontal, User,
  Users, X, Mail, Check, BookOpen, BarChart3
} from 'lucide-react'
import './styles.css'

type Profile = {
  name: string
  email: string
  phone: string
  birthday: string
  gender: string
  address: string
}

const initialProfile: Profile = {
  name: 'Nguyễn Minh Anh',
  email: 'minhanh@eduflow.vn',
  phone: '090 123 4567',
  birthday: '12/08/1998',
  gender: 'Nữ',
  address: 'Cầu Giấy, Hà Nội',
}

const menuGroups = [
  { label: 'KHÔNG GIAN LÀM VIỆC', items: [
    { label: 'Tổng quan', icon: LayoutDashboard },
    { label: 'Học', icon: BookOpen },
    { label: 'Học', icon: GraduationCap },
    { label: 'Học viên', icon: Users },
    { label: 'Báo cáo', icon: BarChart3 },
  ]},
  { label: 'QUẢN TRỊ HỆ THỐNG', items: [
    { label: 'Người dùng', icon: User },
    { label: 'Vai trò & phân quyền', icon: SlidersHorizontal },
    { label: 'Cài đặt', icon: Settings },
  ]},
]

function App() {
  const [profile, setProfile] = useState(initialProfile)
  const [draft, setDraft] = useState(initialProfile)
  const [editing, setEditing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const openEdit = () => { setDraft(profile); setEditing(true); setSaved(false) }
  const saveProfile = () => { setProfile(draft); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2600) }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><GraduationCap size={15} /></span><span>eduflow</span><span className="brand-dot">•</span></div>
        <div className="brand-sub">NỀN TẢNG QUẢN LÝ ĐÀO TẠO</div>
        <nav>
          {menuGroups.map((group, groupIndex) => (
            <div className="menu-group" key={group.label}>
              <div className="menu-label">{group.label}</div>
              {group.items.map(({ label, icon: Icon }, index) => (
                <button className={`menu-item ${groupIndex === 0 && index === 0 ? 'active' : ''}`} key={`${label}-${index}`} onClick={() => setSidebarOpen(false)}>
                  <Icon size={15} strokeWidth={1.8} /><span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="help-card"><div className="help-title"><CircleHelp size={13} /> Cần hỗ trợ?</div><p>Liên hệ quản trị viên để được hướng dẫn sử dụng hệ thống.</p><a href="#support">Trung tâm trợ giúp →</a></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Mở menu" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20} /></button>
          <div className="topbar-spacer" />
          <button className="icon-button" aria-label="Thông báo"><Bell size={16} /></button>
          <div className="top-avatar">TS</div>
          <div className="user-menu"><div><strong>Nguyễn Minh Anh</strong><span>quản lý đào tạo</span></div><ChevronDown size={13} /></div>
        </header>

        <div className="page-wrap">
          <div className="breadcrumbs">Trang chủ <span>›</span> Thông tin cá nhân</div>
          <div className="heading-row"><div><div className="eyebrow"><User size={13} /> TÀI KHOẢN CỦA TÔI</div><h1>Hồ sơ cá nhân</h1><p className="intro">Quản lý thông tin cá nhân và hệ thống của bạn.</p></div><button className="outline-button" onClick={openEdit}><Edit3 size={13} /> Chỉnh sửa giấy tờ</button></div>

          <section className="profile-banner card">
            <div className="profile-identity"><div className="large-avatar">Thạc<br/>sĩ <span><Check size={10} /></span></div><div><h2>{profile.name}</h2><div className="role"><i /> quản lý đào tạo</div><div className="member-date">Thành viên từ tháng 06, 2023</div></div></div>
            <div className="profile-meta"><div><BriefcaseBusiness size={13} /> Phòng tạo</div><div><MapPin size={13} /> Hà Nội, Việt Nam</div></div>
          </section>

          <div className="content-grid">
            <section className="personal-card card"><div className="card-heading"><div><h3>Thông tin cá nhân</h3><p>Cập nhật thông tin nhận dạng thông tin cá nhân.</p></div><button className="small-edit" onClick={openEdit}><Pencil size={12} /> Vào</button></div><div className="details-grid"><Detail icon={User} label="Họ và tên" value={profile.name} /><Detail icon={Mail} label="chỉ email" value={profile.email} /><Detail icon={Phone} label="Số điện thoại" value={profile.phone} /><Detail icon={CalendarDays} label="Ngày sinh" value={profile.birthday} /><Detail icon={User} label="Giới tính" value={profile.gender} /><Detail icon={MapPin} label="chỉ" value={profile.address} /></div></section>
            <div className="right-stack"><section className="company-card card"><div className="card-heading"><div><h3>Thông tin công ty</h3><p>Vai trò của bạn trong hệ thống.</p></div><BriefcaseBusiness size={15} className="purple-icon" /></div><DataRow label="Phòng ban" value="Phòng tạo" /><DataRow label="Chức năng" value="quản lý đào tạo" /><DataRow label="Mã nhân viên" value="EDU-0238" /></section><section className="security-card card"><div className="lock-icon"><LockKeyhole size={16} /></div><div><h3>Tài khoản Bảo vệ</h3><p>Mật khẩu được cập nhật lần cuối vào ngày 18/03/2025.</p><a href="#security">Đổi password</a></div></section></div>
          </div>
          <footer>© 2025 Eduflow · Hệ thống quản lý đào tạo <span>•</span> Phiên bản 1.0.0</footer>
        </div>
      </main>
      {saved && <div className="toast"><ShieldCheck size={16} /> Đã cập nhật thông tin hồ sơ</div>}
      {editing && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditing(false)}><div className="modal"><div className="modal-header"><div><div className="eyebrow"><Pencil size={13} /> CẬP NHẬT HỒ SƠ</div><h2>Chỉnh sửa thông tin</h2></div><button className="close-button" onClick={() => setEditing(false)}><X size={18} /></button></div><div className="form-grid">{([['name','Họ và tên'],['email','Email'],['phone','Số điện thoại'],['birthday','Ngày sinh'],['gender','Giới tính'],['address','Địa chỉ']] as const).map(([key,label]) => <label key={key}>{label}<input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /></label>)}</div><div className="modal-actions"><button className="cancel-button" onClick={() => setEditing(false)}>Hủy</button><button className="save-button" onClick={saveProfile}><Check size={15} /> Lưu thay đổi</button></div></div></div>}
    </div>
  )
}

function Detail({ icon: Icon, label, value }: { icon: typeof User, label: string, value: string }) { return <div className="detail"><div className="detail-label">{label}</div><div className="detail-value"><Icon size={13} /> {value}</div></div> }
function DataRow({ label, value }: { label: string, value: string }) { return <div className="data-row"><span>{label}</span><strong>{value}</strong></div> }

createRoot(document.getElementById('root')!).render(<App />)

export default App
