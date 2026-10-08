import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Pencil,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import { ApiError, getSession, logout, refreshSession, type SessionClaims } from '../account-lock/api'
import { createLead, deleteLead, listLeads, updateLead } from './api'
import { DeleteLeadDialog } from './DeleteLeadDialog'
import { LeadFormDialog } from './LeadFormDialog'
import { LEAD_DELETE_ROLES, LEAD_READ_ROLES, LEAD_WRITE_ROLES, SOURCE_LABEL } from './types'
import type { DuplicateWarning, Lead, LeadPage, LeadSource } from './types'
import { toLeadChanges, toLeadInput } from './validation'
import type { LeadFormValues } from './validation'
import './leads.css'

export const LEAD_PAGE_SIZE = 20
const NOTICE_MS = 6000

type Notice = { kind: 'success' | 'warning' | 'error'; title: string; text: string }
type LoadError = { kind: 'network' | 'denied' | 'other'; message: string }

const SOURCE_CLASS: Record<LeadSource, string> = {
  FACEBOOK: 'lead-source-facebook',
  WEBSITE: 'lead-source-website',
  REFERRAL: 'lead-source-referral',
  GOOGLE_ADS: 'lead-source-google',
}

const hasAnyRole = (session: SessionClaims | null, roles: string[]) => Boolean(session?.roles?.some((role) => roles.includes(role)))

function toLoadError(error: unknown): LoadError {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return { kind: 'network', message: error.message }
    if (error.status === 401) return { kind: 'denied', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.' }
    if (error.status === 403) return { kind: 'denied', message: 'Tài khoản của bạn không có quyền xem danh sách lead.' }
    return { kind: 'other', message: error.message }
  }
  return { kind: 'other', message: 'Không tải được danh sách lead.' }
}

/** Câu nhắc khi lưu thành công nhưng số điện thoại trùng (AC2: chỉ cảnh báo). */
function duplicateText(name: string, warning: DuplicateWarning): string {
  const others = warning.duplicates.map((item) => item.fullName).join(', ')
  return `Đã lưu lead ${name}. Lưu ý: ${warning.message}${others ? ` (trùng với ${others})` : ''}.`
}

/**
 * S2-09: danh sách lead cho Tư vấn tuyển sinh. Thêm / sửa / xoá đều gọi API thật;
 * nút hiện theo vai trò cho dễ dùng, còn quyền thật do backend quyết định (403 được xử lý riêng).
 */
