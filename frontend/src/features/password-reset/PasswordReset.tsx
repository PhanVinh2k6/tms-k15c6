import { useEffect, useState } from "react";
import "./password-reset.css";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock3,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK_LIFETIME_SECONDS = 30 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="TMS - Hệ thống Quản lý Đào tạo">
      <span className="brand-mark__symbol">
        <GraduationCap size={19} strokeWidth={2.2} />
      </span>
      <span className="brand-mark__lockup"><strong>TMS</strong><small>TRAINING MANAGEMENT SYSTEM</small></span>
    </div>
  );
}

function SecurityDetail({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="security-detail">
      <div className="security-detail__icon">
        <Icon size={17} strokeWidth={2.1} />
      </div>
      <div>
        <p className="security-detail__label">{label}</p>
        <p className="security-detail__value">{value}</p>
        <p className="security-detail__note">{note}</p>
      </div>
    </div>
  );
}

export default function PasswordReset() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(LINK_LIFETIME_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState("");
  const [isResetScreen, setIsResetScreen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);

  useEffect(() => {
    const demoToken = new URLSearchParams(window.location.search).get("token");
    if (demoToken === "demo") {
      setSubmittedEmail("email mẫu");
      setIsSent(true);
      setIsResetScreen(true);
    }
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isSent) return;

    const countdown = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(countdown);
  }, [isSent]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Vui lòng nhập email để tiếp tục.");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Vui lòng kiểm tra lại định dạng email.");
      return;
    }

    setError("");
    setIsSending(true);
    window.setTimeout(() => {
      setSubmittedEmail(normalizedEmail);
      setIsResetScreen(false);
      setIsPasswordUpdated(false);
      setNewPassword("");
      setConfirmPassword("");
      setResetError("");
      setRemainingSeconds(LINK_LIFETIME_SECONDS);
      setResendCooldown(0);
      setResendNotice("");
      setIsSent(true);
      setIsSending(false);
    }, 650);
  };

  const handleResend = () => {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);
    setResendNotice("");
    window.setTimeout(() => {
      setRemainingSeconds(LINK_LIFETIME_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setResendNotice("Đã gửi lại liên kết mới đến hộp thư của bạn.");
      setIsResending(false);
    }, 650);
  };

  const handlePasswordReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      setResetError("Mật khẩu mới cần có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setResetError("");
    setIsPasswordUpdated(true);
  };

  if (!isModalOpen) return null;

  return (
    <main className="auth-shell modal-mode">
      <div className="ambient-orb ambient-orb--one" />
      <div className="ambient-orb ambient-orb--two" />

      <header className="site-header">
        <BrandMark />
        <div className="header-meta">
          <span className="header-meta__status">
            <span className="status-dot" /> Hệ thống đang hoạt động
          </span>
          <a href="#support" className="header-meta__link">
            Trung tâm hỗ trợ <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <div className="page-grid">
        <section className="intro-panel" aria-labelledby="page-title">
          <div className="eyebrow"><Sparkles size={14} /> TMS · ACCOUNT RECOVERY · S1-03</div>
          <div className="intro-copy">
            <h1 id="page-title">Lấy lại quyền truy cập, <em>nhẹ nhàng.</em></h1>
            <p className="intro-description">
              Một email là đủ để bạn quay lại không gian làm việc của mình. Không cần chờ quản trị viên.
            </p>
          </div>

          <div className="trust-note">
            <div className="trust-note__icon"><ShieldCheck size={18} /></div>
            <div>
              <p className="trust-note__title">Riêng tư ngay từ bước đầu</p>
              <p className="trust-note__text">Phản hồi luôn giống nhau, dù email có tồn tại trong hệ thống hay không.</p>
            </div>
          </div>

          <div className="progress-line" aria-label="Tiến trình khôi phục tài khoản">
            <div className="progress-line__step progress-line__step--active">
              <span>01</span><p>Nhận liên kết</p>
            </div>
            <div className="progress-line__bar" />
            <div className="progress-line__step">
              <span>02</span><p>Đặt mật khẩu mới</p>
            </div>
          </div>
        </section>

        <section className="form-card" role="dialog" aria-modal="true" aria-label="Quên và đặt lại mật khẩu" aria-live="polite">
          <button type="button" className="modal-close" aria-label="Đóng cửa sổ đặt lại mật khẩu" onClick={() => setIsModalOpen(false)}>×</button>
          <div className="form-card__topline">
            <span className="step-pill">BƯỚC 01 <span>/ 02</span></span>
            <span className="secure-label"><LockKeyhole size={13} /> Bảo mật</span>
          </div>

          {isSent ? (
            isResetScreen ? (
              <div className="reset-password-state">
                {isPasswordUpdated ? (
                  <div className="success-state">
                    <div className="success-state__badge"><Check size={22} strokeWidth={2.5} /></div>
                    <p className="success-state__eyebrow">HOÀN TẤT</p>
                    <h2>Mật khẩu đã được cập nhật</h2>
                    <p className="success-state__copy">Bạn có thể sử dụng mật khẩu mới để đăng nhập vào hệ thống.</p>
                  </div>
                ) : (
                  <>
                    <div className="form-heading reset-heading">
                      <div className="form-heading__icon"><KeyRound size={20} /></div>
                      <div><h2>Đặt mật khẩu mới</h2><p>Tạo mật khẩu mới để bảo vệ tài khoản của bạn.</p></div>
                    </div>
                    <form onSubmit={handlePasswordReset} noValidate className="reset-password-form">
                      <label className="field-label" htmlFor="new-password">Mật khẩu mới</label>
                      <div className="input-wrap"><LockKeyhole size={18} aria-hidden="true" /><input id="new-password" type="password" autoComplete="new-password" required aria-invalid={Boolean(resetError)} value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setResetError(""); }} placeholder="Nhập mật khẩu mới" /></div>
                      <label className="field-label" htmlFor="confirm-password">Xác nhận mật khẩu</label>
                      <div className={`input-wrap ${resetError ? "input-wrap--error" : ""}`}><LockKeyhole size={18} aria-hidden="true" /><input id="confirm-password" type="password" autoComplete="new-password" required aria-invalid={Boolean(resetError)} aria-describedby={resetError ? "reset-error" : undefined} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setResetError(""); }} placeholder="Nhập lại mật khẩu mới" /></div>
                      {resetError && <p id="reset-error" className="field-error" role="alert">{resetError}</p>}
                      <button type="submit" className="primary-button">Cập nhật mật khẩu <ArrowUpRight size={17} /></button>
                    </form>
                  </>
                )}
              </div>
            ) : (
            <div className="success-state">
              <div className="success-state__badge"><Check size={22} strokeWidth={2.5} /></div>
              <p className="success-state__eyebrow">ĐÃ GỬI YÊU CẦU</p>
              <h2>Kiểm tra hộp thư của bạn</h2>
              <p className="success-state__copy">
                Nếu <strong>{submittedEmail}</strong> có tài khoản, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ này.
              </p>
              <div className="expiry-callout">
                <Clock3 size={17} />
                <span>
                  {remainingSeconds > 0 ? <>Liên kết hết hạn sau <strong className="countdown-value">{formatCountdown(remainingSeconds)}</strong></> : <strong>Liên kết đã hết hạn</strong>}
                  <br />Chỉ sử dụng được một lần.
                </span>
              </div>
              {resendNotice && <p className="resend-notice" role="status">{resendNotice}</p>}
              <button type="button" className="secondary-button" onClick={handleResend} disabled={isResending || resendCooldown > 0}>
                <RefreshCw size={16} className={isResending ? "spin" : ""} /> {isResending ? "Đang gửi lại…" : resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại liên kết"}
              </button>
              <button type="button" className="text-button" onClick={() => { setIsSent(false); setIsResetScreen(false); setIsPasswordUpdated(false); setNewPassword(""); setConfirmPassword(""); setResetError(""); setEmail(""); }}>
                <ArrowLeft size={15} /> Nhập email khác
              </button>
            </div>
            )
          ) : (
            <>
              <div className="form-heading">
                <div className="form-heading__icon"><Mail size={20} /></div>
                <div>
                  <h2>Quên mật khẩu?</h2>
                  <p>Nhập email bạn dùng để đăng nhập.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <label className="field-label" htmlFor="email">Email đăng nhập</label>
                <div className={`input-wrap ${error ? "input-wrap--error" : ""}`}>
                  <Mail size={18} aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); if (error) setError(""); }}
                    placeholder="Email address..."
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "email-error" : "email-help"}
                  />
                </div>
                {error ? <p id="email-error" className="field-error">{error}</p> : <p id="email-help" className="field-help">Chúng tôi sẽ gửi một liên kết bảo mật đến email này.</p>}

                <button type="submit" className="primary-button" disabled={isSending}>
                  {isSending ? <><RefreshCw size={17} className="spin" /> Đang gửi…</> : <>Gửi liên kết đặt lại <ArrowUpRight size={17} /></>}
                </button>
              </form>

            </>
          )}
        </section>
      </div>

      <section className="security-strip" aria-label="Thông tin bảo mật">
        <SecurityDetail icon={Clock3} label="Thời hạn" value="30 phút" note="Sau đó liên kết sẽ hết hạn" />
        <SecurityDetail icon={KeyRound} label="Quyền truy cập" value="Một lần duy nhất" note="Liên kết tự vô hiệu sau khi dùng" />
        <SecurityDetail icon={ShieldCheck} label="Thông tin tài khoản" value="Luôn riêng tư" note="Không tiết lộ email có tồn tại hay không" />
      </section>

      <footer className="site-footer" id="support">
        <span>© 2026 TMS · Hệ thống Quản lý Đào tạo</span>
        <span className="footer-separator">•</span>
        <a href="#privacy">Chính sách riêng tư</a>
        <span className="footer-separator">•</span>
        <a href="#support">Cần trợ giúp?</a>
      </footer>
    </main>
  );
}
