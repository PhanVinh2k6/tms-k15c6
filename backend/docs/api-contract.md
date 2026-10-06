# API Contract v1

Base URL: `/api/v1`. Content-Type: `application/json`.

## Response chuẩn

Thành công trả `{ "data": ... }`; lỗi validation trả HTTP 400 với message từ NestJS. Access token gửi trong `Authorization: Bearer <token>`.

## Profile

`GET /users/me` trả:

```json
{
  "data": {
    "id": "uuid",
    "email": "name@company.com",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": null,
    "avatarUrl": null,
    "bio": null,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

`PATCH /users/me` nhận một hoặc nhiều trường: `fullName`, `phoneNumber`, `avatarUrl`, `bio`.