export function LeadsPage() {
  const [session, setSession] = useState<SessionClaims | null>(() => getSession())
  const [checkingSession, setCheckingSession] = useState(() => !session && Boolean(window.sessionStorage.getItem('tms.refreshToken')))

  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState<LeadPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<LoadError | null>(null)

  const [creating, setCreating] = useState(false)
  const [editTarget, setEditTarget] = useState<Lead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const canRead = hasAnyRole(session, LEAD_READ_ROLES)
  const canWrite = hasAnyRole(session, LEAD_WRITE_ROLES)
  const canDelete = hasAnyRole(session, LEAD_DELETE_ROLES)

  useEffect(() => {
    if (!checkingSession) return
    let active = true
    refreshSession().then(() => {
      if (!active) return
      setSession(getSession())
      setCheckingSession(false)
    })
    return () => { active = false }
  }, [checkingSession])

  useEffect(() => {
    if (checkingSession || !canRead) return
    const controller = new AbortController()
    listLeads(page, LEAD_PAGE_SIZE, controller.signal)
      .then((result) => {
        // Trang hiện tại trống sau khi xoá dòng cuối: lùi về trang trước.
        if (result.items.length === 0 && result.page > 1) {
          setPage(result.page - 1)
          return
        }
        setData(result)
        setLoadError(null)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(toLoadError(error))
        setLoading(false)
      })
    return () => controller.abort()
  }, [page, reloadKey, checkingSession, canRead])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [notice])

  const reload = () => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const goToPage = (next: number) => {
    setLoading(true)
    setPage(next)
  }

  const signOut = async () => {
    await logout()
    window.location.assign('/')
  }

  const confirmCreate = async (values: LeadFormValues) => {
    const result = await createLead(toLeadInput(values))
    setCreating(false)
    setNotice(result.duplicateWarning
      ? { kind: 'warning', title: 'Đã lưu, có số trùng', text: duplicateText(result.lead.fullName, result.duplicateWarning) }
      : { kind: 'success', title: 'Thành công', text: 'Lead đã được tạo thành công!' })
    // Lead mới nằm đầu trang 1.
    if (page !== 1) goToPage(1)
    else reload()
  }

  const confirmEdit = async (values: LeadFormValues) => {
    const target = editTarget
    if (!target) return
    const changes = toLeadChanges(values, target)
    if (Object.keys(changes).length === 0) {
      setEditTarget(null)
      setNotice({ kind: 'warning', title: 'Không có thay đổi', text: `Lead ${target.fullName} chưa có thông tin nào thay đổi.` })
      return
    }
    try {
      const result = await updateLead(target.id, changes)
      setEditTarget(null)
      setNotice(result.duplicateWarning
        ? { kind: 'warning', title: 'Đã lưu, có số trùng', text: duplicateText(result.lead.fullName, result.duplicateWarning) }
        : { kind: 'success', title: 'Thành công', text: 'Lead đã được cập nhật thành công!' })
      reload()
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setEditTarget(null)
        setNotice({ kind: 'warning', title: 'Lead không còn tồn tại', text: `Lead ${target.fullName} đã bị xóa bởi người khác. Danh sách đã được tải lại.` })
        reload()
        return
      }
      throw error
    }
  }

  // AC3: luôn gọi server; 403 nghĩa là server từ chối quyền, kể cả khi giao diện đang hiện nút.
  const confirmDelete = async () => {
    const target = deleteTarget
    if (!target) return
    try {
      await deleteLead(target.id)
      setNotice({ kind: 'success', title: 'Thành công', text: 'Lead đã được xóa thành công!' })
      reload()
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setNotice({ kind: 'error', title: 'Không có quyền xóa', text: 'Bạn không có quyền xóa Lead này. Chỉ Quản lý đào tạo mới có thể thực hiện thao tác này.' })
      } else if (error instanceof ApiError && error.status === 404) {
        setNotice({ kind: 'warning', title: 'Lead không còn tồn tại', text: `Lead ${target.fullName} đã bị xóa trước đó. Danh sách đã được tải lại.` })
        reload()
      } else {
        setNotice({ kind: 'error', title: 'Không xóa được lead', text: error instanceof Error ? error.message : 'Vui lòng thử lại.' })
      }
    }
    setDeleteTarget(null)
  }

  if (checkingSession) {
    return (
      <main className="lead-state lead-state-page" role="status">
        <Shield size={30} aria-hidden="true" />
        <h1>Đang kiểm tra phiên đăng nhập</h1>
        <p>Vui lòng chờ trong giây lát.</p>
      </main>
    )
  }

  if (!session || !canRead) {
    return (
      <main className="lead-state lead-state-page" role="alert">
        <Shield size={30} aria-hidden="true" />
        <h1>{session ? 'Không có quyền truy cập' : 'Phiên đăng nhập đã hết hạn'}</h1>
        <p>{session ? 'Chỉ Tư vấn tuyển sinh, Quản lý đào tạo và Quản trị hệ thống được xem danh sách lead.' : 'Vui lòng đăng nhập lại để tiếp tục.'}</p>
        <button type="button" className="lead-primary-button" onClick={signOut}>Đăng nhập lại</button>
      </main>
    )
  }

  const items = data?.items ?? []
  const firstShown = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const lastShown = data ? firstShown + items.length - 1 : 0

  return (
    <div className="lead-page">
      <aside className="lead-sidebar">
        <div className="lead-sidebar-brand">
          <GraduationCap size={24} aria-hidden="true" />
          <span>TMS</span>
        </div>
        <div className="lead-sidebar-title">KHÔNG GIAN LÀM VIỆC</div>
        <nav aria-label="Điều hướng">
          {/* Các mục chưa có trang: hiển thị theo Figma, chưa bấm được. */}
          <span className="lead-sidebar-item lead-sidebar-item-off"><LayoutDashboard size={16} aria-hidden="true" />Tổng quan</span>
          <span className="lead-sidebar-item lead-sidebar-item-off"><BookOpen size={16} aria-hidden="true" />Khóa học</span>
          <span className="lead-sidebar-item lead-sidebar-item-off"><Layers size={16} aria-hidden="true" />Lớp học</span>
          <span className="lead-sidebar-item lead-sidebar-item-off"><Users size={16} aria-hidden="true" />Học viên</span>
          <span className="lead-sidebar-item lead-sidebar-item-off"><BarChart3 size={16} aria-hidden="true" />Báo cáo</span>
          <span className="lead-sidebar-item lead-sidebar-item-active" aria-current="page"><UserPlus size={16} aria-hidden="true" />Quản lý Lead</span>
        </nav>
        <div className="lead-sidebar-footer">
          <strong>{session.email ?? 'Tài khoản'}</strong>
          <span>Vai trò: {session.roles?.join(', ')}</span>
          <button type="button" className="lead-sidebar-logout" onClick={signOut}>Đăng xuất</button>
        </div>
      </aside>

      <main className="lead-main">
        <div className="lead-page-header">
          <div>
            <h1>Quản lý danh sách Lead</h1>
            <p>Quản lý khách hàng tiềm năng và thông tin để tư vấn &amp; chuyển đổi theo dõi.</p>
          </div>
          {canWrite && (
            <button type="button" className="lead-primary-button" onClick={() => setCreating(true)}>
              <span aria-hidden="true">+</span> Thêm Lead
            </button>
          )}
        </div>

        <div aria-live="polite">
          {notice && (
            <div className={`lead-notification lead-notification-${notice.kind}`} role="status">
              <span className="lead-notification-icon">
                {notice.kind === 'success' ? <CheckCircle2 size={20} aria-hidden="true" /> : <AlertTriangle size={20} aria-hidden="true" />}
              </span>
              <span className="lead-notification-content">
                <strong>{notice.title}</strong>
                <span>{notice.text}</span>
              </span>
              <button type="button" className="lead-notification-close" aria-label="Ẩn thông báo" onClick={() => setNotice(null)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <section className="lead-table-card" aria-label="Danh sách lead" aria-busy={loading}>
          {loadError && (
            <div className="lead-state" role="alert">
              {loadError.kind === 'network' ? <WifiOff size={30} aria-hidden="true" /> : <AlertTriangle size={30} aria-hidden="true" />}
              <h2>{loadError.kind === 'denied' ? 'Không có quyền truy cập' : 'Không tải được danh sách'}</h2>
              <p>{loadError.message}</p>
              {loadError.kind !== 'denied' && (
                <button type="button" className="lead-primary-button" onClick={reload}>
                  <RefreshCw size={14} aria-hidden="true" /> Thử lại
                </button>
              )}
            </div>
          )}

          {!loadError && data === null && (
            <div className="lead-skeleton" aria-label="Đang tải danh sách">
              {[0, 1, 2, 3, 4].map((row) => <span key={row} />)}
            </div>
          )}

          {!loadError && data !== null && items.length === 0 && (
            <div className="lead-state">
              <UserPlus size={30} aria-hidden="true" />
              <h2>Chưa có lead nào</h2>
              <p>{canWrite ? 'Bấm “Thêm Lead” để thêm khách hàng tiềm năng đầu tiên.' : 'Danh sách sẽ hiện ở đây khi Tư vấn tuyển sinh thêm lead.'}</p>
            </div>
          )}

          {!loadError && data !== null && items.length > 0 && (
            <div className={loading ? 'lead-table-wrap lead-loading' : 'lead-table-wrap'}>
              <table className="lead-table">
                <caption className="lead-sr-only">Danh sách lead, trang {data.page}/{data.totalPages}</caption>
                <thead>
                  <tr>
                    <th scope="col">STT</th>
                    <th scope="col">Họ tên</th>
                    <th scope="col">Số điện thoại</th>
                    <th scope="col">Email</th>
                    <th scope="col">Nguồn</th>
                    <th scope="col">Chương trình quan tâm</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((lead, index) => (
                    <tr key={lead.id}>
                      <td>{firstShown + index}</td>
                      <td className="lead-name-cell">{lead.fullName}</td>
                      <td>{lead.phone}</td>
                      <td>{lead.email ?? <span className="lead-muted">—</span>}</td>
                      <td>
                        <span className={`lead-source-tag ${SOURCE_CLASS[lead.source] ?? ''}`}>{SOURCE_LABEL[lead.source] ?? lead.source}</span>
                      </td>
                      <td>
                        <span className="lead-program-tag">{lead.interestedProgram}</span>
                      </td>
                      <td>
                        <span className="lead-actions">
                          {canWrite && (
                            <button type="button" className="lead-edit-button" aria-label={`Sửa lead ${lead.fullName}`} onClick={() => setEditTarget(lead)}>
                              <Pencil size={14} aria-hidden="true" /> Sửa
                            </button>
                          )}
                          {canDelete && (
                            <button type="button" className="lead-delete-button" aria-label={`Xóa lead ${lead.fullName}`} onClick={() => setDeleteTarget(lead)}>
                              <Trash2 size={14} aria-hidden="true" /> Xóa
                            </button>
                          )}
                          {!canWrite && !canDelete && <span className="lead-muted">Chỉ xem</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loadError && data !== null && data.total > 0 && (
            <nav className="lead-table-footer" aria-label="Phân trang">
              <span>Hiển thị {firstShown} - {lastShown} trong tổng {data.total} lead</span>
              {data.totalPages > 1 && (
                <span className="lead-pager">
                  <button type="button" aria-label="Trang trước" disabled={data.page <= 1 || loading} onClick={() => goToPage(data.page - 1)}>
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span>Trang {data.page}/{data.totalPages}</span>
                  <button type="button" aria-label="Trang sau" disabled={data.page >= data.totalPages || loading} onClick={() => goToPage(data.page + 1)}>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </span>
              )}
            </nav>
          )}
        </section>

        {creating && <LeadFormDialog onSubmit={confirmCreate} onClose={() => setCreating(false)} />}
        {editTarget && <LeadFormDialog lead={editTarget} onSubmit={confirmEdit} onClose={() => setEditTarget(null)} />}
        {deleteTarget && <DeleteLeadDialog lead={deleteTarget} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)} />}
      </main>
    </div>
  )
}
