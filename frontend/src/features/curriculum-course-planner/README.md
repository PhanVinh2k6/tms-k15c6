# S2-06 — Gắn môn học và sắp xếp lộ trình chương trình

Component frontend cho Quản lý đào tạo.

## Đáp ứng acceptance criteria

- **AC1:** tải danh sách môn thuộc chương trình; thêm từ danh mục; gỡ môn và cập nhật lại thứ tự hiển thị.
- **AC2:** kéo thả hoặc dùng nút lên/xuống bằng bàn phím; nút `Lưu thứ tự` gửi danh sách `courseIds`; sau khi API thành công, dùng response backend để hiển thị thứ tự đã lưu.
- **AC3:** mở hộp thoại môn tiên quyết, chọn nhiều môn; mỗi thay đổi gọi API và cập nhật bằng response backend.
- Hiển thị loading, success, lỗi API và nút thử lại.
- Nhãn điều khiển, `aria-label`, trạng thái `disabled` và thao tác nút lên/xuống hỗ trợ bàn phím; layout có breakpoint 360px.

## Tích hợp

```tsx
import {
  CurriculumCoursePlanner,
  createCurriculumCoursePlannerApi,
} from './features/curriculum-course-planner'

<CurriculumCoursePlanner
  programId="program-001"
  programName="Cử nhân Công nghệ thông tin"
  api={createCurriculumCoursePlannerApi('/api')}
/>
```

## API mặc định

| Method | Endpoint | Payload |
| --- | --- | --- |
| GET | `/programs/:programId/courses` | — |
| GET | `/programs/:programId/available-courses` | — |
| POST | `/programs/:programId/courses` | `{ courseId }` |
| DELETE | `/programs/:programId/courses/:courseId` | — |
| PUT | `/programs/:programId/courses/order` | `{ courseIds: string[] }` |
| PUT | `/programs/:programId/courses/:courseId/prerequisites` | `{ prerequisiteIds: string[] }` |

API trả về `CurriculumCourse` gồm `id`, `code`, `name`, `credits`, `order`, `prerequisites`.

## Kiểm thử thủ công/UI

1. Tải trang: kiểm tra trạng thái loading, sau đó danh sách lấy từ API.
2. Thêm môn: mở danh mục, tìm, chọn; kiểm tra môn xuất hiện và toast thành công.
3. Gỡ môn: xác nhận gỡ; kiểm tra môn biến mất; thử trả lỗi API để thấy banner lỗi.
4. Kéo thả hoặc dùng nút lên/xuống; bấm `Lưu thứ tự`; tải lại và xác nhận thứ tự theo response backend.
5. Mở `Tiên quyết`, chọn/bỏ chọn; xác nhận lựa chọn được cập nhật sau response API.
6. Dùng Tab/Enter/Space trên các nút; kiểm tra breakpoint 360px không tràn ngang.
