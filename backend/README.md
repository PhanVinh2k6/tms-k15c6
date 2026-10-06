# TMS Backend — S1 Authentication & Profile

Backend NestJS + PostgreSQL cho frontend `s1-02-logout-session`.

## Chức năng

- Đăng ký, đăng nhập email/password.
- JWT Access Token (15 phút) + Refresh Token (1 ngày hoặc 7 ngày khi `remember=true`), refresh rotation và revoke khi logout.
- Xem/cập nhật hồ sơ cá nhân qua `GET/PATCH /api/v1/users/me`.
- Swagger tại `/docs`.
- PostgreSQL migration, Docker Compose, GitHub Actions CI.

## Chạy local

```bash
cp .env.example .env
npm install
# Khởi động PostgreSQL
npm run start:dev
```

> Môi trường development dùng `synchronize=true` để khởi động nhanh. Production phải chạy migration và đặt `NODE_ENV=production`.

```bash
docker compose up --build
```

## API chính

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Không | Tạo tài khoản |
| POST | `/api/v1/auth/login` | Không | Nhận access/refresh token |
| POST | `/api/v1/auth/refresh` | Không | Cấp lại cặp token |
| POST | `/api/v1/auth/logout` | Bearer | Thu hồi refresh token |
| GET | `/api/v1/users/me` | Bearer | Xem hồ sơ cá nhân |
| PATCH | `/api/v1/users/me` | Bearer | Cập nhật `fullName`, `phoneNumber`, `avatarUrl`, `bio` |

### Ví dụ cập nhật hồ sơ

```json
PATCH /api/v1/users/me
Authorization: Bearer <accessToken>

{
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0900000000",
  "bio": "Quản lý đào tạo"
}
```

## Quy tắc đặt tên file

- File TypeScript dùng **kebab-case**: `update-profile.dto.ts`, `jwt-auth.guard.ts`.
- Class dùng **PascalCase**: `UpdateProfileDto`, `JwtAuthGuard`.
- Biến/hàm dùng **camelCase**.
- Database column dùng **snake_case**, API JSON dùng **camelCase**.
- Test đặt cạnh module hoặc trong `test/`, hậu tố `.spec.ts`.
- Không commit `.env`, secret, token hoặc artifact build.

## Git Flow & cộng tác

- `main`: nhánh sản phẩm ổn định (Production).
- `develop`: nhánh tích hợp code chính.
- `feature/<ID-Story>-<ten-tinh-nang>`: nhánh tính năng, ví dụ `feature/S1-01-login-api` hoặc `feature/S1-03-profile-api`.
- Commit theo Conventional Commits và Story ID: `feat(S1-01): implement login API`, `fix(S1-02): resolve session timeout`.
- PR vào `develop` phải có **ít nhất 1 thành viên review và phê duyệt** trước khi merge.
- CI bắt buộc pass: lint, test, build.
- Jira là nguồn Story ID; Slack dùng thông báo CI/PR và phối hợp team.

## Gợi ý tích hợp frontend

Frontend lưu `accessToken` trong memory/state; gọi refresh khi nhận `401`, sau đó retry request. Khi logout, gọi `/api/v1/auth/logout`, xóa token local và chuyển về màn hình đăng nhập.
