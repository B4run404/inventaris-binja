import { useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../supabaseClient'

const KATEGORI_OPTIONS = [
  'Alat Pertukangan',
  'Alat Las',
  'Alat Kebun/Pertanian',
  'Alat Listrik',
  'Alat Kebersihan',
  'Lainnya',
]

function generateKode() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  const stamp = Date.now().toString(36).slice(-4).toUpperCase()
  return `BJ-${stamp}${rand}`
}

export default function AddItemPage() {
  const [form, setForm] = useState({
    nama: '',
    kategori: KATEGORI_OPTIONS[0],
    kondisi: 'Layak Pakai',
    lokasi: '',
    catatan: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedItem, setSavedItem] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nama.trim()) {
      setError('Nama barang wajib diisi.')
      return
    }
    setSaving(true)
    setError(null)

    const kode = generateKode()

    const { data, error: err } = await supabase
      .from('perkakas')
      .insert([{ ...form, kode }])
      .select()
      .single()

    setSaving(false)

    if (err) {
      setError('Gagal menyimpan barang. Periksa pengaturan Supabase dan koneksi.')
      return
    }

    setSavedItem(data)
    const dataUrl = await QRCode.toDataURL(data.kode, { width: 220, margin: 1 })
    setQrDataUrl(dataUrl)
    setForm({ nama: '', kategori: KATEGORI_OPTIONS[0], kondisi: 'Layak Pakai', lokasi: '', catatan: '' })
  }

  function resetForm() {
    setSavedItem(null)
    setQrDataUrl(null)
  }

  if (savedItem) {
    return (
      <div>
        <p className="app-eyebrow" style={{ marginBottom: 2 }}>Berhasil Ditambahkan</p>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 4px', textTransform: 'uppercase' }}>
          {savedItem.nama}
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--paper-dim)', margin: '0 0 4px' }}>
          {savedItem.kode}
        </p>

        <div className="qr-preview">
          <img src={qrDataUrl} alt={`Barcode untuk ${savedItem.nama}`} width={200} height={200} />
        </div>
        <p className="scan-hint">
          Cetak QR ini dan tempel di badan perkakas. Scan lewat tab "Scan Barang" untuk memunculkan detailnya.
        </p>

        <a
          href={qrDataUrl}
          download={`barcode-${savedItem.kode}.png`}
          className="scan-cta"
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
        >
          Unduh Barcode
        </a>
        <button className="scan-cta secondary" onClick={resetForm}>
          Tambah Barang Lain
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="banner-error">{error}</div>}

      <div className="field-group">
        <label className="field-label">Nama Barang</label>
        <input
          className="field-input"
          value={form.nama}
          onChange={(e) => updateField('nama', e.target.value)}
          placeholder="Cth: Gergaji Mesin Portable"
        />
      </div>

      <div className="field-group">
        <label className="field-label">Kategori</label>
        <select
          className="field-select"
          value={form.kategori}
          onChange={(e) => updateField('kategori', e.target.value)}
        >
          {KATEGORI_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">Kondisi Saat Ini</label>
        <select
          className="field-select"
          value={form.kondisi}
          onChange={(e) => updateField('kondisi', e.target.value)}
        >
          <option>Layak Pakai</option>
          <option>Perlu Perbaikan</option>
          <option>Rusak / Afkir</option>
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">Lokasi Penyimpanan</label>
        <input
          className="field-input"
          value={form.lokasi}
          onChange={(e) => updateField('lokasi', e.target.value)}
          placeholder="Cth: Rak B - Gudang Binja"
        />
      </div>

      <div className="field-group">
        <label className="field-label">Catatan (opsional)</label>
        <textarea
          className="field-textarea"
          value={form.catatan}
          onChange={(e) => updateField('catatan', e.target.value)}
          placeholder="Catatan tambahan tentang barang ini"
        />
      </div>

      <button className="scan-cta" type="submit" disabled={saving}>
        {saving ? 'Menyimpan...' : 'Simpan & Buat Barcode'}
      </button>
    </form>
  )
}
