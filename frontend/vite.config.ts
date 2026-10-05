import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Các trang vào: index.html (đăng nhập, S1-01), admin-users.html (quản lý tài khoản, S1-08)
// và admin-account-lock.html (khóa / mở khóa tài khoản, S1-10).
// Khi nhóm có router chung, gắn <UserAccountPage /> và <AccountLockPage /> vào route rồi bỏ các file .html này.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        adminUsers: resolve(import.meta.dirname, 'admin-users.html'),
        adminAccountLock: resolve(import.meta.dirname, 'admin-account-lock.html'),
      },
    },
  },
})
