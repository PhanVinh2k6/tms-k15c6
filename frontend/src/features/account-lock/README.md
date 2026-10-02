# Quản lý tài khoản — S1-08 (thêm/sửa/xoá/lọc) và S1-10 (khóa/mở khóa)

Trang dành cho **Quản trị hệ thống**: tìm tài khoản, lọc theo trạng thái và vai trò, thêm và sửa tài khoản (họ tên, email, số điện thoại), khóa (bắt buộc ghi lý do), mở khóa và xoá hẳn tài khoản.
Gọi API backend S1-08 (danh sách, tạo, sửa, xoá) và S1-10 (khóa / mở khóa), xem `claude/S1-10-api-khoa-mo-khoa.md` trong tài liệu dự án.

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

## S1-08 — thêm, sửa, lọc vai trò, xoá

Tìm kiếm, bộ lọc, form thêm / sửa và hộp thoại xoá nằm ở `src/features/user-management/` (xem README trong đó).

- **Tạo:** nút “Tạo tài khoản” → `UserFormDialog` (họ tên, email, số điện thoại, chọn ít nhất 1 vai trò). Gọi `POST /users`; `409 EMAIL_ALREADY_EXISTS` hiện ngay dưới ô email.
- **Sửa:** nút “Sửa” trên mỗi dòng → cùng form, chỉ gửi trường đã đổi qua `PATCH /users/:id`. Vai trò đổi ở S1-09, khóa ở S1-10 nên không có trong form này.
- **Lọc:** ô chọn “Tất cả vai trò” (`?role=`) và “Tất cả trạng thái” (`?status=`); 20 dòng / trang như mặc định của backend.
- **Xoá:** thiết kế S1-08 mới không có nút xoá nên trang không hiện nữa. API `DELETE /users/:id` và `DeleteUserDialog` vẫn giữ trong `user-management/` nếu nhóm cần lại.
- Kiểm tra dữ liệu ở `user-management/validation.ts` giống backend (họ tên 2–100 ký tự, email, số điện thoại `0xxxxxxxxx`), backend vẫn là nơi quyết định cuối cùng.

## Giao diện theo Figma (S1-08)

Theo khung **"S1-08: Quản Lý Tài Khoản"** (node `196:2`, khung 1867 × 910, thay cho node `176:509` cũ) trong file Figma của nhóm.
Khung là ảnh phẳng nên kích thước và màu được đo trực tiếp trên ảnh, dựng lại ở tỉ lệ 1:1:
- Thanh bên `#3b2885` rộng 238px: "TMS System", mục "Quản lý tài khoản" (nền `#4c35a3`), "Quay lại", chân "Nền tảng vận hành đào tạo TMS".
- Tiêu đề + dòng phụ "Tạo, sửa và tìm kiếm tài khoản người dùng"; nút "Tạo tài khoản" chuyển màu `#5531c7` → `#b6378a`.
- Thẻ trắng bo 16px rộng tối đa 1300px: ô tìm "Tìm theo tên, email, số điện thoại...", biểu tượng phễu, ô chọn "Tất cả vai trò" / "Tất cả trạng thái".
- Bảng STT / Tên người dùng / Email / Số điện thoại / Vai trò / Trạng thái / Hành động; nhãn "Đang hoạt động" (xanh), "Chờ kích hoạt" (cam); nút "Sửa".
- Chân bảng "Hiển thị 1 - 3 / 3 tài khoản · 20 dòng/trang" và "Trang 1/1" với nút trước / sau.
- Chữ là font hệ thống như ảnh thiết kế (Segoe UI trên Windows), cỡ 11–12px, tiêu đề 20px.

Khác với thiết kế:
- Tài khoản bị khóa hiện nhãn "Đã khóa" (đỏ); lý do và thời điểm khóa nằm trong chú thích khi rê chuột. Khóa / mở khóa làm ở trang S1-10.
- Vai trò hiện tên tiếng Việt của hệ thống ("Quản trị hệ thống", "Học viên"…) thay cho "Admin / User / Manager" trong ảnh mẫu.
- Ô chọn rộng theo lựa chọn đang chọn (`field-sizing: content`, Chrome / Edge); trình duyệt khác rộng theo lựa chọn dài nhất.
- Dưới 900px thanh bên thành thanh ngang; dưới 760px bảng thành thẻ.

## Hai trang

| Trang | File | Thiết kế |
|---|---|---|
| `admin-users.html` — Quản lý tài khoản (S1-08: tạo, sửa, tìm kiếm, lọc) | `src/features/user-account/UserAccountPage.tsx` | Figma "S1-08: Quản Lý Tài Khoản" |
| `admin-account-lock.html` — Khóa / Mở khóa tài khoản (S1-10) | `src/features/account-lock/AccountLockPage.tsx` | Figma "S1-10 : Khóa & Mở Khóa Tài Khoản" |

API, kiểu dữ liệu và `Modal` dùng chung nằm trong `src/features/account-lock/`; tìm kiếm, thêm, xoá, hộp thoại và luồng khóa / mở khóa nằm trong `src/features/user-management/`.

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
