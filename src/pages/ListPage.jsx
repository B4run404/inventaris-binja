import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const STATUS_CLASS = {
  'Layak Pakai': 'layak',
  'Perlu Perbaikan': 'perbaikan',
  'Rusak / Afkir': 'rusak',
}

export default function ListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('perkakas')
        .select('*')
        .order('created_at', { ascending: false })

      if (!active) return
      setLoading(false)
      if (err) {
        setError('Gagal memuat data. Periksa pengaturan Supabase.')
        return
      }
      setItems(data || [])
    }
    load()
    return () => { active = false }
  }, [])

  const counts = items.reduce(
    (acc, it) => {
      acc[it.kondisi] = (acc[it.kondisi] || 0) + 1
      return acc
    },
    {}
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <span className="status-pill layak">Layak {counts['Layak Pakai'] || 0}</span>
        <span className="status-pill perbaikan">Perbaikan {counts['Perlu Perbaikan'] || 0}</span>
        <span className="status-pill rusak">Rusak {counts['Rusak / Afkir'] || 0}</span>
      </div>

      {loading && <p className="scan-hint"><span className="spinner" /> Memuat data...</p>}
      {error && <div className="banner-error">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">▢</div>
          <p style={{ margin: 0 }}>Belum ada barang terdaftar.</p>
        </div>
      )}

      {items.map((it) => (
        <div className="list-item" key={it.id}>
          <div>
            <div className="list-item-name">{it.nama}</div>
            <div className="list-item-kode">{it.kode} · {it.lokasi || '—'}</div>
          </div>
          <span className={`status-pill ${STATUS_CLASS[it.kondisi] || 'perbaikan'}`}>
            {it.kondisi}
          </span>
        </div>
      ))}
    </div>
  )
}
