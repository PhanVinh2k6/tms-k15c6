import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  Clock3,
  Eye,
  EyeOff,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import './styles.css'

type Benefit = { icon: LucideIcon; text: string; description: string }
type FormState = { email: string; password: string; remember: boolean }
type FormErrors = Partial<Record<keyof Omit<FormState, 'remember'>, string>>
type SocialProvider = 'Google' | 'Facebook'
type Screen = 'login' | 'dashboard'

const benefits: Benefit[] = [
  { icon: BookOpenCheck, text: 'Quản lý khóa học linh hoạt', description: 'Tạo và sắp xếp lộ trình giảng dạy chuyên nghiệp.' },
  { icon: UsersRound, text: 'Theo dõi học viên thông minh', description: 'Báo cáo tiến trình học tập chi tiết của từng cá nhân.' },
  { icon: BarChart3, text: 'Phân tích báo cáo tự động', description: 'Đo lường hiệu quả chương trình đào tạo trực quan.' },
]

const initialForm: FormState = { email: '', password: '', remember: false }
const SESSION_LENGTH_MS = 30 * 60 * 1000

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [socialMessage, setSocialMessage] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [logoutNotice, setLogoutNotice] = useState(false)
  const [sessionEndsAt, setSessionEndsAt] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(30 * 60)

  const renewSession = () => {
    const nextExpiry = Date.now() + SESSION_LENGTH_MS
    setSessionEndsAt(nextExpiry)
    setSecondsLeft(30 * 60)
  }

  useEffect(() => {
    if (screen !== 'dashboard' || !sessionEndsAt) return
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((sessionEndsAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) {
        setScreen('login')
        setSessionExpired(true)
        setSessionEndsAt(null)
      }
    }, 1000)
    const activityEvents: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll']
    const handleActivity = () => {
      if (Date.now() > sessionEndsAt - 5 * 60 * 1000) renewSession()
    }
    activityEvents.forEach((event) => window.addEventListener(event, handleActivity))
    return () => {
      window.clearInterval(timer)
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity))
    }
  }, [screen, sessionEndsAt])

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field !== 'remember') setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitted(false)
    setSocialMessage('')
    setSessionExpired(false)
    setLogoutNotice(false)
  }

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {}
    if (!form.email.trim()) nextErrors.email = 'Vui lòng nhập email.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Email chưa đúng định dạng.'
    if (!form.password) nextErrors.password = 'Vui lòng nhập mật khẩu.'
    return nextErrors
  }

  const startSession = () => {
    setScreen('dashboard')
    setSessionExpired(false)
    setLogoutNotice(false)
    renewSession()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true)
      startSession()
    }
  }

  const handleSocialLogin = (provider: SocialProvider) => {
    setErrors({})
    setSocialMessage(`Đang mô phỏng xác thực ${provider} — không lưu dữ liệu hoặc dùng database.`)
    startSession()
  }

  const handleLogout = () => {
    setScreen('login')
    setSessionEndsAt(null)
    setSecondsLeft(30 * 60)
    setSubmitted(false)
    setSocialMessage('')
    setSessionExpired(false)
    setLogoutConfirmOpen(false)
    setLogoutNotice(true)
  }

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  if (screen === 'dashboard') {
    return (
      <main className="app-shell">
        <header className="app-header">
          <div className="app-logo"><span className="mobile-mark"><GraduationCap size={17} /></span><strong>TMS.</strong></div>
          <div className="header-actions">
            <span className="session-chip"><span className="status-dot" /> Phiên đang hoạt động</span>
            <button className="logout-button" type="button" onClick={() => setLogoutConfirmOpen(true)}><LogOut size={16} /> Đăng xuất an toàn</button>
          </div>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div><p className="form-kicker">TỔNG QUAN HỆ THỐNG</p><h1>Chào mừng trở lại, {form.email.split('@')[0] || 'bạn'}.</h1><p>Tiếp tục công việc đào tạo của bạn từ nơi đã dừng lại.</p></div>
            <div className="session-panel"><div className="session-panel-top"><Clock3 size={17} /><span>Phiên tự gia hạn</span></div><strong>{formattedTime}</strong><small>Gia hạn khi bạn còn thao tác</small><button type="button" onClick={renewSession}><RefreshCw size={14} /> Gia hạn ngay</button></div>
          </div>
          <div className="dashboard-grid">
            <article className="dashboard-card card-purple"><span className="card-icon"><BookOpenCheck size={20} /></span><strong>24</strong><span>Khóa học đang vận hành</span><small>+8% so với tháng trước</small></article>
            <article className="dashboard-card card-pink"><span className="card-icon"><UsersRound size={20} /></span><strong>1,284</strong><span>Học viên đang theo dõi</span><small>92% hoàn thành đúng hạn</small></article>
            <article className="dashboard-card card-teal"><span className="card-icon"><BarChart3 size={20} /></span><strong>86%</strong><span>Hiệu quả đào tạo</span><small>Dữ liệu cập nhật theo thời gian thực</small></article>
          </div>
          <section className="activity-card"><div className="activity-title"><div><p className="form-kicker">BẢO MẬT PHIÊN</p><h2>Hoạt động gần đây</h2></div><span className="secure-badge"><ShieldCheck size={15} /> ISO 27001</span></div><div className="activity-row"><span className="activity-icon"><LayoutDashboard size={17} /></span><div><strong>Đăng nhập thành công</strong><small>Thiết bị hiện tại • Vừa xong</small></div><Check size={17} className="activity-check" /></div><div className="activity-row"><span className="activity-icon"><FileCheck2 size={17} /></span><div><strong>Phiên được bảo vệ tự động</strong><small>Gia hạn ngầm khi bạn thao tác</small></div><Check size={17} className="activity-check" /></div></section>
          <button className="demo-expire-button" type="button" onClick={() => { setScreen('login'); setSessionExpired(true); setSessionEndsAt(null) }}>Mô phỏng phiên hết hạn để kiểm tra</button>
          {logoutConfirmOpen && <div className="logout-modal-backdrop" role="presentation"><section className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title"><span className="modal-icon"><LogOut size={20} /></span><h2 id="logout-title">Đăng xuất khỏi hệ thống?</h2><p>Phiên làm việc hiện tại sẽ được kết thúc an toàn trên thiết bị này.</p><div className="modal-actions"><button type="button" className="modal-cancel" onClick={() => setLogoutConfirmOpen(false)}>Ở lại</button><button type="button" className="modal-confirm" onClick={handleLogout}>Đăng xuất</button></div></section></div>}
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <section className="login-card" aria-label="Giao diện đăng nhập TMS">
        <aside className="brand-panel"><div className="brand-topline"><div className="brand-logo-lockup" aria-hidden="true"><span className="brand-logo-icon"><GraduationCap size={19} /></span><span className="brand-name">TMS.</span></div></div><div className="brand-copy"><p className="eyebrow"><Sparkles size={14} /> NỀN TẢNG VẬN HÀNH ĐÀO TẠO</p><h1>Vận hành đào tạo<br /><em>thông minh hơn.</em></h1><p className="brand-description">Hệ thống quản lý đào tạo toàn diện giúp doanh nghiệp tự động hóa quy trình, tối ưu nguồn lực và nâng cao chất lượng nhân sự vượt trội.</p></div><div className="benefit-list">{benefits.map(({ icon: Icon, text, description }) => <div className="benefit" key={text}><span className="benefit-icon"><Icon size={17} /></span><span className="benefit-copy"><strong>{text}</strong><small>{description}</small></span><Check className="benefit-check" size={15} /></div>)}</div><div className="panel-footer"><div className="status-dot" /><span>Hệ thống nội bộ • Phiên bản 1.0</span></div></aside>
        <section className="form-panel"><div className="mobile-brand"><span className="mobile-mark"><GraduationCap size={17} /></span><span>TMS.</span></div><div className="form-content">{logoutNotice && <div className="logout-success-banner"><Check size={17} /><div><strong>Đã đăng xuất an toàn</strong><span>Phiên làm việc đã kết thúc. Bạn có thể đăng nhập lại bất cứ lúc nào.</span></div></div>}{sessionExpired && <div className="session-expired-banner"><Clock3 size={17} /><div><strong>Phiên đăng nhập đã hết hạn</strong><span>Dữ liệu bạn nhập vẫn được giữ lại. Đăng nhập lại để tiếp tục.</span></div></div>}<div className="form-heading"><p className="form-kicker">CHÀO MỪNG QUAY TRỞ LẠI</p><h2>Đăng nhập</h2><p>Nhập thông tin tài khoản của bạn để truy cập hệ thống quản trị đào tạo.</p></div><form className="visual-form" onSubmit={handleSubmit} noValidate><div className="field-group"><label htmlFor="email">Email</label><div className={`input-wrap${errors.email ? ' has-error' : ''}`}><Mail size={18} aria-hidden="true" /><input id="email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} /></div><p className="error-text" role="alert">{errors.email}</p></div><div className="field-group"><div className="label-row"><label htmlFor="password">Mật khẩu</label><button className="forgot-link" type="button">Quên mật khẩu?</button></div><div className={`input-wrap${errors.password ? ' has-error' : ''}`}><LockKeyhole size={18} aria-hidden="true" /><input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" aria-invalid={Boolean(errors.password)} /><button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><p className="error-text" role="alert">{errors.password}</p></div><label className="remember-row"><input type="checkbox" checked={form.remember} onChange={(event) => updateField('remember', event.target.checked)} /><span className="custom-checkbox" aria-hidden="true"><Check size={12} /></span><span>Ghi nhớ đăng nhập</span></label><button className="submit-button" type="submit"><span>Đăng nhập</span><ArrowRight size={18} /></button>{submitted && <p className="success-text" role="status"><Check size={15} /> Đăng nhập thành công.</p>}</form><div className="social-divider"><span>HOẶC TIẾP TỤC VỚI</span></div><div className="social-actions" aria-label="Đăng nhập bằng tài khoản mạng xã hội"><button className="social-button" type="button" onClick={() => handleSocialLogin('Google')}><span className="social-icon google-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.27c0-.73-.07-1.44-.21-2.12H12v4.02h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.29Z"/><path fill="#34A853" d="M12 21.67c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.67Z"/><path fill="#FBBC05" d="M6.53 13.75A5.85 5.85 0 0 1 6.22 12c0-.61.11-1.2.31-1.75V7.72H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.04 4.28l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.22c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.2 14.63 2.33 12 2.33a9.74 9.74 0 0 0-8.71 5.39l3.24 2.53c.77-2.31 2.93-4.03 5.47-4.03Z"/></svg></span><span>Google</span></button><button className="social-button" type="button" onClick={() => handleSocialLogin('Facebook')}><span className="social-icon facebook-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1877F2"/><path fill="#fff" d="M13.46 19v-6.12h2.06l.31-2.39h-2.37V8.96c0-.69.19-1.16 1.18-1.16h1.27V5.66c-.22-.03-.98-.1-1.86-.1-1.84 0-3.1 1.12-3.1 3.18v1.75H8.87v2.39h2.08V19h2.51Z"/></svg></span><span>Facebook</span></button></div>{socialMessage && <p className="social-message" role="status">{socialMessage}</p>}<div className="security-note"><ShieldCheck size={16} /><span>Dữ liệu được bảo mật tối đa theo tiêu chuẩn ISO 27001</span></div></div><div className="form-footer"><p className="copyright">© 2026 TMS Platform.</p><button className="help-link" type="button"><LifeBuoy size={12} /> Trợ giúp &amp; hỗ trợ</button></div></section>
      </section>
    </main>
  )
}
