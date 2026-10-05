# S1-06 Menu điều hướng theo quyền

Frontend component cho user story: người dùng chỉ thấy các chức năng phù hợp với quyền của mình.

## Đáp ứng acceptance criteria

- Menu không có permission tương ứng sẽ không được render.
- Hiển thị tên và vai trò người đang đăng nhập ở sidebar, summary và lời chào.
- Có menu drawer, backdrop và responsive breakpoint cho màn hình 360px.

## Tích hợp production

```tsx
import UserMenu from './features/user-menu-permissions/UserMenu'

<UserMenu
  user={{ name: 'Nguyễn Văn An', role: 'Giảng viên' }}
  permissions={['dashboard.view', 'courses.view', 'classes.view']}
  activePath="Tổng quan"
  onNavigate={(label) => navigate(label)}
/>
```

`permissions` nên được lấy từ user/session API. Không cho người dùng thật tự chọn role ở production.

## Mock 8 vai trò để demo

`roles.ts` chứa các profile demo: Guest, Student, Instructor, TA, Training Manager, Admissions, Accountant và Admin. Chỉ import file này trong trang demo hoặc development; không dùng nó làm nguồn phân quyền bảo mật.
