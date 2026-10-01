import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hai trang vào: index.html (đăng nhập, S1-01) và admin-users.html (quản lý tài khoản, S1-10).
// Khi nhóm có router chung, gắn <AccountLockPage /> vào route /admin/users rồi bỏ admin-users.html.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        adminUsers: resolve(import.meta.dirname, 'admin-users.html'),
      },
    },
  },
})
