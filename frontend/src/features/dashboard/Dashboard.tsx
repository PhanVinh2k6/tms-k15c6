import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowUpRight, Bell, BookOpenCheck, CalendarDays, CheckCircle2,
  ChevronRight, Clock3, LayoutDashboard, LogOut, Menu,
  Shield, ShieldCheck, UsersRound, X,
} from 'lucide-react'
import { getSession, logout, refreshSession, type SessionClaims } from '../account-lock/api'
import { ROLE_LABEL, type Role } from '../account-lock/types'
import './dashboard.css'

type DashboardProps = { previewRole?: Role }

type RoleView = {
  title: string
  subtitle: string
  eyebrow: string
  primary: string
  stats: { label: string; value: string; detail: string; tone: string }[]
  tasks: { title: string; meta: string; status: string }[]
}

const roleViews: Record<Role, RoleView> = {
  ADMIN: {
    title: 'Trung tâm vận hành', subtitle: 'Toàn cảnh hệ thống tài khoản và phân quyền hôm nay.', eyebrow: 'ADMIN CONTROL ROOM', primary: 'Mở quản lý tài khoản',
    stats: [{ label: 'Tài khoản hoạt động', value: '24', detail: '+3 trong tháng này', tone: 'purple' }, { label: 'Phiên đang mở', value: '18', detail: '2 phiên cần chú ý', tone: 'teal' }, { label: 'Chờ kích hoạt', value: '06', detail: 'Có 2 email chưa mở', tone: 'yellow' }, { label: 'Tài khoản bị khóa', value: '02', detail: 'Đã có biên bản bàn giao', tone: 'pink' }],
    tasks: [{ title: 'Rà soát tài khoản chờ kích hoạt', meta: '6 tài khoản · 10 phút trước', status: 'Cần xử lý' }, { title: 'Kiểm tra thay đổi quyền tuần này', meta: '4 thay đổi · Hôm nay', status: 'Đang theo dõi' }, { title: 'Xác nhận bàn giao lớp K15C6', meta: '1 cảnh báo · Hôm nay', status: 'Ưu tiên' }],
  },
  INSTRUCTOR: {
    title: 'Không gian giảng viên', subtitle: 'Những việc quan trọng cho lớp học của bạn trong hôm nay.', eyebrow: 'INSTRUCTOR DESK', primary: 'Xem lớp phụ trách',
    stats: [{ label: 'Lớp đang phụ trách', value: '03', detail: 'K15C6 · K15C7 · K16A', tone: 'purple' }, { label: 'Buổi dạy kế tiếp', value: '14:00', detail: 'JWT & Session · Phòng 204', tone: 'teal' }, { label: 'Bài chưa chấm', value: '12', detail: '4 bài đã quá hạn', tone: 'yellow' }, { label: 'Chuyên cần tuần này', value: '94%', detail: '+6% so với tuần trước', tone: 'pink' }],
    tasks: [{ title: 'Điểm danh lớp K15C6', meta: '14:00 · Hôm nay', status: 'Sắp tới' }, { title: 'Chấm bài JWT middleware', meta: '8 bài · Hạn 18:00', status: 'Cần xử lý' }, { title: 'Nhắc 2 học viên vắng nhiều', meta: 'K15C7 · Hôm nay', status: 'Theo dõi' }],
  },
  TRAINING_MANAGER: {
    title: 'Bảng điều hành đào tạo', subtitle: 'Theo dõi lớp học và các điểm nghẽn cần quyết định.', eyebrow: 'TRAINING OPS', primary: 'Xem danh mục đào tạo',
    stats: [{ label: 'Lớp đang chạy', value: '08', detail: '+1 so với tuần trước', tone: 'purple' }, { label: 'Học viên đang học', value: '186', detail: '12 học viên rủi ro', tone: 'teal' }, { label: 'Lead mới', value: '32', detail: '7 lead cần phân công', tone: 'yellow' }, { label: 'Công việc quá hạn', value: '04', detail: 'Giảm 2 so với hôm qua', tone: 'pink' }],
    tasks: [{ title: 'Phân công lead mới', meta: '7 lead · Tuyển sinh', status: 'Cần xử lý' }, { title: 'Duyệt lịch học tuần tới', meta: '8 lớp · 3 thay đổi', status: 'Chờ duyệt' }, { title: 'Xem danh sách học viên rủi ro', meta: '12 học viên · Hôm nay', status: 'Ưu tiên' }],
  },
  ADMISSIONS: { title: 'Bàn làm việc tuyển sinh', subtitle: 'Theo dõi lead và cuộc gọi cần thực hiện.', eyebrow: 'ADMISSIONS DESK', primary: 'Mở danh sách lead', stats: [{ label: 'Lead được giao', value: '28', detail: '+5 hôm nay', tone: 'purple' }, { label: 'Đang tư vấn', value: '11', detail: '3 cuộc hẹn hôm nay', tone: 'teal' }, { label: 'Quá hạn gọi lại', value: '04', detail: 'Cần xử lý trước 17:00', tone: 'yellow' }, { label: 'Tỷ lệ chốt', value: '32%', detail: '+4% tháng này', tone: 'pink' }], tasks: [{ title: 'Gọi lại Nguyễn Minh Anh', meta: 'Quá hạn 30 phút', status: 'Ưu tiên' }, { title: 'Cập nhật trạng thái lead', meta: '5 lead · Hôm nay', status: 'Cần xử lý' }] },
  ACCOUNTANT: { title: 'Bàn làm việc kế toán', subtitle: 'Theo dõi công nợ và các khoản thu cần đối soát.', eyebrow: 'FINANCE DESK', primary: 'Xem công nợ', stats: [{ label: 'Đã thu tháng này', value: '284M', detail: '+12% so với tháng trước', tone: 'purple' }, { label: 'Đang chờ thu', value: '48M', detail: '17 học viên', tone: 'teal' }, { label: 'Quá hạn', value: '09', detail: '3 khoản cần nhắc', tone: 'yellow' }, { label: 'Đối soát hôm nay', value: '96%', detail: 'Còn 2 giao dịch', tone: 'pink' }], tasks: [{ title: 'Nhắc học phí quá hạn', meta: '9 khoản · Hôm nay', status: 'Cần xử lý' }, { title: 'Đối soát giao dịch ngân hàng', meta: '2 giao dịch · 15 phút trước', status: 'Đang xử lý' }] },
  TA: { title: 'Bàn trợ giảng', subtitle: 'Các việc hỗ trợ lớp học trong ngày.', eyebrow: 'TEACHING ASSISTANT', primary: 'Xem lớp hỗ trợ', stats: [{ label: 'Lớp hỗ trợ', value: '02', detail: 'K15C6 · K15C7', tone: 'purple' }, { label: 'Học viên cần nhắc', value: '07', detail: 'Cập nhật lúc 09:20', tone: 'teal' }, { label: 'Bài cần hỗ trợ', value: '05', detail: 'Trong hôm nay', tone: 'yellow' }, { label: 'Tin nhắn mới', value: '03', detail: 'Từ giảng viên', tone: 'pink' }], tasks: [{ title: 'Chuẩn bị tài liệu buổi học', meta: 'K15C6 · 14:00', status: 'Sắp tới' }] },
  STUDENT: { title: 'Không gian học viên', subtitle: 'Lịch học, bài tập và tiến độ của bạn.', eyebrow: 'STUDENT SPACE', primary: 'Xem lịch học', stats: [{ label: 'Tiến độ khóa học', value: '68%', detail: '+8% tuần này', tone: 'purple' }, { label: 'Buổi học kế tiếp', value: '14:00', detail: 'JWT & Session', tone: 'teal' }, { label: 'Bài cần nộp', value: '02', detail: 'Hạn trước thứ Sáu', tone: 'yellow' }, { label: 'Chuyên cần', value: '96%', detail: 'Đang ở mức tốt', tone: 'pink' }], tasks: [{ title: 'Nộp bài JWT middleware', meta: 'Hạn thứ Sáu · Bắt buộc', status: 'Cần làm' }, { title: 'Xem phản hồi bài tập tuần trước', meta: 'Đã có phản hồi', status: 'Mới' }] },
  GUEST: { title: 'TMS Workspace', subtitle: 'Bạn đang ở chế độ khách với quyền truy cập giới hạn.', eyebrow: 'LIMITED ACCESS', primary: 'Xem hướng dẫn', stats: [{ label: 'Quyền truy cập', value: '01', detail: 'Trang công khai', tone: 'purple' }, { label: 'Trạng thái', value: 'OK', detail: 'Phiên hợp lệ', tone: 'teal' }, { label: 'Thông báo', value: '00', detail: 'Không có', tone: 'yellow' }, { label: 'Hỗ trợ', value: '24/7', detail: 'Đội ngũ TMS', tone: 'pink' }], tasks: [{ title: 'Xem hướng dẫn sử dụng', meta: 'Bắt đầu trong 2 phút', status: 'Gợi ý' }] },
}

