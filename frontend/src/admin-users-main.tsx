import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UserAccountPage } from './features/user-account/UserAccountPage'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Không tìm thấy phần tử #root để khởi tạo ứng dụng.')
}

createRoot(rootElement).render(
  <StrictMode>
    <UserAccountPage />
  </StrictMode>,
)
