import { ChevronDown, Funnel, Search } from 'lucide-react'
import { ROLE_LABEL, ROLE_ORDER } from '../account-lock/types'
import type { RoleFilter, StatusFilter } from '../account-lock/types'

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'PENDING_ACTIVATION', label: 'Chờ kích hoạt' },
  { value: 'LOCKED', label: 'Đã khóa' },
]

type UserSearchBarProps = {
  searchInput: string
  onSearchChange: (value: string) => void
  role: RoleFilter
  onRoleChange: (value: RoleFilter) => void
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
}

/**
 * Thanh tìm kiếm + bộ lọc vai trò / trạng thái (S1-08), theo khung Figma "S1-08: Quản Lý Tài Khoản".
 * Chỉ hiển thị, không tự gọi API: ghép với hook useUserSearch().
 * Dùng các lớp CSS `acl-*` trong user-account.css của trang chứa nó.
 */
export function UserSearchBar({ searchInput, onSearchChange, role, onRoleChange, status, onStatusChange }: UserSearchBarProps) {
  return (
    <div className="acl-toolbar">
      <div className="acl-search">
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          value={searchInput}
          maxLength={100}
          placeholder="Tìm kiếm tài khoản, email..."
          aria-label="Tìm tài khoản theo tên, email hoặc số điện thoại"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="acl-filter-group">
        <label className="acl-filter-field">
          <Funnel size={17} aria-hidden="true" />
          <span>Vai trò:</span>
          <span className="acl-select-box">
            <select value={role} aria-label="Lọc theo vai trò" onChange={(event) => onRoleChange(event.target.value as RoleFilter)}>
              <option value="">Tất cả vai trò</option>
              {ROLE_ORDER.map((item) => (
                <option key={item} value={item}>
                  {ROLE_LABEL[item]}
                </option>
              ))}
            </select>
            <ChevronDown size={12} aria-hidden="true" />
          </span>
        </label>
        <label className="acl-filter-field">
          <span>Trạng thái:</span>
          <span className="acl-select-box">
            <select
              value={status}
              aria-label="Lọc theo trạng thái"
              onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} aria-hidden="true" />
          </span>
        </label>
      </div>
    </div>
  )
}
