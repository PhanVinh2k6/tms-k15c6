# Quy chuẩn Git Flow & Cộng tác

## Branch

```text
main                              # Production ổn định
develop                           # Tích hợp chính
feature/<ID-Story>-<ten-tinh-nang> # Tính năng cá nhân
```

Ví dụ: `feature/S1-01-login-api`, `feature/S1-03-profile-api`.

## Commit

```text
feat(S1-01): implement login API
fix(S1-02): resolve session timeout
docs(S1-03): update profile API contract
```

## Pull Request

1. Rebase hoặc cập nhật từ `develop` trước khi mở PR.
2. Mô tả rõ scope, test evidence và Jira Story.
3. CI phải pass.
4. Cần ít nhất **1 thành viên review và approve** trước khi merge vào `develop`.
5. Không self-merge khi chưa có approval.
6. Sau merge, xóa branch feature.

## Naming

- TypeScript file: `kebab-case`.
- Class: `PascalCase`.
- Function/variable: `camelCase`.
- SQL column: `snake_case`.
- DTO có hậu tố `.dto.ts`; entity `.entity.ts`; guard `.guard.ts`; strategy `.strategy.ts`.
