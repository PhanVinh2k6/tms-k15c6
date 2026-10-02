import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Funnel,
  Lock,
  LockKeyhole,
  LockOpen,
  RefreshCw,
  Search,
  Shield,
  UserX,
  WifiOff,
  X,
} from 'lucide-react'
import { ApiError, getCurrentUserId } from './api'
import { formatDateTime } from './format'
import { ROLE_LABEL, ROLE_ORDER } from './types'
import type { RoleFilter, StatusFilter, UserAccount, UserStatus } from './types'
import { HandoverAlert, LockDialog, UnlockDialog, useLockUnlock, useUserSearch } from '../user-management'
import type { Notice } from '../user-management'
import './account-lock.css'

const PAGE_SIZE = 10

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'PENDING_ACTIVATION', label: 'Chờ kích hoạt' },
  { value: 'LOCKED', label: 'Đã khóa' },
]

/** Nhãn trạng thái theo thiết kế Figma S1-10. */
const STATUS_TEXT: Record<UserStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  LOCKED: 'Đã khóa',
  PENDING_ACTIVATION: 'Chờ kích hoạt',
}

type LoadError = { kind: 'network' | 'denied' | 'other'; message: string }

function toLoadError(error: unknown): LoadError {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return { kind: 'network', message: error.message }
    if (error.status === 401) {
      return { kind: 'denied', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.' }
    }
    if (error.status === 403) {
      return { kind: 'denied', message: 'Chỉ Quản trị hệ thống mới được xem và khóa / mở khóa tài khoản.' }
    }
    return { kind: 'other', message: error.message }
  }
  return { kind: 'other', message: 'Không tải được danh sách tài khoản.' }
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`acl-badge acl-badge-${status.toLowerCase().replace('_', '-')}`}>
      <i className="acl-badge-dot" aria-hidden="true" />
      {STATUS_TEXT[status]}
    </span>
  )
}

/**
 * Cột "Phiên" của thiết kế. Backend chưa có dữ liệu phiên đăng nhập (S1-02), nên chỉ hiện điều chắc chắn:
 * khóa tài khoản thu hồi mọi phiên (sessionVersion tăng), tài khoản chưa kích hoạt thì chưa từng đăng nhập.
 */
function SessionInfo({ status }: { status: UserStatus }) {
  if (status === 'LOCKED') return <span className="acl-session acl-session-none">Không có phiên</span>
  if (status === 'PENDING_ACTIVATION') return <span className="acl-session acl-session-none">Chưa đăng nhập</span>
  return (
    <span className="acl-session acl-session-none" title="Chưa có dữ liệu phiên đăng nhập (cần API của S1-02)">
      —
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
      {account.lockedAt && <small>Khóa lúc {formatDateTime(account.lockedAt)}</small>}
    </span>
  )
}

type RowActionProps = {
  account: UserAccount
  isSelf: boolean
  onLock: (account: UserAccount) => void
  onUnlock: (account: UserAccount) => void
}

function RowAction({ account, isSelf, onLock, onUnlock }: RowActionProps) {
  if (account.status === 'LOCKED') {
    return (
      <button
        type="button"
        className="acl-button acl-button-unlock"
        aria-label={`Mở khóa tài khoản ${account.fullName}`}
        onClick={() => onUnlock(account)}
      >
        <LockOpen size={14} aria-hidden="true" />
        Mở khóa
      </button>
    )
  }
  if (isSelf) return <span className="acl-muted">Tài khoản của bạn</span>
  return (
    <button
      type="button"
      className="acl-button acl-button-lock"
      aria-label={`Khóa tài khoản ${account.fullName}`}
      onClick={() => onLock(account)}
    >
      <Lock size={14} aria-hidden="true" />
      Khóa
    </button>
  )
}

