import { useState, type FormEvent } from 'react'
import { activateAccount } from '../account-lock/api'

/** Render the activation form using the URL token, with submission and completion feedback. */
export default function Activation() {
  const [token] = useState(() => {
    const value = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? ''
    if (window.location.hash) window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`)
    return value
  })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  /** Check the token, password format, and confirmation before requesting account activation. */
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!token) return setError('Liên kết kích hoạt không hợp lệ.')
    if (password.length < 8 || !/\p{L}/u.test(password) || !/\p{N}/u.test(password)) return setError('Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số.')
    if (password !== confirm) return setError('Mật khẩu xác nhận chưa khớp.')
    setLoading(true)
    try { await activateAccount(token, password); setDone(true) } catch { setError('Liên kết không hợp lệ hoặc đã hết hạn.') } finally { setLoading(false) }
  }
  return <main style={{ maxWidth: 480, margin: '10vh auto', padding: 24, fontFamily: 'system-ui' }}><h1>Kích hoạt tài khoản TMS</h1>{done ? <><p>Tài khoản đã được kích hoạt thành công.</p><a href="/">Đăng nhập</a></> : <form onSubmit={submit}><label>Mật khẩu mới<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></label><label>Xác nhận mật khẩu<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" /></label>{error && <p role="alert">{error}</p>}<button type="submit" disabled={loading}>{loading ? 'Đang kích hoạt…' : 'Kích hoạt tài khoản'}</button></form>}</main>
}
