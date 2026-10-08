import { FormEvent, useState } from 'react'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

type FormData = {
  fullName: string
  phone: string
  email: string
  course: string
  message: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const initialForm: FormData = {
  fullName: '',
  phone: '',
  email: '',
  course: '',
  message: '',
}

const navItems = [
  { label: 'Tổng quan', icon: LayoutDashboard },
  { label: 'Khóa học', icon: BookOpen },
  { label: 'Lịch học', icon: CalendarDays },
  { label: 'Học viên', icon: Users },
  { label: 'Báo cáo', icon: ClipboardList },
]

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="field-label">
      {children}
      {required && <span className="required">*</span>}
    </label>
  )
}

function App() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const updateField = (field: keyof FormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ và tên.'
    if (!form.phone.trim()) nextErrors.phone = 'Vui lòng nhập số điện thoại.'
    else if (!/^(0|\+84)[0-9\s.-]{8,}$/.test(form.phone.trim())) nextErrors.phone = 'Số điện thoại chưa đúng định dạng.'
    if (!form.email.trim()) nextErrors.email = 'Vui lòng nhập email.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Email chưa đúng định dạng.'
    if (!form.course) nextErrors.course = 'Vui lòng chọn khóa học quan tâm.'
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setSubmitted(true)
  }

  const resetForm = () => {
    setSubmitted(false)
    setForm(initialForm)
    setErrors({})
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><GraduationCap size={19} strokeWidth={2.3} /></div>
          <div>
            <strong>eduflow</strong>
            <span>QUẢN LÝ ĐÀO TẠO</span>
          </div>
          <button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Đóng menu"><X size={19} /></button>
        </div>

        <div className="sidebar-section-label">KHÔNG GIAN LÀM VIỆC</div>
        <nav className="main-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <a href="#form" key={label} className={label === 'Học viên' ? 'active' : ''}>
              <Icon size={17} /> <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-section-label">QUẢN TRỊ HỆ THỐNG</div>
        <nav className="main-nav secondary-nav">
          <a href="#form"><Users size={17} /> <span>Người dùng</span></a>
          <a href="#form"><ShieldCheck size={17} /> <span>Vai trò & phân quyền</span></a>
          <a href="#form"><Sparkles size={17} /> <span>Cài đặt</span></a>
        </nav>

        <div className="sidebar-help">
          <div className="help-icon"><CircleHelp size={16} /></div>
          <div>
            <strong>Cần hỗ trợ?</strong>
            <p>Liên hệ quản trị viên để được hướng dẫn sử dụng hệ thống.</p>
            <a href="#form">Trung tâm trợ giúp <ArrowRight size={12} /></a>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Mở menu"><Menu size={22} /></button>
          <div className="topbar-title">Biểu mẫu đăng ký tư vấn</div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Thông báo"><Bell size={18} /></button>
            <div className="user-profile">
              <div className="avatar">TA</div>
              <div className="user-copy"><strong>Thạc sĩ</strong><span>quản lý đào tạo</span></div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <div className="content-wrap" id="form">
          <div className="breadcrumb"><span>Trang chủ</span><span className="crumb-separator">›</span><strong>Đăng ký tư vấn</strong></div>
          <div className="page-heading">
            <div>
              <div className="eyebrow"><MessageSquareText size={14} /> TƯ VẤN KHÓA HỌC</div>
              <h1>Đăng ký tư vấn</h1>
              <p>Để lại thông tin, đội ngũ Eduflow sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
            </div>
            <div className="secure-badge"><ShieldCheck size={15} /> Thông tin được bảo mật</div>
          </div>

          <div className="form-layout">
            <section className="form-card">
              {!submitted ? (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="card-intro">
                    <div className="intro-icon"><Headphones size={20} /></div>
                    <div><h2>Thông tin liên hệ</h2><p>Hãy điền thông tin để chuyên viên tư vấn hỗ trợ bạn tốt hơn.</p></div>
                  </div>

                  <div className="fields-grid">
                    <div className="field-group">
                      <FieldLabel required>Họ và tên</FieldLabel>
                      <div className={`input-wrap ${errors.fullName ? 'has-error' : ''}`}><Users size={17} /><input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Nhập họ và tên của bạn" /></div>
                      {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                    </div>
                    <div className="field-group">
                      <FieldLabel required>Số điện thoại</FieldLabel>
                      <div className={`input-wrap ${errors.phone ? 'has-error' : ''}`}><Phone size={17} /><input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="090 123 4567" inputMode="tel" /></div>
                      {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>
                    <div className="field-group">
                      <FieldLabel required>Email</FieldLabel>
                      <div className={`input-wrap ${errors.email ? 'has-error' : ''}`}><Mail size={17} /><input value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" type="email" /></div>
                      {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                    <div className="field-group">
                      <FieldLabel required>Khóa học quan tâm</FieldLabel>
                      <div className={`input-wrap select-wrap ${errors.course ? 'has-error' : ''}`}><BookOpen size={17} /><select value={form.course} onChange={(e) => updateField('course', e.target.value)}><option value="">Chọn khóa học</option><option>Tiếng Anh giao tiếp</option><option>IELTS Foundation</option><option>Quản lý đào tạo</option><option>Kỹ năng lãnh đạo</option></select><ChevronDown className="select-chevron" size={16} /></div>
                      {errors.course && <span className="error-text">{errors.course}</span>}
                    </div>
                    <div className="field-group full-width">
                      <FieldLabel>Nội dung cần tư vấn <span className="optional">(không bắt buộc)</span></FieldLabel>
                      <div className="input-wrap textarea-wrap"><MessageSquareText size={17} /><textarea value={form.message} onChange={(e) => updateField('message', e.target.value)} placeholder="Bạn muốn được tư vấn thêm về điều gì?" rows={4} /></div>
                    </div>
                  </div>
                  <div className="form-footer"><span className="required-note"><span className="required">*</span> Trường thông tin bắt buộc</span><button type="submit" className="primary-button">Gửi yêu cầu tư vấn <ArrowRight size={17} /></button></div>
                </form>
              ) : (
                <div className="success-state">
                  <div className="success-icon"><Check size={30} strokeWidth={2.5} /></div>
                  <div className="success-kicker">GỬI THÀNH CÔNG</div>
                  <h2>Cảm ơn bạn đã đăng ký!</h2>
                  <p>Eduflow đã nhận được yêu cầu tư vấn của bạn. Chuyên viên sẽ liên hệ qua số điện thoại hoặc email trong thời gian sớm nhất.</p>
                  <div className="reference-code"><span>Mã yêu cầu</span><strong>EDU-{new Date().getFullYear()}-0824</strong></div>
                  <button className="secondary-button" onClick={resetForm}>Gửi yêu cầu khác <ArrowRight size={16} /></button>
                </div>
              )}
            </section>

            <aside className="support-card">
              <div className="support-illustration"><div className="illustration-orbit orbit-one"></div><div className="illustration-orbit orbit-two"></div><div className="illustration-center"><Headphones size={26} /></div><div className="floating-dot dot-one"></div><div className="floating-dot dot-two"></div></div>
              <h3>Bạn cần hỗ trợ thêm?</h3>
              <p>Đội ngũ tư vấn Eduflow luôn sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
              <div className="support-line"><div className="line-icon"><Phone size={15} /></div><div><span>Hotline tư vấn</span><strong>090 123 4567</strong></div></div>
              <div className="support-line"><div className="line-icon"><Mail size={15} /></div><div><span>Email hỗ trợ</span><strong>support@eduflow.vn</strong></div></div>
              <div className="support-line"><div className="line-icon"><MapPin size={15} /></div><div><span>Văn phòng</span><strong>Cầu Giấy, Hà Nội</strong></div></div>
            </aside>
          </div>
          <footer className="page-footer">© 2025 eduflow · Hệ thống quản lý đào tạo <span>·</span> Phiên bản 1.0.0</footer>
        </div>
      </main>
    </div>
  )
}

export default App
