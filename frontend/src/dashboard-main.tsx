import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Dashboard } from './features/dashboard/Dashboard'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Không tìm thấy phần tử #root để khởi tạo dashboard.')
createRoot(rootElement).render(<StrictMode><Dashboard /></StrictMode>)
