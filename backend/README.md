# TMS Backend — S1-01

Backend API cho **đăng nhập bằng email và mật khẩu**.

## Chạy local

```bash
npm install
npm run build
npm run start:dev
```

Mặc định server chạy tại `http://localhost:3000`.

Mở `http://localhost:3000/` để kiểm tra trạng thái backend. Endpoint này trả về `status: "ok"` và danh sách API chính.

### `POST /auth/login`

Request: `{ "email": "admin@tms.local", "password": "Admin123!" }`

Response thành công gồm `accessToken`, `sessionId`, thông tin user không có password, và `redirectPath` theo role. Dùng token với `Authorization: Bearer <accessToken>` ở các API cần đăng nhập. `GET /auth/me` trả về user hiện tại.

Tài khoản demo local: `admin@tms.local / Admin123!`, `user@tms.local / User123!`, `student@tms.local / Student123!`.

Sai email hoặc mật khẩu luôn trả cùng thông báo `Email hoặc mật khẩu không đúng`. Sau 5 lần sai liên tiếp, tài khoản bị khóa 15 phút và request tiếp theo trả `429`.

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

Ví dụ:

```bash
curl -H 'x-user-id: admin-1' -H 'x-user-roles: ADMIN' \
  -X POST http://localhost:3000/users/user-1/roles/TRAINING_MANAGER

curl -H 'x-user-id: admin-1' -H 'x-user-roles: ADMIN' \
  http://localhost:3000/users/user-1/roles

curl -H 'x-user-id: admin-1' -H 'x-user-roles: ADMIN' \
  -X DELETE http://localhost:3000/users/user-1/roles/TRAINING_MANAGER
```

## S1-01 acceptance criteria

- Đăng nhập đúng trả JWT và trang đích tương ứng với role.
- Không tiết lộ email có tồn tại hay không.
- Sau 5 lần sai liên tiếp, tài khoản bị khóa 15 phút.
- Đăng nhập đúng reset bộ đếm sai.
- Không trả password hash.

## Auth session

Mỗi lần đăng nhập thành công tạo một session in-memory gắn với `jti` trong JWT:

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | `/auth/session` | Xem session hiện tại |
| GET | `/auth/sessions` | Xem các session đang hoạt động của user |
| DELETE | `/auth/session` | Logout và thu hồi session hiện tại |
| POST | `/auth/logout` | Alias logout bằng POST |

JWT đã bị thu hồi sẽ nhận `401 Session không hợp lệ hoặc đã hết hạn` ở các endpoint được bảo vệ. Session hiện là in-memory cho sprint; khi tích hợp PostgreSQL cần thay `SessionService` bằng repository lưu persistent.

## S1-09 role API

- Một user có thể giữ nhiều role cùng lúc: `Set<Role>` và endpoint POST chỉ thêm role.
- Thay đổi có hiệu lực ngay ở request tiếp theo: service cập nhật user store đồng bộ.
- Không thể tự thu hồi `ADMIN`: service trả `400 Bad Request` khi actor tự xoá role Admin.
- Chỉ Admin được quản lý role: `AdminGuard` trả `403 Forbidden` cho actor không có role `ADMIN`.

## Kiểm thử

```bash
npm run build
npm test
```

User store hiện là in-memory để chạy độc lập trong sprint; `UsersService` được tách riêng để thay implementation PostgreSQL mà không đổi API auth.