function roleFromSession(session: SessionClaims | null, previewRole?: Role): Role {
  if (previewRole) return previewRole
  const role = session?.roles?.find((item): item is Role => item in ROLE_LABEL)
  return role ?? 'GUEST'
}

export function Dashboard({ previewRole }: DashboardProps) {
  const [session, setSession] = useState<SessionClaims | null>(() => getSession())
  const [checking, setChecking] = useState(() => !getSession() && Boolean(sessionStorage.getItem('tms.refreshToken')))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const role = roleFromSession(session, previewRole)
  const view = roleViews[role]
  const displayName = session?.email?.split('@')[0] ?? (role === 'INSTRUCTOR' ? 'Giảng viên mẫu' : 'Tài khoản demo')

  useEffect(() => {
    if (!checking) return
    refreshSession().then(() => { setSession(getSession()); setChecking(false) })
  }, [checking])

  const sessionLabel = useMemo(() => session ? 'Phiên đang hoạt động' : 'Chế độ xem demo', [session])

  if (checking) return <main className="dash-state"><Clock3 size={28} /><h1>Đang khôi phục phiên…</h1><p>Hệ thống đang kiểm tra phiên đăng nhập của bạn.</p></main>

  const handleLogout = async () => { await logout(); window.location.assign('/') }
  const handleAction = () => setNotice('Tính năng nghiệp vụ sẽ được nối vào module sprint tiếp theo. Luồng quyền và session đã sẵn sàng.')

  return (
    <div className="dash-shell">
      <aside className={`dash-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="dash-brand"><span className="dash-mark"><i /><i /><i /></span><strong>TMS.</strong><button className="dash-close" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><X size={18} /></button></div>
        <div className="dash-profile"><div className="dash-avatar">{displayName.slice(0, 1).toUpperCase()}</div><div><strong>{displayName}</strong><span>{ROLE_LABEL[role]}</span></div></div>
        <nav className="dash-nav" aria-label="Điều hướng chính">
          <span className="dash-nav-active"><LayoutDashboard size={18} /> Tổng quan</span>
          {role === 'ADMIN' && <><a href="/admin-users.html"><UsersRound size={18} /> Quản lý tài khoản</a><a href="/admin-account-lock.html"><Shield size={18} /> Khóa / mở khóa</a></>}
          {role !== 'ADMIN' && <button onClick={handleAction}><BookOpenCheck size={18} /> Công việc của tôi</button>}
          <button onClick={handleAction}><CalendarDays size={18} /> Lịch & hoạt động</button>
        </nav>
        <div className="dash-sidebar-foot"><div className="dash-health"><span /> Hệ thống hoạt động bình thường</div><button className="dash-logout" onClick={handleLogout}><LogOut size={17} /> Đăng xuất</button></div>
      </aside>
      {sidebarOpen && <button className="dash-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu" />}
      <main className="dash-main">
        <header className="dash-topbar"><button className="dash-menu" onClick={() => setSidebarOpen(true)} aria-label="Mở menu"><Menu size={21} /></button><div className="dash-breadcrumb"><span>TMS Workspace</span><ChevronRight size={14} /><strong>Tổng quan</strong></div><div className="dash-top-actions"><span className="dash-session"><span /> {sessionLabel}</span><button className="dash-icon-btn" onClick={() => setNotice('Bạn không có thông báo mới.')} aria-label="Thông báo"><Bell size={18} /></button><button className="dash-top-logout" onClick={handleLogout}>Thoát <LogOut size={15} /></button></div></header>
        <section className="dash-content">
          <div className="dash-hero"><div><p className="dash-eyebrow"><Activity size={14} /> {view.eyebrow}</p><h1>{view.title}</h1><p>{view.subtitle}</p></div><button className="dash-primary" onClick={handleAction}>{view.primary}<ArrowUpRight size={17} /></button></div>
          {notice && <div className="dash-notice"><CheckCircle2 size={18} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Đóng thông báo"><X size={16} /></button></div>}
          <div className="dash-stats">{view.stats.map((stat) => <article className={`dash-stat dash-stat-${stat.tone}`} key={stat.label}><div className="dash-stat-icon"><ShieldCheck size={18} /></div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}</div>
          <div className="dash-grid"><section className="dash-panel dash-tasks"><div className="dash-panel-head"><div><p className="dash-eyebrow">TODAY</p><h2>Việc cần tập trung</h2></div><button onClick={handleAction}>Xem tất cả <ArrowUpRight size={15} /></button></div><div className="dash-task-list">{view.tasks.map((task) => <button className="dash-task" key={task.title} onClick={handleAction}><span className="dash-task-dot" /><span className="dash-task-copy"><strong>{task.title}</strong><small>{task.meta}</small></span><em>{task.status}</em><ChevronRight size={16} /></button>)}</div></section><section className="dash-panel dash-activity"><div className="dash-panel-head"><div><p className="dash-eyebrow">ACTIVITY</p><h2>Hoạt động gần đây</h2></div><Activity size={18} /></div><div className="dash-timeline"><div><span className="timeline-icon timeline-purple"><ShieldCheck size={15} /></span><p><strong>Phiên đăng nhập an toàn</strong><small>Vừa xong · Từ thiết bị hiện tại</small></p></div><div><span className="timeline-icon timeline-teal"><UsersRound size={15} /></span><p><strong>Vai trò {ROLE_LABEL[role]} được xác nhận</strong><small>5 phút trước · Server đã kiểm quyền</small></p></div><div><span className="timeline-icon timeline-yellow"><Bell size={15} /></span><p><strong>Không có cảnh báo mới</strong><small>Hệ thống đã đồng bộ dữ liệu</small></p></div></div></section></div>
          <div className="dash-footer-note"><ShieldCheck size={16} /> Mọi thao tác nhạy cảm đều được kiểm quyền ở server · Sprint 1 demo <span>v1.0</span></div>
        </section>
      </main>
    </div>
  )
}
