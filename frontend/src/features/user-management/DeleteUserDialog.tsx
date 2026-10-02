import { useId, useState } from 'react'
import { AlertTriangle, LoaderCircle, Trash2 } from 'lucide-react'
import { Modal } from '../account-lock/Modal'
import type { UserAccount } from '../account-lock/types'

type DeleteUserDialogProps = {
  account: UserAccount
  /** Gọi DELETE /users/:id; ném lỗi nếu thất bại để hộp thoại hiện lỗi và giữ nguyên. */
  onConfirm: () => Promise<void>
  onClose: () => void
}

/**
 * Xác nhận xoá hẳn tài khoản (S1-08). Nút mặc định (được focus) là "Huỷ" để bấm Enter nhầm không xoá mất.
 * Backend tự chặn tự xoá mình (CANNOT_DELETE_SELF) và xoá Quản trị hệ thống cuối cùng (CANNOT_DELETE_LAST_ADMIN).
 */
export function DeleteUserDialog({ account, onConfirm, onClose }: DeleteUserDialogProps) {
  const uid = useId()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    setFormError('')
    try {
      await onConfirm()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không xóa được tài khoản. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  return (
    <Modal titleId={`${uid}-title`} title="Xóa tài khoản" busy={submitting} onClose={onClose}>
      <p className="acl-modal-lead">
        Bạn sắp xóa hẳn tài khoản <strong>{account.fullName}</strong> ({account.email}).
      </p>

      <ul className="acl-notes">
        <li>Thao tác này không khôi phục được.</li>
        <li>Muốn người này tạm thời không dùng được hệ thống nhưng vẫn giữ dữ liệu, hãy chọn “Khóa” thay vì xóa.</li>
      </ul>

      {formError && (
        <p className="acl-form-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{formError}</span>
        </p>
      )}

      <div className="acl-modal-actions">
        <button type="button" data-autofocus className="acl-button acl-button-ghost" disabled={submitting} onClick={onClose}>
          Huỷ
        </button>
        <button type="button" className="acl-button acl-button-danger" disabled={submitting} onClick={submit}>
          {submitting ? <LoaderCircle size={16} className="acl-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
          {submitting ? 'Đang xóa…' : 'Xác nhận xóa'}
        </button>
      </div>
    </Modal>
  )
}
