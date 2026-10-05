import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AccountLockPage } from './features/account-lock/AccountLockPage'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Không tìm thấy phần tử #root để khởi tạo ứng dụng.')
}

createRoot(rootElement).render(
  <StrictMode>
    <AccountLockPage />
  </StrictMode>,
)
