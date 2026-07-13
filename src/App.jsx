import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ScanPage from './pages/ScanPage'
import AddItemPage from './pages/AddItemPage'
import ListPage from './pages/ListPage'

const ALL_TABS = [
  { key: 'scan', label: 'Scan Barang', roles: ['admin', 'peminjam'] },
  { key: 'add', label: 'Tambah Barang', roles: ['admin'] },
  { key: 'list', label: 'Rekap', roles: ['admin', 'peminjam'] },
]

function AppContent() {
  const { session, loading, profile, isAdmin, displayName, signOut } = useAuth()
  const [tab, setTab] = useState('scan')

  if (loading) {
    return (
      <div className="app-shell">
        <main className="app-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="scan-hint"><span className="spinner" /> Memuat...</p>
        </main>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  if (!profile) {
    return (
      <div className="app-shell">
        <main className="app-body">
          <div className="banner-error">
            Profil akun belum tersedia. Hubungi admin untuk mengatur akun Anda di Supabase.
          </div>
          <button className="scan-cta secondary" onClick={signOut}>Keluar</button>
        </main>
      </div>
    )
  }

  const tabs = ALL_TABS.filter((t) => t.roles.includes(profile.role))
  const activeTab = tabs.some((t) => t.key === tab) ? tab : tabs[0]?.key

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Binja · Lapas Tanjung Pati</p>
        <h1 className="app-title">Inventaris Perkakas</h1>
        <p className="app-sub">Scan barcode untuk cek nama & kelayakan barang</p>
        <div className="user-bar">
          <span className="user-bar-name">
            {displayName}
            <span className={`role-badge ${isAdmin ? 'admin' : ''}`}>
              {isAdmin ? 'Admin' : 'Peminjam'}
            </span>
          </span>
          <button type="button" className="user-bar-logout" onClick={signOut}>
            Keluar
          </button>
        </div>
      </header>

      <main className="app-body">
        {activeTab === 'scan' && <ScanPage />}
        {activeTab === 'add' && <AddItemPage />}
        {activeTab === 'list' && <ListPage />}
      </main>

      <nav className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
