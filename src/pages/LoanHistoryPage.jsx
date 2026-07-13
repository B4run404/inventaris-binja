import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function LoanHistoryPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('') // '' | 'aktif' | 'kembali'

  async function loadHistory() {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('riwayat_peminjaman')
      .select(`
        id,
        peminjam,
        catatan,
        tanggal_pinjam,
        tanggal_kembali,
        perkakas ( kode, nama, lokasi )
      `)
      .order('tanggal_pinjam', { ascending: false })

    setLoading(false)
    if (err) {
      setError('Gagal memuat riwayat. Periksa koneksi atau login Anda.')
      return
    }
    setRows(data || [])
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filtered = rows.filter((r) => {
    if (filterStatus === 'aktif') return !r.tanggal_kembali
    if (filterStatus === 'kembali') return !!r.tanggal_kembali
    return true
  })

  const totalAktif = rows.filter((r) => !r.tanggal_kembali).length

  function formatTgl(iso) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function durasiHari(pinjam, kembali) {
    const a = new Date(pinjam)
    const b = kembali ? new Date(kembali) : new Date()
    const hari = Math.floor((b - a) / (1000 * 60 * 60 * 24))
    return hari === 0 ? 'Hari ini' : `${hari} hari`
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <span className="status-pill perbaikan">Sedang Dipinjam {totalAktif}</span>
        <span className="status-pill layak">Total Riwayat {rows.length}</span>
      </div>

      {/* Filter */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="filter-row">
          <select
            className="field-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Semua Peminjaman</option>
            <option value="aktif">Belum Dikembalikan</option>
            <option value="kembali">Sudah Dikembalikan</option>
          </select>
          <button
            className="scan-cta secondary"
            style={{ marginTop: 0, padding: '9px 14px', whiteSpace: 'nowrap' }}
            onClick={loadHistory}
          >
            Muat Ulang
          </button>
        </div>
      </div>

      {loading && (
        <p className="scan-hint">
          <span className="spinner" /> Memuat riwayat...
        </p>
      )}
      {error && <div className="banner-error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p style={{ margin: 0 }}>Belum ada riwayat peminjaman.</p>
        </div>
      )}

      {filtered.map((r) => {
        const sudahKembali = !!r.tanggal_kembali
        return (
          <div
            key={r.id}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--steel-line)',
            }}
          >
            {/* Nama barang + status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="list-item-name">
                  {r.perkakas?.nama ?? '—'}
                </div>
                <div className="list-item-kode">
                  {r.perkakas?.kode ?? '—'}
                  {r.perkakas?.lokasi ? ` · ${r.perkakas.lokasi}` : ''}
                </div>
              </div>
              <span className={`status-pill ${sudahKembali ? 'layak' : 'perbaikan'}`}>
                {sudahKembali ? 'Kembali' : 'Dipinjam'}
              </span>
            </div>

            {/* Detail baris */}
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--paper-dim)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
              <span>
                <span style={{ color: 'var(--tag-amber)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Peminjam </span>
                <span style={{ color: 'var(--paper)' }}>{r.peminjam}</span>
              </span>
              <span>
                <span style={{ color: 'var(--tag-amber)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pinjam </span>
                {formatTgl(r.tanggal_pinjam)}
              </span>
              {r.tanggal_kembali ? (
                <span>
                  <span style={{ color: 'var(--tag-amber)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kembali </span>
                  {formatTgl(r.tanggal_kembali)}
                </span>
              ) : null}
              <span>
                <span style={{ color: 'var(--tag-amber)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Durasi </span>
                {durasiHari(r.tanggal_pinjam, r.tanggal_kembali)}
                {!sudahKembali && <span style={{ color: 'var(--warn)' }}> (berlangsung)</span>}
              </span>
            </div>

            {r.catatan && (
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--paper-dim)', fontStyle: 'italic' }}>
                {r.catatan}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
