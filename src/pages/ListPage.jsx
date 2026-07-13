import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import EditItemForm from '../components/EditItemForm'

const STATUS_CLASS = {
  'Layak Pakai': 'layak',
  'Perlu Perbaikan': 'perbaikan',
  'Rusak / Afkir': 'rusak',
}

export default function ListPage() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  async function loadItems() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('perkakas')
      .select('*')
      .order('created_at', { ascending: false })

    setLoading(false)
    if (err) {
      setError('Gagal memuat data. Periksa koneksi atau login Anda.')
      return
    }
    setItems(data || [])
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function toggleDetail(it) {
    if (openId === it.id) {
      setOpenId(null)
      setQrDataUrl(null)
      setEditingId(null)
      return
    }
    setOpenId(it.id)
    setEditingId(null)
    const dataUrl = await QRCode.toDataURL(it.kode, { width: 220, margin: 1 })
    setQrDataUrl(dataUrl)
  }

  function handleSaved(updated) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
    setEditingId(null)
  }

  async function handleDelete(it) {
    if (!window.confirm(`Hapus "${it.nama}" (${it.kode})? Tindakan ini tidak bisa dibatalkan.`)) {
      return
    }
    setDeletingId(it.id)
    const { error: err } = await supabase.from('perkakas').delete().eq('id', it.id)
    setDeletingId(null)
    if (err) {
      alert('Gagal menghapus barang. Pastikan Anda login sebagai admin.')
      return
    }
    setItems((prev) => prev.filter((row) => row.id !== it.id))
    if (openId === it.id) {
      setOpenId(null)
      setQrDataUrl(null)
      setEditingId(null)
    }
  }

  const counts = items.reduce(
    (acc, it) => {
      acc[it.kondisi] = (acc[it.kondisi] || 0) + 1
      if (it.status_pinjam === 'Dipinjam') acc.dipinjam = (acc.dipinjam || 0) + 1
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
        {(counts.dipinjam || 0) > 0 && (
          <span className="status-pill perbaikan">Dipinjam {counts.dipinjam}</span>
        )}
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
            onClick={() => toggleDetail(it)}
            style={{
              all: 'unset',
              display: 'flex',
              width: '100%',
              cursor: 'pointer',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '12px 4px',
              borderBottom: openId === it.id ? 'none' : '1px solid var(--steel-line)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="list-item-name">{it.nama}</div>
              <div className="list-item-kode">{it.kode} · {it.lokasi || '—'}</div>
              {it.status_pinjam === 'Dipinjam' && it.dipinjam_oleh && (
                <div style={{ fontSize: 12, color: 'var(--warn)', marginTop: 4 }}>
                  Dipinjam: {it.dipinjam_oleh}
                  {it.tanggal_pinjam && (
                    <> · {new Date(it.tanggal_pinjam).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short',
                    })}</>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', marginLeft: 8 }}>
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
              {editingId === it.id ? (
                <EditItemForm
                  item={it}
                  onSaved={handleSaved}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
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

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        className="scan-cta secondary"
                        style={{ marginTop: 0, flex: 1 }}
                        onClick={() => setEditingId(it.id)}
                      >
                        Edit Barang
                      </button>
                      <button
                        className="scan-cta danger"
                        style={{ marginTop: 0, flex: 1 }}
                        onClick={() => handleDelete(it)}
                        disabled={deletingId === it.id}
                      >
                        {deletingId === it.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
