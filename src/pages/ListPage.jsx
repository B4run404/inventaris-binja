import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
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
  const [openId, setOpenId] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)

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

  async function toggleBarcode(it) {
    if (openId === it.id) {
      setOpenId(null)
      setQrDataUrl(null)
      return
    }
    setOpenId(it.id)
    const dataUrl = await QRCode.toDataURL(it.kode, { width: 220, margin: 1 })
    setQrDataUrl(dataUrl)
  }

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
        <div key={it.id}>
          <button
            onClick={() => toggleBarcode(it)}
            style={{
              all: 'unset',
              display: 'flex',
              width: '100%',
              cursor: 'pointer',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 4px',
              borderBottom: openId === it.id ? 'none' : '1px solid var(--steel-line)',
            }}
          >
            <div>
              <div className="list-item-name">{it.nama}</div>
              <div className="list-item-kode">{it.kode} · {it.lokasi || '—'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <span className={`status-pill ${STATUS_CLASS[it.kondisi] || 'perbaikan'}`}>
                {it.kondisi}
              </span>
              {it.status_pinjam === 'Dipinjam' && (
                <span className="status-pill perbaikan">Dipinjam</span>
              )}
            </div>
          </button>

          {openId === it.id && (
            <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--steel-line)' }}>
              {qrDataUrl ? (
                <>
                  <div className="qr-preview">
                    <img src={qrDataUrl} alt={`Barcode untuk ${it.nama}`} width={180} height={180} />
                  </div>
                  <a
                    href={qrDataUrl}
                    download={`barcode-${it.kode}.png`}
                    className="scan-cta"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 10 }}
                  >
                    Unduh Barcode Ini
                  </a>
                </>
              ) : (
                <p className="scan-hint"><span className="spinner" /> Membuat barcode...</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
