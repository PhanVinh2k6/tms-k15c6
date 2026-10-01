import { useId, useState, type FormEvent } from 'react'
import { AlertTriangle, LoaderCircle, Lock, LockOpen, Trash2 } from 'lucide-react'
import { ApiError } from './api'
import { Modal } from './Modal'
import type { UserAccount } from './types'
import { formatDateTime } from './format'

export const LOCK_REASON_MIN = 3
export const LOCK_REASON_MAX = 500

type LockDialogProps = {
  account: UserAccount
  /** Gọi API khoá; ném ApiError nếu thất bại để hộp thoại hiện lỗi. */
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}

export function LockDialog({ account, onConfirm, onClose }: LockDialogProps) {
  const uid = useId()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')

  const trimmedLength = reason.trim().length

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    if (trimmedLength < LOCK_REASON_MIN || trimmedLength > LOCK_REASON_MAX) {
      setFieldError(`Hãy ghi lý do khoá, từ ${LOCK_REASON_MIN} đến ${LOCK_REASON_MAX} ký tự.`)
      return
    }
    setSubmitting(true)
    setFieldError('')
    setFormError('')
    try {
      await onConfirm(reason.trim())
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.reason) {
        setFieldError(error.fieldErrors.reason)
      } else {
        setFormError(error instanceof Error ? error.message : 'Không khoá được tài khoản. Vui lòng thử lại.')
      }
      setSubmitting(false)
    }
  }

  return (
    <Modal titleId={`${uid}-title`} title="Khoá tài khoản" busy={submitting} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="acl-modal-lead">
          Bạn sắp khoá tài khoản <strong>{account.fullName}</strong> ({account.email}). Người này sẽ không còn dùng được
          hệ thống cho tới khi được mở khoá.
        </p>

        <label className="acl-label" htmlFor={`${uid}-reason`}>
          Lý do khoá <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={`${uid}-reason`}
          data-autofocus
          className="acl-textarea"
          rows={4}
          value={reason}
          maxLength={LOCK_REASON_MAX + 100}
          placeholder="Ví dụ: Nghỉ việc ngày 30/09"
          aria-required="true"
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={`${uid}-hint`}
          disabled={submitting}
          onChange={(event) => {
            setReason(event.target.value)
            if (fieldError) setFieldError('')
          }}
        />
        <div className="acl-field-foot" id={`${uid}-hint`}>
          <span className="acl-field-error" role="alert">
            {fieldError}
          </span>
          <span className={trimmedLength > LOCK_REASON_MAX ? 'acl-counter acl-counter-over' : 'acl-counter'}>
            {trimmedLength}/{LOCK_REASON_MAX}
          </span>
        </div>

        {formError && (
          <p className="acl-form-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{formError}</span>
          </p>
        )}

        <div className="acl-modal-actions">
          <button type="button" className="acl-button acl-button-ghost" disabled={submitting} onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="acl-button acl-button-danger" disabled={submitting}>
            {submitting ? <LoaderCircle size={16} className="acl-spin" aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
            {submitting ? 'Đang khoá…' : 'Xác nhận khoá'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

type UnlockDialogProps = {
  account: UserAccount
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function UnlockDialog({ account, onConfirm, onClose }: UnlockDialogProps) {
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
      setFormError(error instanceof Error ? error.message : 'Không mở khoá được tài khoản. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  return (
    <Modal titleId={`${uid}-title`} title="Mở khoá tài khoản" busy={submitting} onClose={onClose}>
      <p className="acl-modal-lead">
        Mở khoá tài khoản <strong>{account.fullName}</strong> ({account.email})? Tài khoản sẽ trở về trạng thái trước khi bị
        khoá.
      </p>

      {account.lockedReason && (
        <div className="acl-quote">
          <span className="acl-quote-label">Lý do khoá hiện tại</span>
          <p>{account.lockedReason}</p>
          {account.lockedAt && <small>Khoá lúc {formatDateTime(account.lockedAt)}</small>}
        </div>
      )}

      <ul className="acl-notes">
        <li>Lý do khoá sẽ bị xoá khỏi tài khoản (hệ thống chưa lưu nhật ký thao tác).</li>
        <li>Các phiên đăng nhập cũ không tự sống lại, người dùng phải đăng nhập lại.</li>
      </ul>

      {formError && (
        <p className="acl-form-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{formError}</span>
        </p>
      )}

      <div className="acl-modal-actions">
        <button type="button" className="acl-button acl-button-ghost" disabled={submitting} onClick={onClose}>
          Huỷ
        </button>
        <button type="button" data-autofocus className="acl-button acl-button-primary" disabled={submitting} onClick={submit}>
          {submitting ? <LoaderCircle size={16} className="acl-spin" aria-hidden="true" /> : <LockOpen size={16} aria-hidden="true" />}
          {submitting ? 'Đang mở khoá…' : 'Xác nhận mở khoá'}
        </button>
      </div>
    </Modal>
  )
}

type DeleteDialogProps = {
  account: UserAccount
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function DeleteDialog({ account, onConfirm, onClose }: DeleteDialogProps) {
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
      setFormError(error instanceof Error ? error.message : 'Không xoá được tài khoản. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  return (
    <Modal titleId={`${uid}-title`} title="Xoá tài khoản" busy={submitting} onClose={onClose}>
      <p className="acl-modal-lead">
        Bạn sắp xoá hẳn tài khoản <strong>{account.fullName}</strong> ({account.email}).
      </p>

      <ul className="acl-notes">
        <li>Thao tác này không khôi phục được.</li>
        <li>Muốn người này tạm thời không dùng được hệ thống nhưng vẫn giữ dữ liệu, hãy chọn “Khoá” thay vì xoá.</li>
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
          {submitting ? 'Đang xoá…' : 'Xác nhận xoá'}
        </button>
      </div>
    </Modal>
  )
}