export function AccountLockPage() {
  const currentUserId = getCurrentUserId()

  // Tìm kiếm, lọc, phân trang: hook useUserSearch; khoá / mở khoá: hook useLockUnlock (src/features/user-management).
  const search = useUserSearch(PAGE_SIZE)
  const { data, loading, filtering, setPage, clearFilters, reload } = search
  const loadError: LoadError | null = search.error ? toLoadError(search.error) : null

  const [notice, setNotice] = useState<Notice | null>(null)
  const lock = useLockUnlock({ onNotice: setNotice, reload })

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const items = data?.items ?? []
  const firstShown = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const lastShown = data ? firstShown + items.length - 1 : 0
  const tableData = !loadError && data !== null && items.length > 0 ? data : null

  return (
    <div className="acl-page">
      <aside className="acl-sidebar">
        <div className="acl-sidebar-brand">
          <Shield size={48} strokeWidth={1.6} aria-hidden="true" />
          <span>TMS System</span>
        </div>
        <nav className="acl-sidebar-nav" aria-label="Điều hướng">
          <span className="acl-nav-current" aria-current="page">
            <LockKeyhole size={16} aria-hidden="true" />
            Khóa / Mở khóa tài khoản
          </span>
          <button type="button" className="acl-nav-back" onClick={() => window.history.back()}>
            <ChevronLeft size={18} aria-hidden="true" />
            Quay lại
          </button>
        </nav>
        <p className="acl-sidebar-foot">Nền tảng vận hành đào tạo TMS</p>
      </aside>

      <main className="acl-main">
        <div className="acl-title-row">
          <div>
            <h1>S1-10: Khóa &amp; Mở khóa tài khoản</h1>
            <p>Quản trị hệ thống có thể khóa hoặc mở khóa tài khoản người dùng</p>
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

        <HandoverAlert handover={lock.handover} onDismiss={lock.dismissHandover} />

        <section className="acl-card" aria-label="Danh sách tài khoản">
          <div className="acl-toolbar">
            <div className="acl-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={search.searchInput}
                maxLength={100}
                placeholder="Tìm kiếm tài khoản, email..."
                aria-label="Tìm tài khoản theo tên, email hoặc số điện thoại"
                onChange={(event) => search.setSearchInput(event.target.value)}
              />
            </div>
            <div className="acl-filter-group">
              <Funnel className="acl-filter-icon" size={34} strokeWidth={1.4} aria-hidden="true" />
              <span className="acl-select-box">
                <select
                  value={search.status}
                  aria-label="Lọc theo trạng thái"
                  onChange={(event) => search.setStatus(event.target.value as StatusFilter)}
                >
                  {STATUS_FILTERS.map((filter) => (
                    <option key={filter.label} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
              <span className="acl-select-box">
                <select
                  value={search.role}
                  aria-label="Lọc theo vai trò"
                  onChange={(event) => search.setRole(event.target.value as RoleFilter)}
                >
                  <option value="">Tất cả vai trò</option>
                  {ROLE_ORDER.map((item) => (
                    <option key={item} value={item}>
                      {ROLE_LABEL[item]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            </div>
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
                <p>{filtering ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Tài khoản sẽ hiện ở đây sau khi được tạo.'}</p>
                {filtering && (
                  <button type="button" className="acl-button acl-button-ghost" onClick={clearFilters}>
                    Xóa bộ lọc
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
                      <th scope="col" className="acl-col-id">
                        STT
                      </th>
                      <th scope="col">Tên người dùng</th>
                      <th scope="col">Email</th>
                      <th scope="col">Vai trò</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col">Phiên</th>
                      <th scope="col" className="acl-col-action">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((account, index) => (
                      <tr key={account.id} className={account.status === 'LOCKED' ? 'acl-row-locked' : undefined}>
                        <td className="acl-col-id">{(tableData.page - 1) * tableData.pageSize + index + 1}</td>
                        <td>
                          <strong className="acl-name">{account.fullName}</strong>
                        </td>
                        <td className="acl-email">{account.email}</td>
                        <td>
                          <RoleChips roles={account.roles} />
                        </td>
                        <td>
                          <StatusBadge status={account.status} />
                          <LockedInfo account={account} />
                        </td>
                        <td>
                          <SessionInfo status={account.status} />
                        </td>
                        <td className="acl-col-action">
                          <RowAction account={account} isSelf={account.id === currentUserId} onLock={lock.startLock} onUnlock={lock.startUnlock} />
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
                        </span>
                        <StatusBadge status={account.status} />
                      </div>
                      <RoleChips roles={account.roles} />
                      <LockedInfo account={account} />
                      <div className="acl-account-card-action">
                        <SessionInfo status={account.status} />
                        <RowAction account={account} isSelf={account.id === currentUserId} onLock={lock.startLock} onUnlock={lock.startUnlock} />
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

      {lock.lockTarget && <LockDialog account={lock.lockTarget} onConfirm={lock.confirmLock} onClose={lock.cancelLock} />}
      {lock.unlockTarget && <UnlockDialog account={lock.unlockTarget} onConfirm={lock.confirmUnlock} onClose={lock.cancelUnlock} />}
    </div>
  )
}
