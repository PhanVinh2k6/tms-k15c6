# TMS Backend — S1-09

Triển khai API **gán và thu hồi vai trò người dùng** cho EP-01.

## Chạy local

```bash
npm install
npm run start:dev
```

Mặc định server chạy tại `http://localhost:3000`.

> Trong scaffold hiện tại, `ActorMiddleware` dùng `x-user-id` và `x-user-roles` để mô phỏng context từ JWT. Khi tích hợp authentication thật, thay middleware này bằng JWT guard nhưng giữ nguyên `req.actor`.

## API

Tất cả endpoint yêu cầu actor là Admin:

```http
x-user-id: admin-1
x-user-roles: ADMIN
```

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/users/:userId/roles` | Xem các role hiện tại |
| POST | `/users/:userId/roles/:role` | Gán role; không xoá các role đang có |
| DELETE | `/users/:userId/roles/:role` | Thu hồi role |

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

Ví dụ:

```bash
curl -H 'x-user-id: admin-1' -H 'x-user-roles: ADMIN' \
  -X POST http://localhost:3000/users/user-1/roles/TRAINING_MANAGER

curl -H 'x-user-id: admin-1' -H 'x-user-roles: ADMIN' \
  http://localhost:3000/users/user-1/roles

curl -H 'x-user-id: admin-1' -H 'x-user-roles: ADMIN' \
  -X DELETE http://localhost:3000/users/user-1/roles/TRAINING_MANAGER
```

## S1-09 acceptance criteria

- Một user có thể giữ nhiều role cùng lúc: `Set<Role>` và endpoint POST chỉ thêm role.
- Thay đổi có hiệu lực ngay ở request tiếp theo: service cập nhật user store đồng bộ.
- Không thể tự thu hồi `ADMIN`: service trả `400 Bad Request` khi actor tự xoá role Admin.
- Chỉ Admin được quản lý role: `AdminGuard` trả `403 Forbidden` cho actor không có role `ADMIN`.

## Kiểm thử

```bash
npm run build
npm test -- --runInBand
```

nhánh tree 
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   └── roles/
│       ├── actor.middleware.ts
│       ├── admin.guard.ts
│       ├── role.types.ts
│       ├── roles.controller.ts
│       ├── roles.module.ts
│       ├── roles.service.ts
│       └── roles.e2e-spec.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── nest-cli.json
├── jest.config.js
├── .gitignore
└── README.md
