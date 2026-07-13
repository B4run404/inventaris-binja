import { useState } from 'react'
import { supabase } from '../supabaseClient'

const KATEGORI_OPTIONS = [
  'Alat Pertukangan',
  'Alat Las',
  'Alat Kebun/Pertanian',
  'Alat Listrik',
  'Alat Kebersihan',
  'Lainnya',
]

const KONDISI_OPTIONS = ['Layak Pakai', 'Perlu Perbaikan', 'Rusak / Afkir']

export default function EditItemForm({ item, onSaved, onCancel }) {
  const [form, setForm] = useState({
    nama: item.nama,
    kategori: item.kategori || KATEGORI_OPTIONS[0],
    kondisi: item.kondisi,
    lokasi: item.lokasi || '',
    catatan: item.catatan || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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

    const { data, error: err } = await supabase
      .from('perkakas')
      .update(form)
      .eq('id', item.id)
      .select()
      .single()

    setSaving(false)
    if (err) {
      setError(err.message || 'Gagal menyimpan perubahan.')
      return
    }
    onSaved(data)
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      {error && <div className="banner-error">{error}</div>}

      <div className="field-group">
        <label className="field-label">Nama Barang</label>
        <input
          className="field-input"
          value={form.nama}
          onChange={(e) => updateField('nama', e.target.value)}
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
        <label className="field-label">Kondisi</label>
        <select
          className="field-select"
          value={form.kondisi}
          onChange={(e) => updateField('kondisi', e.target.value)}
        >
          {KONDISI_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">Lokasi</label>
        <input
          className="field-input"
          value={form.lokasi}
          onChange={(e) => updateField('lokasi', e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="field-label">Catatan</label>
        <textarea
          className="field-textarea"
          value={form.catatan}
          onChange={(e) => updateField('catatan', e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="scan-cta" type="submit" disabled={saving} style={{ marginTop: 0 }}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button
          type="button"
          className="scan-cta secondary"
          onClick={onCancel}
          disabled={saving}
          style={{ marginTop: 0 }}
        >
          Batal
        </button>
      </div>
    </form>
  )
}
