# TMS Backend (NestJS)

API cho EP-01 — Tài khoản, Phân quyền & Hồ sơ (Sprint 1).

## Chạy local

```bash
npm install
npm run start:dev      # http://localhost:3000
```

| Lệnh | Mục đích |
|---|---|
| `npm run lint` | ESLint (CI bắt buộc xanh) |
| `npm run build` | Biên dịch TypeScript |
| `npm test` | Chạy toàn bộ test |
| `npm run test:cov` | Test kèm độ phủ; **đỏ nếu dưới 60%** (Definition of Done) |

> **Xác thực hiện tại là giả lập.** `ActorMiddleware` đọc `x-user-id` và `x-user-roles` để mô phỏng JWT.
> Khi có đăng nhập thật (S1-01/S1-02) thì thay middleware này bằng JWT guard nhưng giữ nguyên `req.actor`.
> **Không dùng cơ chế header này làm xác thực production.**

## Phân quyền (S1-05)

Mọi route quản trị dùng `@UseGuards(PermissionGuard)` + `@RequirePermission(Permission.X)`; **mặc định từ chối**
(route không khai báo quyền thì trả 403). Test `rbac-enforcement.e2e-spec.ts` tự quét mọi controller và
sẽ **đỏ nếu có route nào quên khai báo quyền**.

Ma trận quyền khai báo ở `src/roles/role-permissions.ts`. `USER_WRITE`, `ROLE_READ`, `ROLE_WRITE` chỉ dành cho **ADMIN**
để vai trò khác không tự cấp quyền Admin cho mình. `USER_READ` hiện còn mở cho Quản lý đào tạo, Tuyển sinh, Kế toán
(cần PO xác nhận có nên cho xem toàn bộ danh sách tài khoản).

Controller cố ý **không** dùng `PermissionGuard`: `users/me/*` (chỉ cần đăng nhập, tự đổi mật khẩu của mình) và
`auth/password-reset/*` (công khai, vì người dùng quên mật khẩu chưa đăng nhập được).

## API

Header giả lập (xem ghi chú trên): `x-user-id: admin-1`, `x-user-roles: ADMIN`.

| Method | Endpoint | Quyền | Story |
|---|---|---|---|
| POST | `/users` | `USER_WRITE` | S1-08 tạo tài khoản, gửi email kích hoạt kèm mật khẩu tạm |
| GET | `/users?q=&role=&status=&page=&pageSize=` | `USER_READ` | S1-08 tìm kiếm, lọc, phân trang (mặc định 20) |
| GET | `/users/:id` | `USER_READ` | S1-08 |
| PATCH | `/users/:id` | `USER_WRITE` | S1-08 sửa họ tên, email, số điện thoại |
| DELETE | `/users/:id` | `USER_WRITE` | S1-08 xoá tài khoản |
| POST | `/users/:id/lock` · `/unlock` | `USER_WRITE` | S1-10 khoá (bắt buộc `reason`) / mở khoá |
| GET | `/users/:userId/roles` | `ROLE_READ` | S1-09 |
| POST · DELETE | `/users/:userId/roles/:role` | `ROLE_WRITE` | S1-09 gán / thu hồi vai trò |
| PATCH | `/users/me/password` | đăng nhập | S1-04 đổi mật khẩu |
| POST | `/auth/password-reset/request` | công khai | S1-03 gửi liên kết đặt lại |
| POST | `/auth/password-reset/confirm` | công khai | S1-03 đặt mật khẩu mới bằng token |
| POST | `/programs` | `PROGRAM_WRITE` | S2-04 khai báo chương trình (mã duy nhất, tên, mô tả, thời lượng, học phí, trạng thái) |
| GET | `/programs?q=&status=&page=&pageSize=` | `PROGRAM_READ` | S2-04 tìm kiếm, lọc, phân trang danh mục chương trình |
| GET | `/programs/check-code?code=&excludeId=` | `PROGRAM_READ` | S2-04 kiểm tra trùng mã trước khi lưu |
| GET | `/programs/:id` | `PROGRAM_READ` | S2-04 chi tiết chương trình |
| PATCH | `/programs/:id` | `PROGRAM_WRITE` | S2-04 cập nhật thông tin chương trình |
| POST | `/programs/:id/deactivate` | `PROGRAM_WRITE` | S2-04 ngừng áp dụng chương trình |
| DELETE | `/programs/:id` | `PROGRAM_WRITE` | S2-04 xoá chương trình (chặn khi có lớp đang chạy) |


