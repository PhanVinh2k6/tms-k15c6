import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  LockKeyhole,
  LockOpen,
  Plus,
  RefreshCw,
  Shield,
  SquarePen,
  Trash2,
  UserX,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import { ApiError, createUser, deleteUser, getCurrentUserId, getSession, logout, updateUser } from '../account-lock/api'
import { formatDateTime } from '../account-lock/format'
import { ROLE_LABEL, STATUS_LABEL } from '../account-lock/types'
import type { UserAccount, UserStatus } from '../account-lock/types'
import {
  DeleteUserDialog,
  HandoverAlert,
  LockDialog,
  UnlockDialog,
  UserFormDialog,
  UserSearchBar,
  staleNotice,
  toCreatePayload,
  toUpdatePayload,
  useLockUnlock,
  useUserSearch,
} from '../user-management'
import type { FormValues, Notice } from '../user-management'
import './user-account.css'

const PAGE_SIZE = 10

/** Xóa bị từ chối vì quy tắc nghiệp vụ: báo cho người dùng, không phải dữ liệu cũ. */
const DELETE_RULE_CODES = new Set(['CANNOT_DELETE_SELF', 'CANNOT_DELETE_LAST_ADMIN'])

type LoadError = { kind: 'network' | 'denied' | 'other'; message: string }

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

/** Nhãn trạng thái theo thiết kế Figma: chấm màu + chữ Active / Locked / Pending. */
const STATUS_TEXT: Record<UserStatus, string> = { ACTIVE: 'Active', LOCKED: 'Locked', PENDING_ACTIVATION: 'Pending' }

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`acl-badge acl-badge-${status.toLowerCase().replace('_', '-')}`} title={STATUS_LABEL[status]}>
      <i className="acl-badge-dot" aria-hidden="true" />
      {STATUS_TEXT[status]}
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
  onEdit: (account: UserAccount) => void
  onLock: (account: UserAccount) => void
  onUnlock: (account: UserAccount) => void
  onDelete: (account: UserAccount) => void
}

