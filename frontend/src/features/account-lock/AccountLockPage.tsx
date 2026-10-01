import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  LockOpen,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  UserX,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import { ApiError, createUser, deleteUser, getCurrentUserId, listUsers, lockUser, unlockUser, updateUser } from './api'
import { DeleteDialog, LockDialog, UnlockDialog } from './ActionDialogs'
import { UserFormDialog } from './UserFormDialog'
import { formatDateTime } from './format'
import { ROLE_LABEL, ROLE_ORDER, STATUS_LABEL } from './types'
import type { HandoverWarning, RoleFilter, StatusFilter, UserAccount, UserPage, UserStatus } from './types'
import { toCreatePayload, toUpdatePayload } from './validation'
import type { FormValues } from './validation'
import './account-lock.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 350

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'PENDING_ACTIVATION', label: 'Chờ kích hoạt' },
  { value: 'LOCKED', label: 'Đã khoá' },
]

/** Dữ liệu đã cũ so với server: báo rồi tải lại danh sách, không coi là lỗi của người dùng. */
const STALE_CODES = new Set(['ALREADY_LOCKED', 'NOT_LOCKED', 'USER_NOT_FOUND'])

/** Xoá bị từ chối vì quy tắc nghiệp vụ: báo cho người dùng, không phải dữ liệu cũ. */
const DELETE_RULE_CODES = new Set(['CANNOT_DELETE_SELF', 'CANNOT_DELETE_LAST_ADMIN'])

type Notice = { kind: 'success' | 'warning'; text: string }
type LoadError = { kind: 'network' | 'denied' | 'other'; message: string }
type HandoverNotice = { name: string; warning: HandoverWarning }

function toLoadError(error: unknown): LoadError {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return { kind: 'network', message: error.message }
    if (error.status === 401) {
      return { kind: 'denied', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.' }
    }
    if (error.status === 403) {
      return { kind: 'denied', message: 'Chỉ Quản trị hệ thống mới được xem và quản lý tài khoản.' }
    }
    return { kind: 'other', message: error.message }
  }
  return { kind: 'other', message: 'Không tải được danh sách tài khoản.' }
}

function StatusBadge({ status }: { status: UserStatus }) {
  const Icon = status === 'LOCKED' ? Lock : status === 'ACTIVE' ? CheckCircle2 : Clock3
  return (
    <span className={`acl-badge acl-badge-${status.toLowerCase().replace('_', '-')}`}>
      <Icon size={13} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  )
}

function RoleChips({ roles }: { roles: UserAccount['roles'] }) {
  if (roles.length === 0) return <span className="acl-muted">Chưa có vai trò</span>
  return (
    <span className="acl-chips">
      {roles.map((role) => (
        <span className="acl-chip" key={role}>
          {ROLE_LABEL[role] ?? role}
        </span>
      ))}
    </span>
  )
}

function LockedInfo({ account }: { account: UserAccount }) {
  if (account.status !== 'LOCKED') return null
  return (
    <span className="acl-locked-info">
      {account.lockedReason ? <>Lý do: {account.lockedReason}</> : 'Không có lý do được ghi'}
      {account.lockedAt && <small>Khoá lúc {formatDateTime(account.lockedAt)}</small>}
    </span>
  )
}

type RowActionProps = {
  account: UserAccount
  isSelf: boolean
  onEdit: (account: UserAccount) => void
  onLock: (account: UserAccount) => void
  onUnlock: (account: UserAccount) => void
  onDelete: (account: UserAccount) => void
}

function RowAction({ account, isSelf, onEdit, onLock, onUnlock, onDelete }: RowActionProps) {
  return (
    <span className="acl-row-actions">
      <button
        type="button"
        className="acl-button acl-button-outline"
        aria-label={`Sửa tài khoản ${account.fullName}`}
        onClick={() => onEdit(account)}
      >
        <Pencil size={15} aria-hidden="true" />
        Sửa
      </button>
      {account.status === 'LOCKED' ? (
        <button
          type="button"
          className="acl-button acl-button-outline"
          aria-label={`Mở khoá tài khoản ${account.fullName}`}
          onClick={() => onUnlock(account)}
        >
          <LockOpen size={15} aria-hidden="true" />
          Mở khoá
        </button>
      ) : isSelf ? null : (
        <button
          type="button"
          className="acl-button acl-button-outline acl-button-outline-danger"
          aria-label={`Khoá tài khoản ${account.fullName}`}
          onClick={() => onLock(account)}
        >
          <Lock size={15} aria-hidden="true" />
          Khoá
        </button>
      )}
      {isSelf ? (
        <span className="acl-muted">Tài khoản của bạn</span>
      ) : (
        <button
          type="button"
          className="acl-button acl-button-outline acl-button-outline-danger"
          aria-label={`Xoá tài khoản ${account.fullName}`}
          onClick={() => onDelete(account)}
        >
          <Trash2 size={15} aria-hidden="true" />
          Xoá
        </button>
      )}
    </span>
  )
}

