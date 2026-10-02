# Tìm kiếm, thêm và xoá tài khoản — S1-08 (giao diện)

Phần giao diện S1-08 cho **Quản trị hệ thống**: tìm tài khoản, lọc theo vai trò / trạng thái, phân trang,
thêm tài khoản mới và xoá tài khoản. Trang `UserAccountPage` (`src/features/user-account/`) ghép các phần này
với khoá / mở khoá (S1-10).

## Các file

| File | Việc |
|---|---|
| `useUserSearch.ts` | Hook giữ từ khoá, bộ lọc, trang; gọi `GET /users`. Đợi 350 ms sau khi ngừng gõ, huỷ yêu cầu cũ khi có yêu cầu mới, tự lùi trang khi trang hiện tại không còn dữ liệu. |
| `UserSearchBar.tsx` | Ô tìm kiếm + ô chọn vai trò + ô chọn trạng thái (theo Figma "S1-08: Quản Lý Tài Khoản"). Chỉ hiển thị, không gọi API. |
| `UserFormDialog.tsx` | Hộp thoại thêm tài khoản (và sửa, khi truyền `account`). Gọi `POST /users` / `PATCH /users/:id` qua hàm `onSubmit` của trang. Lỗi từ backend hiện đúng dưới ô bị sai. |
| `DeleteUserDialog.tsx` | Hộp thoại xác nhận xoá hẳn tài khoản (`DELETE /users/:id`). Nút được focus sẵn là "Huỷ". |
| `validation.ts` | Kiểm tra form giống backend (họ tên 2–100 ký tự, email, số điện thoại `0xxxxxxxxx`, ít nhất 1 vai trò khi thêm) và tạo dữ liệu gửi đi. |
| `index.ts` | Xuất tất cả để import gọn: `import { useUserSearch, UserSearchBar } from '../user-management'`. |

API, kiểu dữ liệu và `Modal` dùng chung với S1-10 nằm ở `src/features/account-lock/` (`api.ts`, `types.ts`, `Modal.tsx`).

## Cách dùng

```tsx
const search = useUserSearch(10) // 10 dòng / trang

<UserSearchBar
  searchInput={search.searchInput}
  onSearchChange={search.setSearchInput}
  role={search.role}
  onRoleChange={search.setRole}
  status={search.status}
  onStatusChange={search.setStatus}
/>

// search.data?.items là danh sách trang hiện tại; sau khi thêm / xoá gọi search.reload().
```

Các component dùng lớp CSS `acl-*` trong `user-account.css` của trang chứa nó, nên trang phải import file CSS đó.

## Chạy thử

1. Backend (cổng 3000), nhánh có API xoá (`feature/S1-08-user-account`): `cd backend && npm install && npm run start:dev`
2. Frontend: `cd frontend && npm install && npm run dev`, mở `http://localhost:5173/admin-users.html`

## Hành vi

- **Tìm kiếm:** theo họ tên (không dấu cũng được: "nguyen" ra "Nguyễn"), email, số điện thoại. Đổi từ khoá hoặc bộ lọc thì quay về trang 1.
- **Thêm:** họ tên, email, số điện thoại (không bắt buộc), chọn ít nhất 1 vai trò. Tạo xong backend gửi email kích hoạt, tài khoản ở trạng thái "Chờ kích hoạt"; trang bỏ bộ lọc để tài khoản mới hiện ngay đầu danh sách. Email trùng (`EMAIL_ALREADY_EXISTS`) báo ngay dưới ô email.
- **Xoá:** không hiện nút xoá ở dòng của chính mình. Backend chặn `CANNOT_DELETE_SELF` và `CANNOT_DELETE_LAST_ADMIN`; trang hiện lý do. Tài khoản đã bị người khác xoá trước (`USER_NOT_FOUND`) thì báo và tải lại danh sách.
