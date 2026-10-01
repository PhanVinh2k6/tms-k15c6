import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  titleId: string
  title: string
  /** Đang gửi yêu cầu: không cho đóng bằng Esc / bấm nền / nút X. */
  busy?: boolean
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE = 'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [href]'

/** Hộp thoại có bẫy phím Tab, đóng bằng Esc, trả focus về nút đã mở nó. */
export function Modal({ titleId, title, busy = false, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const latest = useRef({ busy, onClose })

  useEffect(() => {
    latest.current = { busy, onClose }
  })

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!latest.current.busy) latest.current.onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const head = items[0]
      const tail = items[items.length - 1]
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault()
        tail.focus()
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault()
        head.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      previous?.focus()
    }
  }, [])

  return (
    <div
      className="acl-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <div className="acl-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef}>
        <header className="acl-modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="acl-icon-button" aria-label="Đóng" disabled={busy} onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
