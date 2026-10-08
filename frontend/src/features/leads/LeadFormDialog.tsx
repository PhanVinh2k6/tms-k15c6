import { useEffect, useId, useState, type FormEvent } from 'react'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import { ApiError } from '../account-lock/api'
import { Modal } from '../account-lock/Modal'
import { checkPhone } from './api'
import { PROGRAM_OPTIONS, SOURCE_LABEL, SOURCE_ORDER } from './types'
import type { DuplicateWarning, Lead, LeadSource } from './types'
import { LEAD_FIELDS, emptyLeadForm, formFromLead, validPhoneOrNull, validateLeadForm } from './validation'
import type { LeadFormErrors, LeadFormValues } from './validation'

/** Chờ người dùng ngừng gõ rồi mới hỏi server có trùng số không. */
export const PHONE_CHECK_DELAY_MS = 400

type LeadFormDialogProps = {
  /** Có `lead` là sửa, không có là thêm mới. */
  lead?: Lead
  /** Gọi API; ném ApiError nếu thất bại để hộp thoại hiện lỗi đúng ô. */
  onSubmit: (values: LeadFormValues) => Promise<void>
  onClose: () => void
}

export function LeadFormDialog({ lead, onSubmit, onClose }: LeadFormDialogProps) {
  const uid = useId()
  const editing = lead !== undefined
  const [values, setValues] = useState<LeadFormValues>(() => (lead ? formFromLead(lead) : emptyLeadForm()))
  const [errors, setErrors] = useState<LeadFormErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [duplicate, setDuplicate] = useState<{ phone: string; warning: DuplicateWarning | null } | null>(null)

  // AC2: hỏi backend số này đã có trong danh sách chưa; chỉ cảnh báo, không chặn nút Lưu.
  const phoneToCheck = validPhoneOrNull(values.phone)
  useEffect(() => {
    if (!phoneToCheck) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      checkPhone(phoneToCheck, lead?.id, controller.signal)
        .then((result) => setDuplicate({ phone: phoneToCheck, warning: result.duplicateWarning }))
        .catch(() => setDuplicate(null)) // lỗi mạng khi kiểm tra không được làm hỏng form; server vẫn cảnh báo khi lưu
    }, PHONE_CHECK_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [phoneToCheck, lead?.id])
  // Chỉ hiện kết quả của đúng số đang nhập, không hiện kết quả cũ của số trước đó.
  const shownDuplicate = phoneToCheck && duplicate?.phone === phoneToCheck ? duplicate.warning : null

  const setField = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const found = validateLeadForm(values)
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
        const next: LeadFormErrors = {}
        for (const key of LEAD_FIELDS) if (error.fieldErrors[key]) next[key] = error.fieldErrors[key]
        if (Object.keys(next).length > 0) {
          setErrors(next)
          setSubmitting(false)
          return
        }
        if (error.status === 403) {
          setFormError('Bạn không có quyền thêm hoặc sửa lead. Chỉ Tư vấn tuyển sinh và Quản trị hệ thống được thực hiện.')
          setSubmitting(false)
          return
        }
      }
      setFormError(error instanceof Error ? error.message : 'Không lưu được lead. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  // Lead cũ có thể mang chương trình ngoài danh sách gợi ý: vẫn giữ để không mất dữ liệu khi sửa.
  const programs = values.interestedProgram && !PROGRAM_OPTIONS.includes(values.interestedProgram)
    ? [values.interestedProgram, ...PROGRAM_OPTIONS]
    : PROGRAM_OPTIONS

  const fieldProps = (key: keyof LeadFormValues) => ({
    id: `${uid}-${key}`,
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': `${uid}-${key}-msg`,
    disabled: submitting,
  })

  return (
    <Modal titleId={`${uid}-title`} title={editing ? 'Chỉnh sửa Lead' : 'Thêm Lead'} busy={submitting} onClose={onClose}>
      <form className="lead-form" onSubmit={submit} noValidate>
        <div className="lead-form-grid">
          <div className="lead-field">
            <label htmlFor={`${uid}-fullName`}>
              Họ tên <span aria-hidden="true">*</span>
            </label>
            <input
              {...fieldProps('fullName')}
              data-autofocus
              type="text"
              autoComplete="off"
              maxLength={100}
              placeholder="Nhập họ tên"
              aria-required="true"
              className={errors.fullName ? 'lead-input-error' : undefined}
              value={values.fullName}
              onChange={(event) => setField('fullName', event.target.value)}
            />
            <span className="lead-error-text" id={`${uid}-fullName-msg`} role="alert">{errors.fullName}</span>
          </div>

          <div className="lead-field">
            <label htmlFor={`${uid}-email`}>Email</label>
            <input
              {...fieldProps('email')}
              type="email"
              autoComplete="off"
              maxLength={254}
              placeholder="example@gmail.com"
              className={errors.email ? 'lead-input-error' : undefined}
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
            />
            <span className="lead-error-text" id={`${uid}-email-msg`} role="alert">{errors.email}</span>
          </div>

          <div className="lead-field">
            <label htmlFor={`${uid}-phone`}>
              Số điện thoại <span aria-hidden="true">*</span>
            </label>
            <input
              {...fieldProps('phone')}
              type="tel"
              autoComplete="off"
              maxLength={20}
              placeholder="Nhập số điện thoại"
              aria-required="true"
              className={errors.phone || shownDuplicate ? 'lead-input-error' : undefined}
              value={values.phone}
              onChange={(event) => setField('phone', event.target.value)}
            />
            <span className="lead-error-text" id={`${uid}-phone-msg`} role="alert">
              {errors.phone ?? (shownDuplicate && (
                <>
                  ⚠ {shownDuplicate.message}
                  {shownDuplicate.duplicates.length > 0 && (
                    <small>Trùng với: {shownDuplicate.duplicates.map((item) => item.fullName).join(', ')}. Bạn vẫn có thể lưu.</small>
                  )}
                </>
              ))}
            </span>
          </div>

          <div className="lead-field">
            <label htmlFor={`${uid}-source`}>
              Nguồn <span aria-hidden="true">*</span>
            </label>
            <select
              {...fieldProps('source')}
              aria-required="true"
              value={values.source}
              onChange={(event) => setField('source', event.target.value as LeadSource)}
            >
              {SOURCE_ORDER.map((source) => (
                <option key={source} value={source}>{SOURCE_LABEL[source]}</option>
              ))}
            </select>
            <span className="lead-error-text" id={`${uid}-source-msg`} role="alert">{errors.source}</span>
          </div>

          <div className="lead-field lead-field-full">
            <label htmlFor={`${uid}-interestedProgram`}>
              Chương trình quan tâm <span aria-hidden="true">*</span>
            </label>
            <select
              {...fieldProps('interestedProgram')}
              aria-required="true"
              className={errors.interestedProgram ? 'lead-input-error' : undefined}
              value={values.interestedProgram}
              onChange={(event) => setField('interestedProgram', event.target.value)}
            >
              <option value="">Chọn chương trình</option>
              {programs.map((program) => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
            <span className="lead-error-text" id={`${uid}-interestedProgram-msg`} role="alert">{errors.interestedProgram}</span>
          </div>
        </div>

        {formError && (
          <p className="lead-form-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{formError}</span>
          </p>
        )}

        <div className="lead-form-actions">
          <button type="button" className="lead-cancel-button" disabled={submitting} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="lead-save-button" disabled={submitting}>
            {submitting && <LoaderCircle size={14} className="lead-spin" aria-hidden="true" />}
            {submitting ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Lưu'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
