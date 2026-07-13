import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(
        err.message?.includes('Invalid login')
          ? 'Email atau password salah.'
          : err.message || 'Gagal masuk. Coba lagi.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Binja · Lapas Tanjung Pati</p>
        <h1 className="app-title">Inventaris Perkakas</h1>
        <p className="app-sub">Masuk untuk mengelola inventaris</p>
      </header>

      <main className="app-body" style={{ paddingBottom: 40 }}>
        <form onSubmit={handleSubmit}>
          {error && <div className="banner-error">{error}</div>}

          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="username"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button className="scan-cta" type="submit" disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="scan-hint" style={{ marginTop: 20 }}>
          Akun dibuat oleh admin di Supabase. Hubungi admin jika belum punya akun.
        </p>
      </main>
    </div>
  )
}
