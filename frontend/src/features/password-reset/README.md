# S1-03 Đặt lại mật khẩu (giao diện)

Luồng quên mật khẩu, nối với API backend thật:

| Bước | API | Ghi chú |
|---|---|---|
| Nhập email, gửi liên kết (cả "Gửi lại") | `POST /auth/password-reset/request` | Luôn trả cùng một thông báo dù email có tồn tại hay không |
| Mở liên kết trong email, đặt mật khẩu mới | `POST /auth/password-reset/confirm` | Liên kết hiệu lực 30 phút, dùng một lần |

Trang: `password-reset.html` (đích của liên kết trong email, dạng `/password-reset.html?token=...`).
Mật khẩu mới: tối thiểu 8 ký tự, có chữ cái và chữ số (khớp quy tắc backend).

Địa chỉ backend lấy từ `VITE_API_URL` (mặc định `http://localhost:3000`). Khi có router chung, gắn
`<PasswordReset />` vào route `/reset-password` và đổi `resetLink` trong `UsersService.requestPasswordReset`.
