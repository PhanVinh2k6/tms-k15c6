import { useCallback, useEffect, useRef, useState } from 'react'
import { listUsers } from '../account-lock/api'
import type { RoleFilter, StatusFilter, UserPage } from '../account-lock/types'

export const DEFAULT_PAGE_SIZE = 10
export const SEARCH_DEBOUNCE_MS = 350

export type UserSearchState = {
  /** Chữ đang gõ trong ô tìm kiếm (chưa chắc đã gửi lên server). */
  searchInput: string
  /** Từ khoá đã áp dụng (sau khi người dùng ngừng gõ). */
  q: string
  status: StatusFilter
  role: RoleFilter
  page: number
  data: UserPage | null
  loading: boolean
  /** Lỗi lần tải gần nhất, null nếu tải được. Trang tự quyết định hiển thị lỗi thế nào. */
  error: unknown
  /** Đang có từ khoá hoặc bộ lọc nào đó. */
  filtering: boolean
  setSearchInput: (value: string) => void
  setStatus: (value: StatusFilter) => void
  setRole: (value: RoleFilter) => void
  setPage: (page: number) => void
  /** Bỏ từ khoá và mọi bộ lọc, quay về trang 1. */
  clearFilters: () => void
  /** Tải lại trang hiện tại (sau khi thêm / sửa / xoá). */
  reload: () => void
}

/**
 * Tìm kiếm, lọc và phân trang danh sách tài khoản (S1-08).
 *
 * - Gõ tìm kiếm: đợi người dùng ngừng gõ SEARCH_DEBOUNCE_MS rồi mới gọi API và quay về trang 1.
 * - Đổi bộ lọc: quay về trang 1.
 * - Gõ nhanh / đổi bộ lọc liên tục: huỷ yêu cầu cũ, chỉ lấy kết quả của yêu cầu mới nhất.
 * - Trang hiện tại không còn (vừa xoá dòng cuối của trang cuối): tự lùi về trang cuối còn lại.
 */
export function useUserSearch(pageSize: number = DEFAULT_PAGE_SIZE): UserSearchState {
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatusState] = useState<StatusFilter>('')
  const [role, setRoleState] = useState<RoleFilter>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [data, setData] = useState<UserPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  // Chỉ đặt lại trang khi từ khoá thật sự đổi, để bấm "Trang sau" ngay lúc mở trang không bị kéo về trang 1.
  const appliedQuery = useRef('')
  useEffect(() => {
    const next = searchInput.trim()
    if (next === appliedQuery.current) return
    const timer = window.setTimeout(() => {
      appliedQuery.current = next
      setQ(next)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    listUsers({ q, status, role, page, pageSize }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        if (result.totalPages > 0 && page > result.totalPages) {
          setPage(result.totalPages)
          return
        }
        setData(result)
        setLoading(false)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason)
        setLoading(false)
      })
    return () => controller.abort()
  }, [q, status, role, page, pageSize, reloadKey])

  const setStatus = useCallback((value: StatusFilter) => {
    setStatusState(value)
    setPage(1)
  }, [])

  const setRole = useCallback((value: RoleFilter) => {
    setRoleState(value)
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchInput('')
    appliedQuery.current = ''
    setQ('')
    setStatusState('')
    setRoleState('')
    setPage(1)
  }, [])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return {
    searchInput,
    q,
    status,
    role,
    page,
    data,
    loading,
    error,
    filtering: q !== '' || status !== '' || role !== '',
    setSearchInput,
    setStatus,
    setRole,
    setPage,
    clearFilters,
    reload,
  }
}
