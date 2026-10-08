import { useId, useState } from 'react'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { Modal } from '../account-lock/Modal'
import type { Lead } from './types'

type DeleteLeadDialogProps = {
  lead: Lead
  /** Gọi API xoá; trang cha xử lý kết quả (kể cả 403 từ server). */
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function DeleteLeadDialog({ lead, onConfirm, onClose }: DeleteLeadDialogProps) {
  const uid = useId()
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal titleId={`${uid}-title`} title="Xóa Lead" busy={busy} onClose={onClose}>
      <div className="lead-form">
        <p className="lead-confirm-text">
          Bạn có chắc chắn muốn xóa lead <strong>{lead.fullName}</strong> ({lead.phone}) không? Thao tác này không hoàn tác được.
        </p>
        <div className="lead-form-actions">
          <button type="button" className="lead-cancel-button" data-autofocus disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="lead-danger-button" disabled={busy} onClick={confirm}>
            {busy ? <LoaderCircle size={14} className="lead-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
            {busy ? 'Đang xóa…' : 'Xóa'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
