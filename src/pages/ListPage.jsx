import { useEffect, useCallback, useMemo, useState } from 'react'
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

  // Filter state
  const [search, setSearch] = useState('')
  const [filterKondisi, setFilterKondisi] = useState('')
  const [filterPinjam, setFilterPinjam] = useState('')

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

  // Filtered items based on search + kondisi + status pinjam
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (q && !it.nama.toLowerCase().includes(q) && !it.kode.toLowerCase().includes(q)) return false
      if (filterKondisi && it.kondisi !== filterKondisi) return false
      if (filterPinjam && it.status_pinjam !== filterPinjam) return false
      return true
    })
  }, [items, search, filterKondisi, filterPinjam])

  const hasFilter = search || filterKondisi || filterPinjam

  function clearFilters() {
    setSearch('')
    setFilterKondisi('')
    setFilterPinjam('')
  }

  const counts = items.reduce(
    (acc, it) => {
      acc[it.kondisi] = (acc[it.kondisi] || 0) + 1
      if (it.status_pinjam === 'Dipinjam') acc.dipinjam = (acc.dipinjam || 0) + 1
      return acc
    },
    {}
  )

  /**
   * Export data yang sedang ditampilkan (sesuai filter) ke file CSV.
   * CSV bisa langsung dibuka di Excel / Google Sheets.
   */
  const exportToCSV = useCallback(() => {
    const source = hasFilter ? filteredItems : items
    if (source.length === 0) return

    const headers = [
      'Kode',
      'Nama Barang',
      'Kategori',
      'Kondisi',
      'Lokasi',
      'Status Pinjam',
      'Dipinjam Oleh',
      'Tanggal Pinjam',
      'Catatan',
      'Terakhir Diupdate',
      'Ditambahkan',
    ]

    function esc(val) {
      if (val == null || val === '') return ''
      const s = String(val)
      // Wrap in quotes if it contains comma, quote, or newline
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }

    function fmtDate(iso) {
      if (!iso) return ''
      return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const rows = source.map((it) =>
      [
        it.kode,
        it.nama,
        it.kategori || '',
        it.kondisi,
        it.lokasi || '',
        it.status_pinjam || 'Tersedia',
        it.dipinjam_oleh || '',
        fmtDate(it.tanggal_pinjam),
        it.catatan || '',
        fmtDate(it.updated_at),
        fmtDate(it.created_at),
      ]
        .map(esc)
        .join(',')
    )

    // BOM for UTF-8 so Excel reads accented chars correctly
    const bom = '\uFEFF'
    const csv = bom + headers.join(',') + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const suffix = hasFilter ? '_filtered' : ''

    const a = document.createElement('a')
    a.href = url
    a.download = `laporan_inventaris_binja_${stamp}${suffix}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [items, filteredItems, hasFilter])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="status-pill layak">Layak {counts['Layak Pakai'] || 0}</span>
        <span className="status-pill perbaikan">Perbaikan {counts['Perlu Perbaikan'] || 0}</span>
        <span className="status-pill rusak">Rusak {counts['Rusak / Afkir'] || 0}</span>
        {(counts.dipinjam || 0) > 0 && (
          <span className="status-pill perbaikan">Dipinjam {counts.dipinjam}</span>
        )}
        <button
          className="export-btn"
          onClick={exportToCSV}
          disabled={items.length === 0}
          title={hasFilter ? `Export ${filteredItems.length} barang (sesuai filter)` : `Export semua ${items.length} barang`}
        >
          ↓ Export{hasFilter ? ` (${filteredItems.length})` : ''}
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-row">
          <input
            className="field-input"
            placeholder="Cari nama atau kode..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpenId(null) }}
            style={{ flex: 1 }}
          />
          {hasFilter && (
            <button className="filter-clear" onClick={clearFilters}>Reset</button>
          )}
        </div>
        <div className="filter-row">
          <select
            className="field-select"
            value={filterKondisi}
            onChange={(e) => { setFilterKondisi(e.target.value); setOpenId(null) }}
            style={{ flex: 1 }}
          >
            <option value="">Semua Kondisi</option>
            <option>Layak Pakai</option>
            <option>Perlu Perbaikan</option>
            <option>Rusak / Afkir</option>
          </select>
          <select
            className="field-select"
            value={filterPinjam}
            onChange={(e) => { setFilterPinjam(e.target.value); setOpenId(null) }}
            style={{ flex: 1 }}
          >
            <option value="">Semua Status</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Dipinjam">Dipinjam</option>
          </select>
        </div>
        {hasFilter && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--paper-dim)' }}>
            Menampilkan {filteredItems.length} dari {items.length} barang
          </p>
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

      {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">◎</div>
          <p style={{ margin: 0 }}>Tidak ada barang yang cocok dengan filter.</p>
          <button className="filter-clear" style={{ marginTop: 10 }} onClick={clearFilters}>
            Reset Filter
          </button>
        </div>
      )}

      {filteredItems.map((it) => (
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
