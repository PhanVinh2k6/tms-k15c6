import { ShieldAlert, X } from 'lucide-react'
import type { HandoverNotice } from './useLockUnlock'

type HandoverAlertProps = {
  handover: HandoverNotice | null
  onDismiss: () => void
}

/**
 * Cảnh báo cần bàn giao lớp học sau khi khoá tài khoản (S1-10).
 * Hiện cả khi `classes` rỗng: đó là lúc backend đã khoá nhưng không kiểm tra được danh sách lớp.
 */
export function HandoverAlert({ handover, onDismiss }: HandoverAlertProps) {
  if (!handover) return null
  return (
    <section className="acl-handover" role="alert" aria-label="Cảnh báo bàn giao lớp học">
      <ShieldAlert size={22} aria-hidden="true" />
      <div>
        <strong>Cần bàn giao: {handover.name}</strong>
        <p>{handover.warning.message}</p>
        {handover.warning.classes.length > 0 && (
          <ul>
            {handover.warning.classes.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className="acl-icon-button" aria-label="Đã đọc, ẩn cảnh báo bàn giao" onClick={onDismiss}>
        <X size={18} aria-hidden="true" />
      </button>
    </section>
  )
}
