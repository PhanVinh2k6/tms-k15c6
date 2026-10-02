import { useState, type FormEvent } from 'react'
import { Check, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, X } from 'lucide-react'

const passwordRules = [
  { label: 'Tối thiểu 8 ký tự', valid: true },
  { label: 'Có ít nhất 1 chữ hoa', valid: true },
  { label: 'Có ít nhất 1 chữ thường', valid: true },
  { label: 'Có ít nhất 1 chữ số', valid: true },
]

function App() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="password-page">
      <div className="password-card">
        <section className="password-intro">
          <div className="security-illustration" aria-hidden="true">
            <div className="lock-ring lock-ring-large" />
            <div className="lock-ring lock-ring-small" />
            <div className="lock-shackle" />
            <div className="lock-body"><LockKeyhole size={42} strokeWidth={1.7} /></div>
            <div className="mini-key"><KeyRound size={16} /></div>
          </div>
          <div className="intro-copy">
            <h1>Bảo mật tài khoản</h1>
            <p>Tạo mật khẩu mới để bảo vệ tài khoản của bạn an toàn hơn.</p>
          </div>
        </section>

        <section className="password-form-panel">
          <div className="form-heading">
            <p className="form-kicker">THIẾT LẬP BẢO MẬT</p>
            <h2>Đổi mật khẩu</h2>
            <p className="form-subtitle">Vui lòng nhập thông tin bên dưới để cập nhật mật khẩu mới.</p>
          </div>

          <form onSubmit={submit}>
            <PasswordField label="Mật khẩu hiện tại" placeholder="Nhập mật khẩu hiện tại" visible={showCurrent} onToggle={() => setShowCurrent((value) => !value)} />
            <PasswordField label="Mật khẩu mới" placeholder="Nhập mật khẩu mới" visible={showNew} onToggle={() => setShowNew((value) => !value)} />

            <div className="rules-block">
              <span className="rules-title">Mật khẩu mới cần có</span>
              <div className="rules-grid">
                {passwordRules.map((rule) => <span key={rule.label} className={rule.valid ? 'rule rule-valid' : 'rule'}>{rule.valid ? <Check size={12} /> : <X size={12} />}{rule.label}</span>)}
              </div>
            </div>

            <PasswordField label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu mới" visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} />

            <button className="submit-button" type="submit"><ShieldCheck size={15} /> Đổi mật khẩu</button>
            {submitted && <div className="success-message"><Check size={15} /> Mật khẩu đã được cập nhật trong bản demo.</div>}
          </form>
        </section>
      </div>
    </main>
  )
}

function PasswordField({ label, placeholder, visible, onToggle }: { label: string; placeholder: string; visible: boolean; onToggle: () => void }) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <div className="input-wrap">
        <input type={visible ? 'text' : 'password'} placeholder={placeholder} />
        <button type="button" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={onToggle}>{visible ? <EyeOff size={14} /> : <Eye size={14} />}</button>
      </div>
    </label>
  )
}

export default App
