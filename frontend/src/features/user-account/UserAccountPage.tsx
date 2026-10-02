import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Shield,
  SquarePen,
  UserX,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import { ApiError, createUser, updateUser } from '../account-lock/api'
import { formatDateTime } from '../account-lock/format'
import { ROLE_LABEL } from '../account-lock/types'
import type { UserAccount, UserStatus } from '../account-lock/types'
import { UserFormDialog, UserSearchBar, staleNotice, toCreatePayload, toUpdatePayload, useUserSearch } from '../user-management'
import type { FormValues, Notice } from '../user-management'
import './user-account.css'

/** Theo Figma: "20 dòng/trang" (khớp mặc định phân trang của backend S1-08). */
const PAGE_SIZE = 20

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

/** Nhãn trạng thái theo thiết kế Figma S1-08: chấm màu + chữ. */
const STATUS_TEXT: Record<UserStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  PENDING_ACTIVATION: 'Chờ kích hoạt',
  LOCKED: 'Đã khóa',
}

function lockedTitle(account: UserAccount): string | undefined {
  if (account.status !== 'LOCKED') return undefined
  const reason = account.lockedReason ? `Lý do: ${account.lockedReason}` : 'Không có lý do được ghi'
  return account.lockedAt ? `${reason} · Khóa lúc ${formatDateTime(account.lockedAt)}` : reason
}

function StatusBadge({ account }: { account: UserAccount }) {
  const { status } = account
  return (
    <span className={`acl-badge acl-badge-${status.toLowerCase().replace('_', '-')}`} title={lockedTitle(account)}>
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

function EditButton({ account, onEdit }: { account: UserAccount; onEdit: (account: UserAccount) => void }) {
  return (
    <button type="button" className="acl-edit" aria-label={`Sửa tài khoản ${account.fullName}`} onClick={() => onEdit(account)}>
      <SquarePen size={15} aria-hidden="true" />
      Sửa
    </button>
  )
}

export function UserAccountPage() {
  // Tìm kiếm, lọc, phân trang: hook useUserSearch (src/features/user-management).
  const search = useUserSearch(PAGE_SIZE)
  const { data, loading, filtering, setPage, clearFilters, reload } = search
  const loadError: LoadError | null = search.error ? toLoadError(search.error) : null

  const [creating, setCreating] = useState(false)
  const [editTarget, setEditTarget] = useState<UserAccount | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

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

  const items = data?.items ?? []
  const firstShown = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const lastShown = data ? firstShown + items.length - 1 : 0
  const tableData = !loadError && data !== null && items.length > 0 ? data : null
  const totalPages = data ? Math.max(1, data.totalPages) : 1

  return (
    <div className="acl-page">
      <aside className="acl-sidebar">
        <div className="acl-sidebar-brand">
          <Shield size={26} aria-hidden="true" />
          <span>TMS System</span>
        </div>
        <nav className="acl-sidebar-nav" aria-label="Điều hướng">
          <span className="acl-nav-current" aria-current="page">
            <Users size={18} aria-hidden="true" />
            Quản lý tài khoản
          </span>
          <button type="button" className="acl-nav-back" onClick={() => window.history.back()}>
            <ChevronLeft size={16} aria-hidden="true" />
            Quay lại
          </button>
        </nav>
        <p className="acl-sidebar-foot">Nền tảng vận hành đào tạo TMS</p>
      </aside>

      <main className="acl-main">
        <div className="acl-content">
          <div className="acl-title-row">
            <div>
              <h1>S1-08: Quản Lý Tài Khoản</h1>
              <p>Tạo, sửa và tìm kiếm tài khoản người dùng</p>
            </div>
            <button type="button" className="acl-add" onClick={() => setCreating(true)}>
              <Plus size={16} aria-hidden="true" />
              Tạo tài khoản
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
                  <p>{filtering ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Bấm “Tạo tài khoản” để tạo tài khoản đầu tiên.'}</p>
                  {filtering && (
                    <button type="button" className="acl-button acl-button-outline" onClick={clearFilters}>
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              )}

              {tableData && (
                <div className={loading ? 'acl-results acl-results-loading' : 'acl-results'}>
                  <table className="acl-table">
                    <caption className="acl-sr-only">
                      Danh sách tài khoản, trang {tableData.page}/{totalPages}
                    </caption>
                    <colgroup>
                      <col className="acl-col-stt" />
                      <col className="acl-col-name" />
                      <col className="acl-col-email" />
                      <col className="acl-col-phone" />
                      <col className="acl-col-role" />
                      <col className="acl-col-status" />
                      <col className="acl-col-action" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th scope="col">STT</th>
                        <th scope="col">Tên người dùng</th>
                        <th scope="col">Email</th>
                        <th scope="col">Số điện thoại</th>
                        <th scope="col">Vai trò</th>
                        <th scope="col">Trạng thái</th>
                        <th scope="col" className="acl-cell-action">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((account, index) => (
                        <tr key={account.id}>
                          <td className="acl-stt">{(tableData.page - 1) * tableData.pageSize + index + 1}</td>
                          <td>
                            <strong className="acl-name">{account.fullName}</strong>
                          </td>
                          <td className="acl-text">{account.email}</td>
                          <td className="acl-text">{account.phone ?? <span className="acl-muted">—</span>}</td>
                          <td>
                            <RoleChips roles={account.roles} />
                          </td>
                          <td>
                            <StatusBadge account={account} />
                          </td>
                          <td className="acl-cell-action">
                            <EditButton account={account} onEdit={setEditTarget} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <ul className="acl-cards">
                    {items.map((account) => (
                      <li key={account.id} className="acl-account-card">
                        <div className="acl-account-card-head">
                          <span className="acl-person">
                            <strong>{account.fullName}</strong>
                            <span>{account.email}</span>
                            {account.phone && <span>{account.phone}</span>}
                          </span>
                          <StatusBadge account={account} />
                        </div>
                        <div className="acl-account-card-foot">
                          <RoleChips roles={account.roles} />
                          <EditButton account={account} onEdit={setEditTarget} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {tableData && (
              <nav className="acl-pager" aria-label="Phân trang">
                <span>
                  Hiển thị {firstShown} - {lastShown} / {tableData.total} tài khoản · {tableData.pageSize} dòng/trang
                </span>
                <span className="acl-pager-controls">
                  <button
                    type="button"
                    className="acl-page-button"
                    aria-label="Trang trước"
                    disabled={tableData.page <= 1 || loading}
                    onClick={() => setPage(tableData.page - 1)}
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span className="acl-page-label">
                    Trang {tableData.page}/{totalPages}
                  </span>
                  <button
                    type="button"
                    className="acl-page-button"
                    aria-label="Trang sau"
                    disabled={tableData.page >= totalPages || loading}
                    onClick={() => setPage(tableData.page + 1)}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </span>
              </nav>
            )}
          </section>
        </div>
      </main>

      {creating && <UserFormDialog onSubmit={confirmCreate} onClose={() => setCreating(false)} />}
      {editTarget && <UserFormDialog account={editTarget} onSubmit={confirmEdit} onClose={() => setEditTarget(null)} />}
    </div>
  )
}
