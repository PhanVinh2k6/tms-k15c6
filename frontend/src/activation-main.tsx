import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Activation from './features/activation/Activation'
import './styles.css'
const root = document.getElementById('root')
if (!root) throw new Error('Không tìm thấy phần tử #root.')
createRoot(root).render(<StrictMode><Activation /></StrictMode>)