### Đặt lại mật khẩu qua email (S1-03)

```bash
curl -X POST localhost:3000/auth/password-reset/request \
  -H 'Content-Type: application/json' -d '{"email":"user@tms.local"}'

curl -X POST localhost:3000/auth/password-reset/confirm \
  -H 'Content-Type: application/json' -d '{"token":"<token trong email>","newPassword":"MatKhauMoi123"}'
```

- Liên kết có hiệu lực **30 phút**, **chỉ dùng một lần**; yêu cầu mới làm liên kết cũ mất hiệu lực. Chỉ lưu băm SHA-256 của token.
- Luôn trả **cùng một thông báo** dù email có tồn tại hay không (không dò được tài khoản).
- Chỉ tài khoản `ACTIVE` nhận được liên kết; tài khoản bị khoá không tự mở lại bằng đường này.
- Mật khẩu mới theo quy tắc chung: 8–128 ký tự, có chữ cái và chữ số, khác mật khẩu hiện tại.
- Đặt lại thành công thì tăng `sessionVersion` (thu hồi phiên cũ).
- Email dev: `ConsoleMailService` in link ra terminal. Đặt `FRONTEND_ORIGIN` (mặc định `http://localhost:5173`) để đổi địa chỉ trong link.

### Đổi mật khẩu của tài khoản đang đăng nhập (S1-04)

```http
PATCH /users/me/password
Content-Type: application/json
x-user-id: user-1
x-user-roles: INSTRUCTOR
x-session-id: session-current-001
```

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

- Không nhận user ID từ request body; chỉ đổi mật khẩu của `req.actor.id`.
- Gửi `x-session-id` ổn định, riêng cho phiên đăng nhập hiện tại; khi thành công phiên này được giữ, các phiên khác đã biết bị thu hồi và nhận `401 SESSION_REVOKED` ở request tiếp theo.
- Response thành công gồm `message` và `revokedOtherSessions` (số phiên bị thu hồi).
- Mật khẩu hiện tại phải đúng. Mật khẩu mới dài 8–128 ký tự, có ít nhất một chữ cái và một chữ số.
- Tài khoản phải ở trạng thái `ACTIVE`.
- Khi thành công, `sessionVersion` cũng tăng một đơn vị để auth layer có thể đưa version vào token.

> **Giới hạn hiện tại:** registry lưu trong bộ nhớ và `ActorMiddleware` vẫn giả lập đăng nhập bằng `x-user-id` / `x-user-roles`. Request cũ không gửi `x-session-id` được gom vào session `legacy:<userId>`; endpoint đổi mật khẩu yêu cầu ID tường minh để giữ đúng phiên hiện tại. Khi tích hợp JWT thật, `sessionId` phải lấy từ claim `sid` đã ký/xác thực, không tin header do client tự khai; registry cũng cần chuyển sang storage dùng chung/persistent. Không dùng header demo như xác thực production.

### Quản lý danh mục chương trình đào tạo (S2-04)

- **Khai báo thông tin**: mã chương trình (`code`), tên (`name`), mô tả (`description`), tổng thời lượng (`totalDuration`), học phí chuẩn (`standardTuition`), trạng thái (`status`: `ACTIVE` | `INACTIVE`).
- **Mã chương trình là duy nhất**: kiểm tra trùng mã khi tạo mới hoặc cập nhật. Trả về `409 Conflict` nếu mã đã tồn tại. Hỗ trợ endpoint `/programs/check-code` để giao diện kiểm tra realtime.
- **Ràng buộc lớp đang chạy**: chương trình đang có lớp chạy không được xoá (`DELETE` trả về `409 Conflict` kèm mã lỗi `PROGRAM_HAS_RUNNING_CLASSES`), chỉ được ngừng áp dụng (`POST /programs/:id/deactivate` hoặc cập nhật `status: INACTIVE`).

## Kiểm thử

```bash
npm run lint && npm run build && npm run test:cov
```

## Cấu trúc

```
src/
├── main.ts · app.module.ts
├── programs/   quản lý danh mục chương trình đào tạo (S2-04)
├── roles/      ActorMiddleware, PermissionGuard, @RequirePermission, ma trận quyền, API vai trò (S1-05, S1-09)
├── sessions/   sổ đăng ký phiên để thu hồi phiên khác (S1-04)
└── users/      quản trị tài khoản, khoá/mở khoá, đổi & đặt lại mật khẩu, mail (S1-03, S1-04, S1-08, S1-10)
```

