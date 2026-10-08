import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import './styles.css'
import { ApiError, login } from './features/account-lock/api'
import Activation from './features/activation/Activation'

type Benefit = {
  icon: LucideIcon
  text: string
  description: string
}

type FormState = {
  email: string
  password: string
  remember: boolean
}

type FormErrors = Partial<Record<keyof Omit<FormState, 'remember'>, string>>
type SocialProvider = 'Google' | 'Facebook'

const benefits: Benefit[] = [
  { icon: BookOpenCheck, text: 'Quản lý khóa học linh hoạt', description: 'Tạo và sắp xếp lộ trình giảng dạy chuyên nghiệp.' },
  { icon: UsersRound, text: 'Theo dõi học viên thông minh', description: 'Báo cáo tiến trình học tập chi tiết của từng cá nhân.' },
  { icon: BarChart3, text: 'Phân tích báo cáo tự động', description: 'Đo lường hiệu quả chương trình đào tạo trực quan.' },
]

const initialForm: FormState = {
  email: '',
  password: '',
  remember: false,
}

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [socialMessage, setSocialMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  if (window.location.pathname === '/activate') return <Activation />

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field !== 'remember') {
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
    setSubmitted(false)
    setSocialMessage('')
    setServerError('')
  }

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email.'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Email chưa đúng định dạng.'
    }

    if (!form.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.'
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setServerError('')
    if (Object.keys(nextErrors).length > 0) return
    setLoading(true)
    try {
      const result = await login(form.email.trim(), form.password, form.remember)
      window.localStorage.setItem('tms.accessToken', result.data.accessToken)
      window.sessionStorage.setItem('tms.refreshToken', result.data.refreshToken)
      setSubmitted(true)
      window.location.assign('/admin-users.html')
    } catch (error) {
      setSubmitted(false)
      setServerError(error instanceof ApiError ? 'Email hoặc mật khẩu không đúng.' : 'Không kết nối được máy chủ. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: SocialProvider) => {
    setSocialMessage(`Đã chọn đăng nhập bằng ${provider}. Đây là luồng demo, chưa kết nối database.`)
    setSubmitted(false)
    setErrors({})
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="login-card" aria-label="Giao diện đăng nhập TMS">
        <aside className="brand-panel">
          <div className="brand-topline">
            <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
            <span className="brand-name">TMS.</span>
          </div>

          <div className="brand-copy">
            <p className="eyebrow"><Sparkles size={14} /> NỀN TẢNG VẬN HÀNH ĐÀO TẠO</p>
            <h1>Vận hành đào tạo<br /><em>thông minh hơn.</em></h1>
            <p className="brand-description">Hệ thống quản lý đào tạo toàn diện giúp doanh nghiệp tự động hóa quy trình, tối ưu nguồn lực và nâng cao chất lượng nhân sự vượt trội.</p>
          </div>

          <div className="benefit-list">
            {benefits.map(({ icon: Icon, text, description }) => (
              <div className="benefit" key={text}>
                <span className="benefit-icon"><Icon size={17} /></span>
                <span className="benefit-copy"><strong>{text}</strong><small>{description}</small></span>
                <Check className="benefit-check" size={15} />
              </div>
            ))}
          </div>

          <div className="panel-footer"><div className="status-dot" /><span>Hệ thống nội bộ • Phiên bản 1.0</span></div>
        </aside>

        <section className="form-panel">
          <div className="mobile-brand"><span className="mobile-mark">T</span><span>TMS.</span></div>
          <div className="form-content">
            <div className="form-heading">
              <p className="form-kicker">CHÀO MỪNG QUAY TRỞ LẠI</p>
              <h2>Đăng nhập</h2>
              <p>Nhập thông tin tài khoản của bạn để truy cập hệ thống quản trị đào tạo.</p>
            </div>

            <form className="visual-form" onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label htmlFor="email">Email</label>
                <div className={`input-wrap${errors.email ? ' has-error' : ''}`}>
                  <Mail size={18} aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                <p className="error-text" id="email-error" role="alert">{errors.email}</p>
              </div>

              <div className="field-group">
                <div className="label-row">
                  <label htmlFor="password">Mật khẩu</label>
                  <button className="forgot-link" type="button" onClick={() => window.location.assign('/password-reset.html')}>Quên mật khẩu?</button>
                </div>
                <div className={`input-wrap${errors.password ? ' has-error' : ''}`}>
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="error-text" id="password-error" role="alert">{errors.password}</p>
              </div>

              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) => updateField('remember', event.target.checked)}
                />
                <span className="custom-checkbox" aria-hidden="true"><Check size={12} /></span>
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <button className="submit-button" type="submit" disabled={loading}>
                <span>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</span><ArrowRight size={18} />
              </button>
              {serverError && <p className="error-text server-error" role="alert">{serverError}</p>}
              {submitted && <p className="success-text" role="status"><Check size={15} /> Đăng nhập thành công.</p>}
            </form>

            <div className="social-divider"><span>HOẶC TIẾP TỤC VỚI</span></div>
            <div className="social-actions" aria-label="Đăng nhập bằng tài khoản mạng xã hội">
              <button className="social-button" type="button" onClick={() => handleSocialLogin('Google')}>
                <span className="social-icon google-icon" aria-hidden="true">G</span>
                <span>Google</span>
              </button>
              <button className="social-button" type="button" onClick={() => handleSocialLogin('Facebook')}>
                <span className="social-icon facebook-icon" aria-hidden="true">f</span>
                <span>Facebook</span>
              </button>
            </div>
            {socialMessage && <p className="social-message" role="status">{socialMessage}</p>}

            <div className="security-note"><ShieldCheck size={16} /><span>Dữ liệu được bảo mật tối đa theo tiêu chuẩn ISO 27001</span></div>
          </div>
          <div className="form-footer">
            <p className="copyright">© 2026 TMS Platform.</p>
            <button className="help-link" type="button" onClick={() => window.alert('Bộ phận hỗ trợ TMS sẽ liên hệ với bạn.')}>Trợ giúp &amp; hỗ trợ</button>
          </div>
        </section>
      </section>
    </main>
  )
}
