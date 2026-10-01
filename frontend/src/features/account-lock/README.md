# Quản lý tài khoản — khóa / mở khóa (S1-10 giao diện)

Trang dành cho **Quản trị hệ thống**: tìm tài khoản, lọc theo trạng thái, khóa (bắt buộc ghi lý do) và mở khóa.
Gọi API backend S1-08 (danh sách) và S1-10 (khóa / mở khóa), xem `claude/S1-10-api-khoa-mo-khoa.md` trong tài liệu dự án.

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
(lấy từ phiên đăng nhập / gửi `Authorization`), các file khác không phải đổi. `getCurrentUserId()` còn dùng để ẩn nút Khóa
ở dòng tài khoản của chính mình.

## Gắn vào ứng dụng có router

```tsx
import { AccountLockPage } from './features/account-lock/AccountLockPage'

<Route path="/admin/users" element={<AccountLockPage />} />
```

Lúc đó có thể bỏ `admin-users.html`, `src/admin-users-main.tsx` và mục `adminUsers` trong `vite.config.ts`.
Component tự import CSS của nó, mọi lớp CSS bắt đầu bằng `acl-` nên không đụng trang khác.

## Hành vi

- Danh sách 10 dòng/trang; tìm theo tên, email, số điện thoại (đợi 350 ms sau khi ngừng gõ); lọc Tất cả / Hoạt động / Chờ kích hoạt / Đã khóa.
- Máy tính hiện dạng bảng, điện thoại (≤ 760 px) hiện dạng thẻ.
- **Khóa:** hộp thoại bắt buộc lý do (cắt khoảng trắng, 3–500 ký tự, có bộ đếm). Lỗi `VALIDATION_ERROR` hiện đúng ở ô lý do.
- **Mở khóa:** hộp thoại xác nhận, nêu lý do khóa hiện tại sẽ bị xoá (chưa có nhật ký) và phiên cũ không sống lại.
- **Cảnh báo bàn giao:** sau khi khóa, nếu `handoverWarning` khác null thì hiện `message` và danh sách lớp, kể cả khi
  `classes` rỗng (trường hợp backend không kiểm tra được lớp). Hiện luôn là `null` cho tới khi có module Lớp học.
- **Lỗi:** `ALREADY_LOCKED`, `NOT_LOCKED`, `USER_NOT_FOUND` → báo dữ liệu đã cũ và tải lại; `CANNOT_LOCK_SELF` và lỗi mạng
  hiện ngay trong hộp thoại (giữ nguyên lý do đã gõ); 401 / 403 / mất mạng khi tải danh sách có màn hình riêng (có nút Thử lại khi mất mạng).

## Chưa làm

- Chưa có đăng nhập thật nên chưa chặn người không phải Admin ở phía giao diện (backend vẫn trả 403).
- Khóa xong người dùng vẫn gọi API được bằng header tạm cho tới khi Auth đọc `sessionVersion` (xem tài liệu API S1-10).
- Chưa có form tạo / sửa tài khoản và bộ lọc vai trò (thuộc S1-08 giao diện).

## Giao diện theo Figma (S1-10)

Theo khung **"S1-10 : Khóa & Mở Khóa Tài Khoản"** (node `202:92`) của Vũ: thanh bên `#43278f`, mục "Khóa / Mở khóa tài khoản",
bảng STT / Tên người dùng / Email / Vai trò / Trạng thái / Phiên / Hành động, nút "Khóa" đỏ `#ef0048`, "Mở khóa" tím `#43278f`, font Inter.

Khác thiết kế:
- Thêm ô lọc "Trạng thái" cạnh ô lọc "Vai trò" (để tìm nhanh tài khoản đã khóa).
- Cột **Phiên**: backend chưa có dữ liệu phiên (S1-02), nên chỉ hiện điều chắc chắn — "Không có phiên" khi đã khóa
  (khóa thu hồi mọi phiên), "Chưa đăng nhập" khi chờ kích hoạt, "—" với tài khoản đang hoạt động. Khi S1-02 có API phiên thì thay `SessionInfo`.
- Tài khoản bị khóa hiện thêm lý do và thời điểm khóa.
- Biểu tượng ký tự trong Figma (♧ ⌕ ⌄ ▣ ▢) dùng biểu tượng tương ứng của `lucide-react`.
- Ở màn hình hẹp hơn khung thiết kế (2234px), khoảng trống bên trái bảng thu lại; dưới 900px thanh bên thành thanh ngang.
