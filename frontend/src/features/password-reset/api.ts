const API_URL = String(import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

/** Lỗi từ backend (hoặc mất mạng). `code` khớp mã lỗi backend: INVALID_RESET_TOKEN, PASSWORD_UNCHANGED, ... */
export class PasswordResetApiError extends Error {
  status: number
  code: string
  fieldErrors: Record<string, string>

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'PasswordResetApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

async function post(path: string, body: unknown): Promise<{ message: string }> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new PasswordResetApiError(0, 'NETWORK_ERROR', 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.')
  }

  const data = (await response.json().catch(() => ({}))) as {
    code?: string
    message?: string
    errors?: Record<string, string>
  }
  if (!response.ok) {
    throw new PasswordResetApiError(
      response.status,
      data.code ?? 'UNKNOWN_ERROR',
      data.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      data.errors ?? {},
    )
  }
  return { message: data.message ?? '' }
}

/** Luôn thành công với mọi email hợp lệ (backend không tiết lộ email có tồn tại hay không). */
export function requestPasswordReset(email: string) {
  return post('/auth/password-reset/request', { email })
}

export function confirmPasswordReset(token: string, newPassword: string) {
  return post('/auth/password-reset/confirm', { token, newPassword })
}
