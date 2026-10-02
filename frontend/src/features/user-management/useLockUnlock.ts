import { useState } from 'react'
import { ApiError, lockUser, unlockUser } from '../account-lock/api'
import type { HandoverWarning, UserAccount } from '../account-lock/types'

/** Thông báo ngắn hiện trên đầu trang sau mỗi thao tác. */
export type Notice = { kind: 'success' | 'warning'; text: string }

/** Cảnh báo bàn giao lớp học sau khi khoá một tài khoản đang phụ trách lớp. */
export type HandoverNotice = { name: string; warning: HandoverWarning }

/** Dữ liệu trên màn hình đã cũ so với server (người khác vừa khoá / mở khoá / xoá): báo rồi tải lại, không coi là lỗi. */
export const STALE_CODES = new Set(['ALREADY_LOCKED', 'NOT_LOCKED', 'USER_NOT_FOUND'])

export function staleNotice(error: ApiError, name: string): Notice {
  if (error.code === 'ALREADY_LOCKED') {
    return { kind: 'warning', text: `Tài khoản ${name} đã được khóa từ trước (có thể do người khác vừa khóa). Danh sách đã được tải lại.` }
  }
  if (error.code === 'NOT_LOCKED') {
    return { kind: 'warning', text: `Tài khoản ${name} hiện không bị khóa (có thể do người khác vừa mở khóa). Danh sách đã được tải lại.` }
  }
  return { kind: 'warning', text: `Không còn tìm thấy tài khoản ${name}. Danh sách đã được tải lại.` }
}

type Options = {
  /** Hiện thông báo trên trang. */
  onNotice: (notice: Notice) => void
  /** Tải lại danh sách sau khi khoá / mở khoá. */
  reload: () => void
}

/**
 * Luồng khoá / mở khoá tài khoản (S1-10), dùng chung cho trang Quản lý tài khoản và trang Khoá / Mở khoá.
 *
 * - Khoá: POST /users/:id/lock kèm lý do; nếu backend trả `handoverWarning` thì giữ lại để trang hiện cảnh báo bàn giao.
 * - Mở khoá: POST /users/:id/unlock.
 * - ALREADY_LOCKED / NOT_LOCKED / USER_NOT_FOUND: đóng hộp thoại, báo dữ liệu đã cũ và tải lại danh sách.
 * - Lỗi khác (mạng, CANNOT_LOCK_SELF, lý do không hợp lệ…): ném lại để hộp thoại hiện lỗi và giữ nguyên lý do đã gõ.
 */
export function useLockUnlock({ onNotice, reload }: Options) {
  const [lockTarget, setLockTarget] = useState<UserAccount | null>(null)
  const [unlockTarget, setUnlockTarget] = useState<UserAccount | null>(null)
  const [handover, setHandover] = useState<HandoverNotice | null>(null)

  const confirmLock = async (reason: string) => {
    const target = lockTarget
    if (!target) return
    try {
      const result = await lockUser(target.id, reason)
      setLockTarget(null)
      onNotice({ kind: 'success', text: `Đã khóa tài khoản ${target.fullName}.` })
      setHandover(result.handoverWarning ? { name: target.fullName, warning: result.handoverWarning } : null)
      reload()
    } catch (error) {
      if (error instanceof ApiError && STALE_CODES.has(error.code)) {
        setLockTarget(null)
        onNotice(staleNotice(error, target.fullName))
        reload()
        return
      }
      throw error
    }
  }

  const confirmUnlock = async () => {
    const target = unlockTarget
    if (!target) return
    try {
      await unlockUser(target.id)
      setUnlockTarget(null)
      onNotice({ kind: 'success', text: `Đã mở khóa tài khoản ${target.fullName}.` })
      reload()
    } catch (error) {
      if (error instanceof ApiError && STALE_CODES.has(error.code)) {
        setUnlockTarget(null)
        onNotice(staleNotice(error, target.fullName))
        reload()
        return
      }
      throw error
    }
  }

  return {
    lockTarget,
    unlockTarget,
    handover,
    /** Mở hộp thoại khoá cho tài khoản này. */
    startLock: setLockTarget,
    /** Mở hộp thoại mở khoá cho tài khoản này. */
    startUnlock: setUnlockTarget,
    cancelLock: () => setLockTarget(null),
    cancelUnlock: () => setUnlockTarget(null),
    dismissHandover: () => setHandover(null),
    confirmLock,
    confirmUnlock,
  }
}
