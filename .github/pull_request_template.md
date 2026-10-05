## Mô tả
<!-- Story: S1-xx — làm gì, vì sao. Liên kết Jira: SCRUM-xx -->

## Definition of Done (đánh dấu hết trước khi xin review)
- [ ] Toàn bộ tiêu chí chấp nhận (AC) của story đã được kiểm chứng và đạt
- [ ] Có unit/e2e test cho service/API mới; độ phủ nhánh mới ≥ 60%
- [ ] `npm run lint`, `npm run build`, `npm test` pass ở máy mình (CI xanh)
- [ ] Quyền truy cập được kiểm ở **tầng server** (`@RequirePermission`), không chỉ ẩn ở giao diện
- [ ] Giao diện (nếu có) hoạt động đúng ở khổ 360px
- [ ] README / tài liệu API đã cập nhật
- [ ] Không còn lỗi mức Major trở lên
- [ ] Nhánh đã cập nhật từ `develop` và **không** chứa file thừa (file ở thư mục gốc, `dist/`, `.env`, `node_modules/`)

## Cách kiểm thử
<!-- Lệnh chạy / các bước bấm / curl mẫu -->

## Ảnh chụp (nếu có giao diện)

---
Merge vào `develop` khi: ít nhất **1 người review phê duyệt** và check **CI xanh** đạt.
Chỉ chuyển Jira sang Done sau khi PR đã merge và AC đã được PO nghiệm thu.
