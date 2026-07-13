import { useState } from 'react'
import ScanPage from './pages/ScanPage'
import AddItemPage from './pages/AddItemPage'
import ListPage from './pages/ListPage'

const TABS = [
  { key: 'scan', label: 'Scan Barang' },
  { key: 'add', label: 'Tambah Barang' },
  { key: 'list', label: 'Rekap' },
]

export default function App() {
  const [tab, setTab] = useState('scan')

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Binja · Lapas Tanjung Pati</p>
        <h1 className="app-title">Inventaris Perkakas</h1>
        <p className="app-sub">Scan barcode untuk cek nama & kelayakan barang</p>
      </header>

      <main className="app-body">
        {tab === 'scan' && <ScanPage />}
        {tab === 'add' && <AddItemPage />}
        {tab === 'list' && <ListPage />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
