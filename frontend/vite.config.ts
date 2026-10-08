import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Các trang vào: index.html (đăng nhập, S1-01), admin-users.html (quản lý tài khoản, S1-08)
// admin-account-lock.html (khóa / mở khóa tài khoản, S1-10) và password-reset.html (quên / đặt lại mật khẩu, S1-03).
// Khi nhóm có router chung, gắn <UserAccountPage /> và <AccountLockPage /> vào route rồi bỏ các file .html này.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        adminUsers: resolve(import.meta.dirname, 'admin-users.html'),
        adminAccountLock: resolve(import.meta.dirname, 'admin-account-lock.html'),
        passwordReset: resolve(import.meta.dirname, 'password-reset.html'),
        activate: resolve(import.meta.dirname, 'activate.html'),
      },
    },
  },
})
