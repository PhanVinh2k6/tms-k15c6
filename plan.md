# Demo Sprint 1 — TMS

## Mục tiêu
Một demo web end-to-end cho các luồng Sprint 1: đăng nhập, phân quyền, dashboard theo vai trò, duy trì phiên/đăng xuất, quản lý tài khoản, gán/thu hồi vai trò và khóa/mở khóa.

## Design Read
- Artifact: internal SaaS dashboard.
- Audience: quản trị hệ thống, giảng viên và nhân sự vận hành đào tạo.
- Visual language: editorial operations dashboard — nền sáng lạnh, panel navy/tím, thẻ KPI rõ ràng.
- Mode: extension, giữ visual vocabulary hiện tại của TMS.
- Information density: 8/10; motion: 3/10; responsive priority: 360px.

## Design Decisions
- Palette: navy #1d2545, purple #6556c7, pink accent #d05d9c, teal success #52b9aa, surface #f7f8ff.
- Typography: DM Sans cho nội dung, Manrope cho tiêu đề.
- Layout: sidebar cố định trên desktop, topbar trạng thái phiên, dashboard content với KPI/quick actions/activity.
- Signature elements: gradient TMS, role/status chips, soft-glass cards.
- Interaction: toast, modal xác nhận, empty/loading/error states, role-aware navigation.
- Responsive: sidebar thu gọn, bảng chuyển card, KPI 2 cột rồi 1 cột dưới 360px.

## Cấu trúc
- `frontend/src/features/dashboard/`: dashboard theo role và dữ liệu demo.
- `frontend/dashboard.html`: entry point dashboard.
- `frontend/src/features/account-lock/api.ts`: auth/session/role API client.
- `frontend/src/App.tsx`: login redirect theo role.
- `frontend/src/features/user-account/UserAccountPage.tsx`: quản trị role S1-09.
- `public/manus-routes.json`: route manifest.

## Phạm vi triển khai
- S1-01: login redirect theo role, demo user dashboard, thông báo lockout đã có từ backend.
- S1-02: session status, refresh-on-load, logout rõ ràng và session-expired state.
- S1-09: API assign/revoke role và modal quản lý role trực tiếp trên danh sách user.