function RowAction({ account, isSelf, onEdit, onLock, onUnlock, onDelete }: RowActionProps) {
  return (
    <span className="acl-row-actions">
      {account.status === 'LOCKED' ? (
        <button
          type="button"
          className="acl-button acl-button-unlock"
          aria-label={`Mở khóa tài khoản ${account.fullName}`}
          onClick={() => onUnlock(account)}
        >
          <LockOpen size={14} aria-hidden="true" />
          Mở khóa
        </button>
      ) : isSelf ? (
        <span className="acl-muted">Tài khoản của bạn</span>
      ) : (
        <button
          type="button"
          className="acl-button acl-button-lock"
          aria-label={`Khóa tài khoản ${account.fullName}`}
          onClick={() => onLock(account)}
        >
          <Lock size={14} aria-hidden="true" />
          Khóa
        </button>
      )}
      <button
        type="button"
        className="acl-icon-action"
        aria-label={`Sửa tài khoản ${account.fullName}`}
        title="Sửa"
        onClick={() => onEdit(account)}
      >
        <SquarePen size={17} aria-hidden="true" />
      </button>
      {isSelf ? (
        <span className="acl-icon-action acl-icon-action-off" aria-hidden="true" />
      ) : (
        <button
          type="button"
          className="acl-icon-action acl-icon-action-danger"
          aria-label={`Xóa tài khoản ${account.fullName}`}
          title="Xóa"
          onClick={() => onDelete(account)}
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

/**
 * Render account management for an ADMIN session, or a sign-in/access-denied message.
 * Provide search, account actions, and logout controls; the backend enforces permissions.
 */
export function UserAccountPage() {
  const session = getSession()
  const currentUserId = getCurrentUserId()

  // Tìm kiếm, lọc, phân trang: hook useUserSearch (src/features/user-management).
  const search = useUserSearch(PAGE_SIZE)
  const { data, loading, filtering, setPage, clearFilters, reload } = search
  const loadError: LoadError | null = search.error ? toLoadError(search.error) : null

  const [creating, setCreating] = useState(false)
  const [editTarget, setEditTarget] = useState<UserAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  // Khoá / mở khoá (S1-10): hook useLockUnlock (src/features/user-management).
  const lock = useLockUnlock({ onNotice: setNotice, reload })

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

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
      setNotice({ kind: 'success', text: `Đã xóa tài khoản ${target.fullName}.` })
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

  const items = data?.items ?? []
  const firstShown = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const lastShown = data ? firstShown + items.length - 1 : 0
  const tableData = !loadError && data !== null && items.length > 0 ? data : null

  if (!session || !session.roles?.includes('ADMIN')) {
    return <main className="acl-state" role="alert"><Shield size={30} aria-hidden="true" /><h1>{session ? 'Không có quyền truy cập' : 'Phiên đăng nhập đã hết hạn'}</h1><p>{session ? 'Chỉ Quản trị hệ thống mới được quản lý tài khoản.' : 'Vui lòng đăng nhập lại để tiếp tục.'}</p><button type="button" className="acl-button acl-button-primary" onClick={async () => { await logout(); window.location.assign('/') }}>Đăng nhập lại</button></main>
  }

  return (
    <div className="acl-page">
      <aside className="acl-sidebar">
        <div className="acl-sidebar-brand">
          <Shield size={27} aria-hidden="true" />
          <span>TMS System</span>
        </div>
        <nav className="acl-sidebar-nav" aria-label="Điều hướng">
          <span className="acl-nav-current" aria-current="page">
            <Users size={19} aria-hidden="true" />
            Quản lý tài khoản
          </span>
          <a className="acl-nav-link" href="admin-account-lock.html">
            <LockKeyhole size={19} aria-hidden="true" />
            Khóa / Mở khóa tài khoản
          </a>
          <button type="button" className="acl-nav-back" onClick={() => window.history.back()}>
            <ChevronLeft size={15} aria-hidden="true" />
            Quay lại
          </button>
        </nav>
        <div className="acl-sidebar-user"><strong>{session.email ?? 'Tài khoản'}</strong><span>Vai trò: {session.roles?.join(', ')}</span></div>
        <button type="button" className="acl-nav-back" onClick={async () => { await logout(); window.location.assign('/') }}>Đăng xuất</button>
        <p className="acl-sidebar-foot">Nền tảng vận hành đào tạo TMS</p>
      </aside>

      <main className="acl-main">
        <div className="acl-title-row">
          <div>
            <h1>S1-08: Quản Lý Tài Khoản</h1>
            <p>Danh sách người dùng và phân quyền hệ thống TMS</p>
          </div>
          <button type="button" className="acl-add" onClick={() => setCreating(true)}>
            <Plus size={17} aria-hidden="true" />
            Thêm tài khoản
          </button>
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
          <UserSearchBar
            searchInput={search.searchInput}
            onSearchChange={search.setSearchInput}
            role={search.role}
            onRoleChange={search.setRole}
            status={search.status}
            onStatusChange={search.setStatus}
          />

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
                <p>{filtering ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Bấm “Thêm tài khoản” để tạo tài khoản đầu tiên.'}</p>
                {filtering && (
                  <button
                    type="button"
                    className="acl-button acl-button-outline"
                    onClick={clearFilters}
                  >
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
                        ID
                      </th>
                      <th scope="col">Tên người dùng</th>
                      <th scope="col">Email</th>
                      <th scope="col">Vai trò</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col" className="acl-col-action">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((account, index) => (
                      <tr key={account.id} className={account.status === 'LOCKED' ? 'acl-row-locked' : undefined}>
                        <td className="acl-col-id">#{(tableData.page - 1) * tableData.pageSize + index + 1}</td>
                        <td>
                          <strong className="acl-name">{account.fullName}</strong>
                          {account.phone && <span className="acl-sub">{account.phone}</span>}
                        </td>
                        <td className="acl-email">{account.email}</td>
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
                            onLock={lock.startLock}
                            onUnlock={lock.startUnlock}
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
                            onLock={lock.startLock}
                            onUnlock={lock.startUnlock}
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

      {lock.lockTarget && <LockDialog account={lock.lockTarget} onConfirm={lock.confirmLock} onClose={lock.cancelLock} />}
      {lock.unlockTarget && <UnlockDialog account={lock.unlockTarget} onConfirm={lock.confirmUnlock} onClose={lock.cancelUnlock} />}
      {creating && <UserFormDialog onSubmit={confirmCreate} onClose={() => setCreating(false)} />}
      {editTarget && <UserFormDialog account={editTarget} onSubmit={confirmEdit} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteUserDialog account={deleteTarget} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />}
    </div>
  )
}
