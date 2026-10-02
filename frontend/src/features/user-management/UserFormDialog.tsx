import { useId, useState, type FormEvent } from 'react'
import { AlertTriangle, LoaderCircle, Save, UserPlus } from 'lucide-react'
import { ApiError } from '../account-lock/api'
import { Modal } from '../account-lock/Modal'
import { ROLE_LABEL, ROLE_ORDER } from '../account-lock/types'
import type { Role, UserAccount } from '../account-lock/types'
import { emptyForm, formFromAccount, validateForm } from './validation'
import type { FormErrors, FormValues } from './validation'

type UserFormDialogProps = {
  /** Có `account` là sửa, không có là tạo mới. */
  account?: UserAccount
  /** Gọi API; ném ApiError nếu thất bại để hộp thoại hiện lỗi đúng ô. */
  onSubmit: (values: FormValues) => Promise<void>
  onClose: () => void
}

const FIELD_KEYS = ['fullName', 'email', 'phone', 'roles'] as const

export function UserFormDialog({ account, onSubmit, onClose }: UserFormDialogProps) {
  const uid = useId()
  const editing = account !== undefined
  const [values, setValues] = useState<FormValues>(() => (account ? formFromAccount(account) : emptyForm()))
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const toggleRole = (role: Role) =>
    setField('roles', values.roles.includes(role) ? values.roles.filter((item) => item !== role) : [...values.roles, role])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const found = validateForm(values, !editing)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await onSubmit(values)
    } catch (error) {
      if (error instanceof ApiError) {
        const next: FormErrors = {}
        for (const key of FIELD_KEYS) if (error.fieldErrors[key]) next[key] = error.fieldErrors[key]
        if (error.code === 'EMAIL_ALREADY_EXISTS') next.email = error.message
        if (Object.keys(next).length > 0) {
          setErrors(next)
          setSubmitting(false)
          return
        }
      }
      setFormError(error instanceof Error ? error.message : 'Không lưu được tài khoản. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  const title = editing ? 'Sửa tài khoản' : 'Thêm tài khoản'
  const Icon = editing ? Save : UserPlus

  return (
    <Modal titleId={`${uid}-title`} title={title} busy={submitting} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {!editing && (
          <p className="acl-modal-lead">
            Hệ thống sẽ gửi email kích hoạt kèm mật khẩu tạm đến địa chỉ email này. Tài khoản ở trạng thái “Chờ kích hoạt” cho
            tới khi người dùng kích hoạt.
          </p>
        )}

        <div className="acl-field">
          <label className="acl-label" htmlFor={`${uid}-name`}>
            Họ và tên <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-name`}
            data-autofocus
            className="acl-input"
            type="text"
            autoComplete="off"
            maxLength={120}
            value={values.fullName}
            aria-required="true"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={`${uid}-name-err`}
            disabled={submitting}
            onChange={(event) => setField('fullName', event.target.value)}
          />
          <span className="acl-field-error" id={`${uid}-name-err`} role="alert">
            {errors.fullName}
          </span>
        </div>

        <div className="acl-field">
          <label className="acl-label" htmlFor={`${uid}-email`}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-email`}
            className="acl-input"
            type="email"
            autoComplete="off"
            maxLength={254}
            value={values.email}
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={`${uid}-email-err`}
            disabled={submitting}
            onChange={(event) => setField('email', event.target.value)}
          />
          <span className="acl-field-error" id={`${uid}-email-err`} role="alert">
            {errors.email}
          </span>
        </div>

        <div className="acl-field">
          <label className="acl-label" htmlFor={`${uid}-phone`}>
            Số điện thoại
          </label>
          <input
            id={`${uid}-phone`}
            className="acl-input"
            type="tel"
            autoComplete="off"
            placeholder="0912345678 (không bắt buộc)"
            maxLength={20}
            value={values.phone}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={`${uid}-phone-err`}
            disabled={submitting}
            onChange={(event) => setField('phone', event.target.value)}
          />
          <span className="acl-field-error" id={`${uid}-phone-err`} role="alert">
            {errors.phone}
          </span>
        </div>

        {editing ? (
          <p className="acl-hint">
            Vai trò và trạng thái khóa không đổi ở đây. Vai trò đổi ở mục phân quyền (S1-09), khóa và mở khóa dùng nút trên
            danh sách.
          </p>
        ) : (
          <fieldset className="acl-field acl-fieldset" disabled={submitting} aria-describedby={`${uid}-roles-err`}>
            <legend className="acl-label">
              Vai trò <span aria-hidden="true">*</span>
            </legend>
            <div className="acl-checks">
              {ROLE_ORDER.map((role) => (
                <label className="acl-check" key={role}>
                  <input type="checkbox" checked={values.roles.includes(role)} onChange={() => toggleRole(role)} />
                  <span>{ROLE_LABEL[role]}</span>
                </label>
              ))}
            </div>
            <span className="acl-field-error" id={`${uid}-roles-err`} role="alert">
              {errors.roles}
            </span>
          </fieldset>
        )}

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
          <button type="submit" className="acl-button acl-button-primary" disabled={submitting}>
            {submitting ? <LoaderCircle size={16} className="acl-spin" aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
            {submitting ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
