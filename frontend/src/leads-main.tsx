import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LeadsPage } from './features/leads/LeadsPage'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Không tìm thấy phần tử #root để khởi tạo ứng dụng.')
}

createRoot(rootElement).render(
  <StrictMode>
    <LeadsPage />
  </StrictMode>,
)
