import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function formatLoanError(err, action) {
  const msg = (err?.message || '').toLowerCase()

  if (msg.includes('status_pinjam') || msg.includes('dipinjam_oleh') || msg.includes('tanggal_pinjam')) {
    return `Kolom peminjaman belum ada di database. Jalankan file supabase/migrate-peminjaman.sql di Supabase SQL Editor, lalu coba lagi.`
  }
  if (msg.includes('riwayat_peminjaman')) {
    return `Tabel riwayat peminjaman belum ada. Jalankan file supabase/migrate-peminjaman.sql di Supabase SQL Editor, lalu coba lagi.`
  }
  if (msg.includes('permission') || err?.code === '42501') {
    return `Akses ditolak database saat ${action}. Periksa Row Level Security di Supabase.`
  }

  const detail = err?.message ? ` (${err.message})` : ''
  return `Gagal ${action}${detail}. Periksa koneksi atau pengaturan Supabase.`
}

export default function LoanPanel({ item, onUpdated, defaultPeminjam = '', lockPeminjamName = false }) {
  const [mode, setMode] = useState(null) // null | 'confirm-pinjam' | 'confirm-kembali'
  const [peminjam, setPeminjam] = useState(defaultPeminjam)
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isDipinjam = item.status_pinjam === 'Dipinjam'

  useEffect(() => {
    if (defaultPeminjam) setPeminjam(defaultPeminjam)
  }, [defaultPeminjam])

  function openMode() {
    if (!isDipinjam && defaultPeminjam) setPeminjam(defaultPeminjam)
    setMode(isDipinjam ? 'confirm-kembali' : 'confirm-pinjam')
  }

  async function confirmPinjam(e) {
    e.preventDefault()
    if (!peminjam.trim()) {
      setError('Nama peminjam wajib diisi.')
      return
    }
    setSaving(true)
    setError(null)

    const now = new Date().toISOString()

    const { error: updateErr } = await supabase
      .from('perkakas')
      .update({ status_pinjam: 'Dipinjam', dipinjam_oleh: peminjam, tanggal_pinjam: now })
      .eq('id', item.id)

    if (updateErr) {
      setSaving(false)
      setError(formatLoanError(updateErr, 'menyimpan status peminjaman'))
      return
    }

    const { error: historyErr } = await supabase.from('riwayat_peminjaman').insert([
      {
        perkakas_id: item.id,
        peminjam,
        catatan: catatan || null,
        tanggal_pinjam: now,
      },
    ])

    if (historyErr) {
      setSaving(false)
      setError(formatLoanError(historyErr, 'menyimpan riwayat peminjaman'))
      return
    }

    setSaving(false)
    setMode(null)
    setPeminjam('')
    setCatatan('')
    onUpdated({ ...item, status_pinjam: 'Dipinjam', dipinjam_oleh: peminjam, tanggal_pinjam: now })
  }

  async function confirmKembali(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const now = new Date().toISOString()

    const { error: updateErr } = await supabase
      .from('perkakas')
      .update({ status_pinjam: 'Tersedia', dipinjam_oleh: null, tanggal_pinjam: null })
      .eq('id', item.id)

    if (updateErr) {
      setSaving(false)
      setError(formatLoanError(updateErr, 'menyimpan status pengembalian'))
      return
    }

    const { error: historyErr } = await supabase
      .from('riwayat_peminjaman')
      .update({ tanggal_kembali: now })
      .eq('perkakas_id', item.id)
      .is('tanggal_kembali', null)

    if (historyErr) {
      setSaving(false)
      setError(formatLoanError(historyErr, 'menyimpan riwayat pengembalian'))
      return
    }

    setSaving(false)
    setMode(null)
    onUpdated({ ...item, status_pinjam: 'Tersedia', dipinjam_oleh: null, tanggal_pinjam: null })
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          background: 'var(--steel-800)',
          border: '1px solid var(--steel-line)',
          borderRadius: 6,
          marginBottom: 10,
        }}
      >
        <div>
          <span className={`status-pill ${isDipinjam ? 'perbaikan' : 'layak'}`}>
            {isDipinjam ? 'Dipinjam' : 'Tersedia'}
          </span>
          {isDipinjam && item.dipinjam_oleh && (
            <div style={{ fontSize: 12.5, color: 'var(--paper-dim)', marginTop: 6 }}>
              Oleh: {item.dipinjam_oleh}
              {item.tanggal_pinjam && (
                <> · sejak {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div className="banner-error">{error}</div>}

      {mode === null && (
        <button
          className="scan-cta"
          style={{ marginTop: 0 }}
          onClick={openMode}
        >
          {isDipinjam ? 'Tandai Dikembalikan' : 'Tandai Dipinjam'}
        </button>
      )}

      {mode === 'confirm-pinjam' && (
        <form onSubmit={confirmPinjam}>
          <div className="field-group">
            <label className="field-label">Nama Peminjam</label>
            <input
              className="field-input"
              value={peminjam}
              onChange={(e) => setPeminjam(e.target.value)}
              placeholder="Cth: Andi"
              autoFocus
              readOnly={lockPeminjamName}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Catatan (opsional)</label>
            <textarea
              className="field-textarea"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Cth: Untuk perbaikan pagar blok C"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="scan-cta" type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Konfirmasi Peminjaman'}
            </button>
            <button
              type="button"
              className="scan-cta secondary"
              onClick={() => { setMode(null); setError(null) }}
              disabled={saving}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {mode === 'confirm-kembali' && (
        <form onSubmit={confirmKembali}>
          <p className="scan-hint" style={{ marginTop: 0, textAlign: 'left' }}>
            Konfirmasi bahwa alat ini sudah dikembalikan{item.dipinjam_oleh ? ` oleh ${item.dipinjam_oleh}` : ''}?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="scan-cta" type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Ya, Sudah Dikembalikan'}
            </button>
            <button
              type="button"
              className="scan-cta secondary"
              onClick={() => setMode(null)}
              disabled={saving}
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