export function AccountLockPage() {
  const currentUserId = getCurrentUserId()

  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [role, setRole] = useState<RoleFilter>('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  const [data, setData] = useState<UserPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<LoadError | null>(null)

  const [lockTarget, setLockTarget] = useState<UserAccount | null>(null)
  const [unlockTarget, setUnlockTarget] = useState<UserAccount | null>(null)
  const [creating, setCreating] = useState(false)
  const [editTarget, setEditTarget] = useState<UserAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [handover, setHandover] = useState<HandoverNotice | null>(null)

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  // Gõ tìm kiếm: đợi người dùng ngừng gõ rồi mới gọi API và quay về trang 1.
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
    setLoadError(null)
    listUsers({ q, status, role, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        if (result.totalPages > 0 && page > result.totalPages) {
          setPage(result.totalPages) // trang hiện tại không còn (vừa đổi bộ lọc / dữ liệu thay đổi)
          return
        }
        setData(result)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(toLoadError(error))
        setLoading(false)
      })
    return () => controller.abort()
  }, [q, status, role, page, reloadKey])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const staleNotice = (error: ApiError, name: string): Notice => {
    if (error.code === 'ALREADY_LOCKED') {
      return { kind: 'warning', text: `Tài khoản ${name} đã được khoá từ trước (có thể do người khác vừa khoá). Danh sách đã được tải lại.` }
    }
    if (error.code === 'NOT_LOCKED') {
      return { kind: 'warning', text: `Tài khoản ${name} hiện không bị khoá (có thể do người khác vừa mở khoá). Danh sách đã được tải lại.` }
    }
    return { kind: 'warning', text: `Không còn tìm thấy tài khoản ${name}. Danh sách đã được tải lại.` }
  }

  const clearFilters = () => {
    setSearchInput('')
    appliedQuery.current = ''
    setQ('')
    setStatus('')
    setRole('')
    setPage(1)
  }

  const confirmCreate = async (values: FormValues) => {
    const created = await createUser(toCreatePayload(values))
    setCreating(false)
    setNotice({ kind: 'success', text: `Đã tạo tài khoản ${created.fullName}. Email kích hoạt đã được gửi tới ${created.email}.` })
    clearFilters() // tài khoản mới xếp đầu danh sách; bỏ bộ lọc để người dùng thấy ngay
    reload()
  }

  const confirmEdit = async (values: FormValues) => {
    const target = editTarget
    if (!target) return
    const payload = toUpdatePayload(values, target)
    if (Object.keys(payload).length === 0) {
      setEditTarget(null)
      setNotice({ kind: 'warning', text: `Không có thay đổi nào cho tài khoản ${target.fullName}.` })
      return
    }
    try {
      const updated = await updateUser(target.id, payload)
      setEditTarget(null)
      setNotice({ kind: 'success', text: `Đã cập nhật tài khoản ${updated.fullName}.` })
      reload()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'USER_NOT_FOUND') {
        setEditTarget(null)
        setNotice(staleNotice(error, target.fullName))
        reload()
        return
      }
      throw error
    }
  }

  const confirmDelete = async () => {
    const target = deleteTarget
    if (!target) return
    try {
      await deleteUser(target.id)
      setDeleteTarget(null)
      setNotice({ kind: 'success', text: `Đã xoá tài khoản ${target.fullName}.` })
      reload()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'USER_NOT_FOUND') {
        setDeleteTarget(null)
        setNotice(staleNotice(error, target.fullName))
        reload()
        return
      }
      if (error instanceof ApiError && DELETE_RULE_CODES.has(error.code)) {
        setDeleteTarget(null)
        setNotice({ kind: 'warning', text: error.message })
        return
      }
      throw error
    }
  }

  const confirmLock = async (reason: string) => {
    const target = lockTarget
    if (!target) return
    try {
      const result = await lockUser(target.id, reason)
      setLockTarget(null)
      setNotice({ kind: 'success', text: `Đã khoá tài khoản ${target.fullName}.` })
      setHandover(result.handoverWarning ? { name: target.fullName, warning: result.handoverWarning } : null)
      reload()
    } catch (error) {
      if (error instanceof ApiError && STALE_CODES.has(error.code)) {
        setLockTarget(null)
        setNotice(staleNotice(error, target.fullName))
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
      setNotice({ kind: 'success', text: `Đã mở khoá tài khoản ${target.fullName}.` })
      reload()
    } catch (error) {
      if (error instanceof ApiError && STALE_CODES.has(error.code)) {
        setUnlockTarget(null)
        setNotice(staleNotice(error, target.fullName))
        reload()
        return
      }
      throw error
    }
  }

  const items = data?.items ?? []
  const filtering = q !== '' || status !== '' || role !== ''
  const firstShown = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const lastShown = data ? firstShown + items.length - 1 : 0
  const tableData = !loadError && data !== null && items.length > 0 ? data : null

  return (
    <div className="acl-page">
      <header className="acl-topbar">
        <span className="acl-brand">
          <span className="acl-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          TMS.
        </span>
        <span className="acl-topbar-role">Quản trị hệ thống</span>
      </header>

      <main className="acl-main">
        <div className="acl-title-row">
          <div>
            <h1>Quản lý tài khoản</h1>
            <p>Thêm, sửa và tìm tài khoản; khoá khi người dùng nghỉ việc hoặc có dấu hiệu bất thường, mở khoá khi cần; xoá hẳn tài khoản tạo nhầm.</p>
          </div>
          <div className="acl-title-actions">
            {data && !loadError && (
              <span className="acl-total">
                <Users size={16} aria-hidden="true" />
                {data.total} tài khoản
              </span>
            )}
            <button type="button" className="acl-button acl-button-primary" onClick={() => setCreating(true)}>
              <UserPlus size={16} aria-hidden="true" />
              Thêm tài khoản
            </button>
          </div>
        </div>

        <div className="acl-live" aria-live="polite">
          {notice && (
            <div className={`acl-notice acl-notice-${notice.kind}`} role="status">
              {notice.kind === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
              <span>{notice.text}</span>
              <button type="button" className="acl-icon-button" aria-label="Ẩn thông báo" onClick={() => setNotice(null)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {handover && (
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
            <button type="button" className="acl-icon-button" aria-label="Đã đọc, ẩn cảnh báo bàn giao" onClick={() => setHandover(null)}>
              <X size={18} aria-hidden="true" />
            </button>
          </section>
        )}

        <section className="acl-card" aria-label="Danh sách tài khoản">
          <div className="acl-toolbar">
            <div className="acl-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                maxLength={100}
                placeholder="Tìm tên, email, số điện thoại"
                aria-label="Tìm tài khoản theo tên, email hoặc số điện thoại"
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <div className="acl-filters" role="group" aria-label="Lọc theo trạng thái">
              {FILTERS.map((filter) => (
                <button
                  type="button"
                  key={filter.label}
                  className={status === filter.value ? 'acl-filter acl-filter-active' : 'acl-filter'}
                  aria-pressed={status === filter.value}
                  onClick={() => {
                    setStatus(filter.value)
                    setPage(1)
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="acl-select-wrap">
              Vai trò
              <select
                className="acl-select"
                value={role}
                aria-label="Lọc theo vai trò"
                onChange={(event) => {
                  setRole(event.target.value as RoleFilter)
                  setPage(1)
                }}
              >
                <option value="">Tất cả vai trò</option>
                {ROLE_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {ROLE_LABEL[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="acl-body" aria-busy={loading}>
            {loadError && (
              <div className="acl-state" role="alert">
                {loadError.kind === 'network' ? <WifiOff size={30} aria-hidden="true" /> : <AlertTriangle size={30} aria-hidden="true" />}
                <h2>{loadError.kind === 'denied' ? 'Không có quyền truy cập' : 'Không tải được danh sách'}</h2>
                <p>{loadError.message}</p>
                {loadError.kind !== 'denied' && (
                  <button type="button" className="acl-button acl-button-primary" onClick={reload}>
                    <RefreshCw size={16} aria-hidden="true" />
                    Thử lại
                  </button>
                )}
              </div>
            )}

            {!loadError && loading && data === null && (
              <div className="acl-skeleton" aria-label="Đang tải danh sách">
                {[0, 1, 2, 3, 4].map((row) => (
                  <span key={row} />
                ))}
              </div>
            )}

            {!loadError && !loading && data !== null && items.length === 0 && (
              <div className="acl-state">
                <UserX size={30} aria-hidden="true" />
                <h2>{filtering ? 'Không có tài khoản phù hợp' : 'Chưa có tài khoản nào'}</h2>
                <p>{filtering ? 'Thử đổi từ khoá hoặc bộ lọc.' : 'Bấm “Thêm tài khoản” để tạo tài khoản đầu tiên.'}</p>
                {filtering && (
                  <button
                    type="button"
                    className="acl-button acl-button-outline"
                    onClick={clearFilters}
                  >
                    Xoá bộ lọc
                  </button>
                )}
              </div>
            )}

            {tableData && (
              <div className={loading ? 'acl-results acl-results-loading' : 'acl-results'}>
                <table className="acl-table">
                  <caption className="acl-sr-only">Danh sách tài khoản, trang {tableData.page}/{tableData.totalPages}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Tài khoản</th>
                      <th scope="col">Vai trò</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col" className="acl-col-action">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((account) => (
                      <tr key={account.id} className={account.status === 'LOCKED' ? 'acl-row-locked' : undefined}>
                        <td>
                          <span className="acl-person">
                            <strong>{account.fullName}</strong>
                            <span>{account.email}</span>
                            {account.phone && <span>{account.phone}</span>}
                          </span>
                        </td>
                        <td>
                          <RoleChips roles={account.roles} />
                        </td>
                        <td>
                          <StatusBadge status={account.status} />
                          <LockedInfo account={account} />
                        </td>
                        <td className="acl-col-action">
                          <RowAction
                            account={account}
                            isSelf={account.id === currentUserId}
                            onEdit={setEditTarget}
                            onLock={setLockTarget}
                            onUnlock={setUnlockTarget}
                            onDelete={setDeleteTarget}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <ul className="acl-cards">
                  {items.map((account) => (
                    <li key={account.id} className={account.status === 'LOCKED' ? 'acl-account-card acl-row-locked' : 'acl-account-card'}>
                      <div className="acl-account-card-head">
                        <span className="acl-person">
                          <strong>{account.fullName}</strong>
                          <span>{account.email}</span>
                          {account.phone && <span>{account.phone}</span>}
                        </span>
                        <StatusBadge status={account.status} />
                      </div>
                      <RoleChips roles={account.roles} />
                      <LockedInfo account={account} />
                      <div className="acl-account-card-action">
                        <RowAction
                            account={account}
                            isSelf={account.id === currentUserId}
                            onEdit={setEditTarget}
                            onLock={setLockTarget}
                            onUnlock={setUnlockTarget}
                            onDelete={setDeleteTarget}
                          />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {!loadError && data !== null && data.totalPages > 1 && (
            <nav className="acl-pager" aria-label="Phân trang">
              <span>
                Hiển thị {firstShown}–{lastShown} / {data.total}
              </span>
              <span className="acl-pager-controls">
                <button
                  type="button"
                  className="acl-icon-button acl-icon-button-boxed"
                  aria-label="Trang trước"
                  disabled={data.page <= 1 || loading}
                  onClick={() => setPage(data.page - 1)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <span>
                  Trang {data.page}/{data.totalPages}
                </span>
                <button
                  type="button"
                  className="acl-icon-button acl-icon-button-boxed"
                  aria-label="Trang sau"
                  disabled={data.page >= data.totalPages || loading}
                  onClick={() => setPage(data.page + 1)}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </span>
            </nav>
          )}
        </section>
      </main>

      {lockTarget && <LockDialog account={lockTarget} onConfirm={confirmLock} onClose={() => setLockTarget(null)} />}
      {unlockTarget && <UnlockDialog account={unlockTarget} onConfirm={confirmUnlock} onClose={() => setUnlockTarget(null)} />}
      {creating && <UserFormDialog onSubmit={confirmCreate} onClose={() => setCreating(false)} />}
      {editTarget && <UserFormDialog account={editTarget} onSubmit={confirmEdit} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteDialog account={deleteTarget} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />}
    </div>
  )
}
