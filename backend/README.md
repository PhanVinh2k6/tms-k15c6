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
