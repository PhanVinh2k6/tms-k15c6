import {
  ArrowLeft,
  ArrowRight,
  Home,
  KeyRound,
  Layers3,
  SearchX,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import './access-feedback.css'

type FeedbackBaseProps = {
  path?: string
  onGoBack?: () => void
  onGoHome?: () => void
}

type AccessFeedbackProps = FeedbackBaseProps & (
  | {
      status: 'forbidden'
      onRequestAccess: () => void
    }
  | {
      status: 'not-found'
      onRequestAccess?: never
    }
)

type FeedbackContent = {
  code: string
  label: string
  title: string
  message: string
  nextStep: string
  icon: LucideIcon
  tone: 'permission' | 'missing'
}

const feedbackContent: Record<AccessFeedbackProps['status'], FeedbackContent> = {
  forbidden: {
    code: '403',
    label: 'Truy cập bị từ chối',
    title: 'Bạn chưa có quyền truy cập',
    message:
      'Tài khoản hiện tại chưa được cấp quyền xem nội dung này. Hãy quay lại hoặc gửi yêu cầu để quản trị viên hỗ trợ.',
    nextStep: 'Yêu cầu quản trị viên cấp quyền cho tài khoản của bạn.',
    icon: ShieldAlert,
    tone: 'permission',
  },
  'not-found': {
    code: '404',
    label: 'Không tìm thấy trang',
    title: 'Đường dẫn này không tồn tại',
    message:
      'Trang có thể đã được chuyển, bị xóa hoặc địa chỉ được nhập chưa chính xác. Bạn có thể quay lại nơi vừa truy cập.',
    nextStep: 'Kiểm tra lại địa chỉ hoặc trở về trang tổng quan.',
    icon: SearchX,
    tone: 'missing',
  },
}

export function AccessFeedback(props: AccessFeedbackProps) {
  const { status, path = window.location.pathname, onGoBack, onGoHome } = props
  const content = feedbackContent[status]
  const StatusIcon = content.icon

  function goBack() {
    if (onGoBack) {
      onGoBack()
      return
    }

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign('/')
  }

  function goHome() {
    if (onGoHome) {
      onGoHome()
      return
    }

    window.location.assign('/')
  }

  return (
    <main
      className={`ef-access-feedback ef-access-feedback--${content.tone}`}
      aria-labelledby="ef-feedback-title"
      aria-describedby="ef-feedback-message"
      role="alert"
    >
      <header className="ef-feedback-header">
        <a className="ef-feedback-brand" href="/" aria-label="Eduflow, trang tổng quan">
          <span className="ef-feedback-brand-mark"><Layers3 size={19} strokeWidth={2.4} /></span>
          <span>eduflow<span className="ef-feedback-brand-period">.</span></span>
        </a>
        <span className="ef-feedback-header-label">TRUNG TÂM ĐÀO TẠO</span>
      </header>

      <div className="ef-feedback-main">
        <section className="ef-feedback-layout">
          <div className="ef-feedback-code" aria-label={`Mã lỗi ${content.code}`}>
            <span className="ef-feedback-code-label">MÃ LỖI</span>
            <span className="ef-feedback-code-number">{content.code}</span>
            <span className="ef-feedback-code-rule" />
            <span className="ef-feedback-code-caption">{content.label}</span>
            <span className="ef-feedback-icon"><StatusIcon size={25} strokeWidth={1.8} /></span>
          </div>

          <div className="ef-feedback-copy">
            <span className="ef-feedback-eyebrow">
              <span className="ef-feedback-eyebrow-dot" />
              CÓ VẺ NHƯ ĐÃ XẢY RA NHẦM LẪN
            </span>
            <h1 id="ef-feedback-title">{content.title}</h1>
            <p id="ef-feedback-message" className="ef-feedback-message">{content.message}</p>

            <div className="ef-feedback-location">
              <span>Địa chỉ vừa truy cập</span>
              <code title={path}>{path}</code>
            </div>

            <div className="ef-feedback-next-step">
              <span className="ef-feedback-next-icon"><KeyRound size={16} /></span>
              <p>{content.nextStep}</p>
            </div>

            <div className="ef-feedback-actions">
              {status === 'forbidden' && (
                <button className="ef-feedback-button ef-feedback-button--primary" onClick={props.onRequestAccess} type="button">
                  Gửi yêu cầu cấp quyền <ArrowRight size={16} />
                </button>
              )}
              <button className="ef-feedback-button ef-feedback-button--secondary" onClick={goHome} type="button">
                <Home size={16} /> Về tổng quan
              </button>
              <button className="ef-feedback-back" onClick={goBack} type="button">
                <ArrowLeft size={15} /> Quay lại
              </button>
            </div>
          </div>
        </section>

        <footer className="ef-feedback-footer">
          <span>EDUFLOW ADMIN CONSOLE</span>
          <span className="ef-feedback-footer-dot" />
          <span>Nếu cần hỗ trợ, hãy liên hệ quản trị viên hệ thống.</span>
        </footer>
      </div>
    </main>
  )
}

export type { AccessFeedbackProps }