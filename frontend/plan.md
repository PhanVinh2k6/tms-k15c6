# S2-08 — Biểu mẫu công khai đăng ký tư vấn

## Implementation
- Frontend độc lập bằng React + TypeScript + Vite.
- Không kết nối backend, API hoặc database; submit chỉ mô phỏng trạng thái thành công trong React state.
- Responsive từ 360px, desktop dùng shell có sidebar tím và khu vực nội dung sáng.

## Design decisions
- **Design movement:** SaaS operations dashboard, mềm mại và tin cậy theo reference Eduflow.
- **Core principles:** phân cấp rõ, form dễ quét, tương phản cao, nhiều khoảng thở.
- **Color philosophy:** tím gradient là màu nhận diện và CTA; lavender làm vùng nhấn; nền #F7F7FB giúp form trắng nổi lên.
- **Layout:** sidebar cố định ở desktop, form chính trong card rộng; mobile chuyển thành header nhỏ và flow một cột.
- **Signature elements:** logo Eduflow dạng chữ, pill trạng thái, đường gradient mảnh ở đầu form.
- **Interaction:** field focus có ring tím; lỗi hiển thị inline; submit đổi sang success card có mã tham chiếu.
- **Animation:** fade/slide nhẹ dưới 220ms, không dùng chuyển động gây phân tâm.
- **Typography:** Inter/system sans; heading đậm, body trung tính, label nhỏ uppercase nhẹ.
- **Brand essence:** trợ lý đăng ký tư vấn đào tạo rõ ràng, thân thiện, hiệu quả.
- **Brand voice:** “Đăng ký tư vấn” và “Để lại thông tin, đội ngũ Eduflow sẽ liên hệ với bạn trong thời gian sớm nhất.”

## Project structure
- `src/App.tsx`: shell, form state, validation và success state.
- `src/styles.css`: token màu, layout responsive, component styling.
- `src/main.tsx`: entry point.
- `public/manus-routes.json`: khai báo route `/`.
