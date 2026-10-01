# Quản lý tài khoản — S1-08 (thêm/sửa/xoá/lọc) và S1-10 (khoá/mở khoá)

Trang dành cho **Quản trị hệ thống**: tìm tài khoản, lọc theo trạng thái và vai trò, thêm và sửa tài khoản (họ tên, email, số điện thoại), khoá (bắt buộc ghi lý do), mở khoá và xoá hẳn tài khoản.
Gọi API backend S1-08 (danh sách, tạo, sửa, xoá) và S1-10 (khoá / mở khoá), xem `claude/S1-10-api-khoa-mo-khoa.md` trong tài liệu dự án.

Toàn bộ nằm trong `src/features/account-lock/`, không sửa `App.tsx` / `main.tsx` của trang đăng nhập.

## Chạy thử

1. Backend (cổng 3000): `cd backend && npm install && npm run start:dev`
2. Frontend: `cd frontend && npm install && npm run dev`, rồi mở `http://localhost:5173/admin-users.html`

Biến môi trường (xem `frontend/.env.example`, sao chép thành `frontend/.env.local` nếu cần đổi):

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Địa chỉ backend |
| `VITE_DEV_USER_ID` | `admin-1` | Id tài khoản đang "đăng nhập" (tạm) |
| `VITE_DEV_USER_ROLES` | `ADMIN` | Vai trò của tài khoản đó (tạm) |

## Danh tính tạm thời

Backend chưa có đăng nhập thật, chỉ đọc header `x-user-id` và `x-user-roles`. Giao diện gửi hai header này từ các biến
`VITE_DEV_USER_*`. Khi nối đăng nhập (S1-01/S1-02), chỉ cần sửa `getCurrentUserId()` và `getAuthHeaders()` trong `api.ts`
(lấy từ phiên đăng nhập / gửi `Authorization`), các file khác không phải đổi. `getCurrentUserId()` còn dùng để ẩn nút Khoá
ở dòng tài khoản của chính mình.

## Gắn vào ứng dụng có router

```tsx
import { AccountLockPage } from './features/account-lock/AccountLockPage'

<Route path="/admin/users" element={<AccountLockPage />} />
```

Lúc đó có thể bỏ `admin-users.html`, `src/admin-users-main.tsx` và mục `adminUsers` trong `vite.config.ts`.
Component tự import CSS của nó, mọi lớp CSS bắt đầu bằng `acl-` nên không đụng trang khác.

## Hành vi

- Danh sách 10 dòng/trang; tìm theo tên, email, số điện thoại (đợi 350 ms sau khi ngừng gõ); lọc Tất cả / Hoạt động / Chờ kích hoạt / Đã khoá.
- Máy tính hiện dạng bảng, điện thoại (≤ 760 px) hiện dạng thẻ.
- **Khoá:** hộp thoại bắt buộc lý do (cắt khoảng trắng, 3–500 ký tự, có bộ đếm). Lỗi `VALIDATION_ERROR` hiện đúng ở ô lý do.
- **Mở khoá:** hộp thoại xác nhận, nêu lý do khoá hiện tại sẽ bị xoá (chưa có nhật ký) và phiên cũ không sống lại.
- **Cảnh báo bàn giao:** sau khi khoá, nếu `handoverWarning` khác null thì hiện `message` và danh sách lớp, kể cả khi
  `classes` rỗng (trường hợp backend không kiểm tra được lớp). Hiện luôn là `null` cho tới khi có module Lớp học.
- **Lỗi:** `ALREADY_LOCKED`, `NOT_LOCKED`, `USER_NOT_FOUND` → báo dữ liệu đã cũ và tải lại; `CANNOT_LOCK_SELF` và lỗi mạng
  hiện ngay trong hộp thoại (giữ nguyên lý do đã gõ); 401 / 403 / mất mạng khi tải danh sách có màn hình riêng (có nút Thử lại khi mất mạng).

## Chưa làm

- Chưa có đăng nhập thật nên chưa chặn người không phải Admin ở phía giao diện (backend vẫn trả 403).
- Khoá xong người dùng vẫn gọi API được bằng header tạm cho tới khi Auth đọc `sessionVersion` (xem tài liệu API S1-10).
- Chưa có form tạo / sửa tài khoản và bộ lọc vai trò (thuộc S1-08 giao diện).

## S1-08 — thêm, sửa, lọc vai trò, xoá

- **Thêm:** nút “Thêm tài khoản” → `UserFormDialog` (họ tên, email, số điện thoại, chọn ít nhất 1 vai trò). Gọi `POST /users`; `409 EMAIL_ALREADY_EXISTS` hiện ngay dưới ô email.
- **Sửa:** nút “Sửa” trên mỗi dòng → cùng form, chỉ gửi trường đã đổi qua `PATCH /users/:id`. Vai trò đổi ở S1-09, khoá ở S1-10 nên không có trong form này.
- **Lọc vai trò:** ô chọn “Vai trò” cạnh bộ lọc trạng thái, gửi `?role=`.
- **Xoá:** nút “Xoá” → hộp thoại cảnh báo không khôi phục được → `DELETE /users/:id` (backend: nhánh `feature/S1-08-delete-account-api`). Không hiện nút xoá ở dòng của chính mình; backend cũng chặn `CANNOT_DELETE_SELF` và `CANNOT_DELETE_LAST_ADMIN`.
- Kiểm tra dữ liệu ở `validation.ts` giống backend (họ tên 2–100 ký tự, email, số điện thoại `0xxxxxxxxx`), backend vẫn là nơi quyết định cuối cùng.
