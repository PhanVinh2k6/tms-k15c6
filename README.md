# HỆ THỐNG QUẢN LÝ ĐÀO TẠO (TRAINING MANAGEMENT SYSTEM - TMS)

## 📌 1. Giới thiệu Dự án
Hệ thống Quản lý Đào tạo (TMS) là giải pháp quản lý nội bộ tập trung trên nền web nhằm hỗ trợ đội vận hành (Quản lý đào tạo, Giảng viên, Tư vấn tuyển sinh, Kế toán) theo dõi trọn vòng đời học viên từ giai đoạn Lead đến khi Tốt nghiệp trên một nguồn dữ liệu duy nhất.

## 🎯 2. Tầm nhìn & Mục tiêu
- **Tầm nhìn:** Thay thế việc vận hành thủ công trên Google Sheets, Zalo, Google Calendar bằng hệ thống thời gian thực, chủ động cảnh báo rủi ro (vắng học, nợ bài, công nợ học phí).
- **Mục tiêu 8 tuần:** 
  - Vận hành 1 lớp pilot chạy đủ chu trình (Ghi danh → Xếp lịch → Điểm danh → Chấm bài → Bảng điểm).
  - Điểm danh ≤ 60 giây/buổi; Chấm bài ≤ 3 phút/bài.
  - Công nợ học phí khớp 100% với kế toán.

## 👥 3. Các Vai trò Nghiệp vụ (8 Roles)
1. Guest (Khách)
2. Student (Học viên)
3. Instructor (Giảng viên)
4. TA (Trợ giảng)
5. Training Manager (Quản lý đào tạo)
6. Admissions (Tư vấn tuyển sinh)
7. Accountant (Kế toán)
8. Admin (Quản trị hệ thống)

## 🛠 4. Công nghệ Sử dụng (Tech Stack)
- **Frontend:** React + TypeScript
- **Backend:** NestJS
- **Database:** PostgreSQL
- **Authentication:** JWT (Access Token + Refresh Token)
- **CI/CD & Tools:** GitHub, Jira, Docker, Slack

## 🌳 5. Quy tắc Git Flow & Quy chuẩn Cộng tác
- `main`: Nhánh sản phẩm ổn định (Production).
- `develop`: Nhánh tích hợp code chính của các thành viên.
- `feature/<ID-Story>-<ten-tinh-nang>`: Nhánh làm tính năng cá nhân (Ví dụ: `feature/S1-01-login-api`).
- **Quy tắc Commit:** `feat(S1-01): implement login API` hoặc `fix(S1-02): resolve session timeout`.
- **Pull Request (PR):** Phải có ít nhất 1 thành viên review và phê duyệt trước khi merge vào `develop`.

## 👨‍💻 6. Thành viên Nhóm
- PO: Dư Thanh Hoàng
- Leader / Scrum Master: Phan Hà Thái Vinh (kiêm Developer)
- Developers: Chu Hải Đăng, Bùi Hải Đăng, Mạc Văn Trọng, Trịnh Quang Tuân, Bùi Anh Tuấn, Nguyễn Văn Tùng, Dương Công Vinh, Nguyễn Anh Vũ, Lương Minh Đoàn

## 🚀 7. Chạy dự án

```bash
# Backend  → http://localhost:3000
cd backend && npm install && npm run start:dev

# Frontend → http://localhost:5173  (đặt VITE_API_URL nếu backend khác cổng; xem frontend/.env.example)
cd frontend && npm install && npm run dev
```

Chi tiết API và phân quyền: [backend/README.md](backend/README.md).

## ✅ 8. Definition of Done (mỗi story phải đạt đủ mới được chuyển Done trên Jira)

1. Toàn bộ tiêu chí chấp nhận (AC) được kiểm chứng và đạt.
2. Code đã qua **ít nhất một người review** và được merge vào `develop` bằng PR.
3. Có test cho tầng service/API, **độ phủ ≥ 60%** (`npm run test:cov` trong `backend/`).
4. **CI xanh**: build, lint, test (GitHub Actions — `.github/workflows/ci.yml`).
5. Đã deploy lên staging và chạy được.
6. Quyền truy cập được kiểm ở **tầng server** (`@RequirePermission`), không chỉ ẩn ở giao diện.
7. Giao diện hoạt động đúng ở khổ 360px.
8. Không còn lỗi mức Major trở lên.
9. PO đã nghiệm thu trên môi trường staging.

Mẫu PR có sẵn checklist này (`.github/pull_request_template.md`).

## 🔒 9. Quy tắc nhánh `develop` (bật trong GitHub: Settings → Branches)

- Require a pull request before merging, **tối thiểu 1 approval**, huỷ approval cũ khi có commit mới.
- Require status checks to pass: chọn **`CI xanh`**; bật "Require branches to be up to date before merging".
- Không cho push thẳng và không cho force-push vào `develop` / `main`.
- **Không commit trực tiếp trên giao diện web GitHub** (Add files via upload / Delete file) — dễ làm mất file như vụ PR #24.
- Chỉ mở PR khi story đã xong; nhánh đang code dở thì để PR ở dạng **Draft**.
