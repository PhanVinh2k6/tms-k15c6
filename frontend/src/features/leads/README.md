# S2-09 — Quản lý danh sách lead (giao diện)

Trang `leads.html` → `<LeadsPage />`. Giao diện theo Figma "S2-09: Quản lý danh sách lead", gọi API backend S2-09 (`/leads`).

| File | Vai trò |
|---|---|
| `LeadsPage.tsx` | Bảng lead, phân trang 20/trang, thông báo, hiện nút theo vai trò |
| `LeadFormDialog.tsx` | Form Thêm / Chỉnh sửa Lead, cảnh báo trùng số khi đang gõ (`GET /leads/check-phone`) |
| `DeleteLeadDialog.tsx` | Hộp thoại xác nhận xoá |
| `api.ts` | Gọi API, dùng chung `request()` của `account-lock/api.ts` (Bearer token, tự làm mới phiên) |
| `validation.ts` | Kiểm tra dữ liệu trước khi gửi (cùng quy tắc backend), tính các trường thay đổi khi sửa |
| `types.ts` | Kiểu dữ liệu, nhãn Nguồn, vai trò được đọc / ghi / xoá |

## Hành vi theo tiêu chí chấp nhận
- **AC1** Thêm / sửa lead với họ tên, số điện thoại, email, nguồn, chương trình quan tâm. Lỗi 400 từ server hiện ngay dưới ô tương ứng.
- **AC2** Số trùng chỉ **cảnh báo**, không chặn nút Lưu; sau khi lưu vẫn nhắc lại cảnh báo do backend trả về. Sửa mà giữ số của chính lead thì không báo trùng.
- **AC3** Nút Xóa chỉ hiện với Quản lý đào tạo, nhưng quyền thật do server quyết định: nhận 403 thì hiện "Không có quyền xóa — Chỉ Quản lý đào tạo mới có thể thực hiện thao tác này."
- Tư vấn tuyển sinh, Admin: xem / thêm / sửa. Quản lý đào tạo: xem / xoá. Vai trò khác: màn "Không có quyền truy cập".

## Chạy thử
Cần đăng nhập (JWT); tài khoản phải có vai trò `ADMISSIONS`, `TRAINING_MANAGER` hoặc `ADMIN`. Sau khi đăng nhập mở `http://localhost:5173/leads.html`.
