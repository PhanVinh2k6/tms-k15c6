# TMS · S1-09 Gán và thu hồi vai trò người dùng

Giao diện React + TypeScript mô phỏng màn hình quản lý vai trò trong Hệ thống Quản lý Đào tạo Eduflow.

## Phạm vi

- Chỉ frontend/UI, không chứa database hoặc code backend.
- Frontend mặc định chạy mock mode trong `src/api.ts` để xem demo không cần database; khi cấu hình `VITE_API_BASE_URL`, frontend sẽ gọi backend thật.
- Có tương tác: tìm kiếm, lọc vai trò, mở panel chi tiết, gán vai trò, thu hồi vai trò, toast xác nhận.
- Visual language bám theo ảnh mẫu: sidebar gradient tím, nền lavender nhạt, thẻ trắng, typography gọn, bo góc mềm.

## Chạy local

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal.

## Mock mode frontend

Không cần `.env.local` để xem giao diện. Dữ liệu mẫu gồm người dùng và vai trò; thao tác gán/thu hồi được mô phỏng cục bộ trên frontend.

## Kết nối backend

Mặc định frontend gọi cùng origin với các endpoint:

- `GET /api/users`
- `GET /api/roles`
- `POST /api/users/:userId/roles` với body `{ "roleId": "..." }`
- `DELETE /api/users/:userId/roles/:roleId`

Nếu backend chạy ở origin khác, tạo `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_USERS_PATH=/api/users
VITE_ROLES_PATH=/api/roles
```

Nếu backend S9 dùng route khác, chỉ cần đổi `VITE_USERS_PATH` và `VITE_ROLES_PATH`; payload gán/thu hồi được tập trung trong `src/api.ts`.

> Khi backend chạy riêng, cần cấu hình `VITE_API_BASE_URL`. Nếu để trống, ứng dụng sẽ dùng mock mode frontend.

## Build kiểm tra

```bash
npm run build
```
