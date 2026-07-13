import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const KONDISI_OPTIONS = ['Layak Pakai', 'Perlu Perbaikan', 'Rusak / Afkir']

export default function StatusUpdatePanel({ item, onUpdated, defaultPetugas = '' }) {
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [kondisiBaru, setKondisiBaru] = useState(item.kondisi)
  const [catatan, setCatatan] = useState('')
  const [diubahOleh, setDiubahOleh] = useState(defaultPetugas)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    setKondisiBaru(item.kondisi)
    setEditing(false)
    setShowHistory(false)
    setCatatan('')
    setDiubahOleh(defaultPetugas)
    setError(null)
  }, [item.id, defaultPetugas])

  async function loadHistory() {
    setHistoryLoading(true)
    const { data, error: err } = await supabase
      .from('riwayat_kondisi')
      .select('*')
      .eq('perkakas_id', item.id)
      .order('created_at', { ascending: false })

    setHistoryLoading(false)
    if (!err) setHistory(data || [])
  }

  function toggleHistory() {
    const next = !showHistory
    setShowHistory(next)
    if (next) loadHistory()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const kondisiLama = item.kondisi

    const { error: updateErr } = await supabase
      .from('perkakas')
      .update({ kondisi: kondisiBaru })
      .eq('id', item.id)

    if (updateErr) {
      setSaving(false)
      setError('Gagal menyimpan perubahan status.')
      return
    }

    await supabase.from('riwayat_kondisi').insert([
      {
        perkakas_id: item.id,
        kondisi_lama: kondisiLama,
        kondisi_baru: kondisiBaru,
        catatan: catatan || null,
        diubah_oleh: diubahOleh || null,
      },
    ])

    setSaving(false)
    setEditing(false)
    setCatatan('')
    onUpdated({ ...item, kondisi: kondisiBaru })
    if (showHistory) loadHistory()
  }

  return (
    <div style={{ marginTop: 14 }}>
      {!editing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="scan-cta" style={{ marginTop: 0 }} onClick={() => setEditing(true)}>
            Ubah Status
          </button>
          <button className="scan-cta secondary" style={{ marginTop: 0 }} onClick={toggleHistory}>
            {showHistory ? 'Sembunyikan Riwayat' : 'Lihat Riwayat'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="banner-error">{error}</div>}

          <div className="field-group">
            <label className="field-label">Status Baru</label>
            <select
              className="field-select"
              value={kondisiBaru}
              onChange={(e) => setKondisiBaru(e.target.value)}
            >
              {KONDISI_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Nama Petugas (opsional)</label>
            <input
              className="field-input"
              value={diubahOleh}
              onChange={(e) => setDiubahOleh(e.target.value)}
              placeholder="Cth: Baruna"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Catatan (opsional)</label>
            <textarea
              className="field-textarea"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Cth: Mata gergaji tumpul, perlu diasah"
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="scan-cta" type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button
              type="button"
              className="scan-cta secondary"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {showHistory && (
        <div style={{ marginTop: 14 }}>
          {historyLoading && <p className="scan-hint"><span className="spinner" /> Memuat riwayat...</p>}
          {!historyLoading && history.length === 0 && (
            <p className="scan-hint">Belum ada riwayat perubahan status.</p>
          )}
          {history.map((h) => (
            <div className="list-item" key={h.id} style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{h.kondisi_lama} → <strong>{h.kondisi_baru}</strong></span>
                <span className="list-item-kode">
                  {new Date(h.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
              {(h.diubah_oleh || h.catatan) && (
                <div style={{ fontSize: 12, color: 'var(--paper-dim)', marginTop: 4 }}>
                  {h.diubah_oleh && <span>Oleh: {h.diubah_oleh}. </span>}
                  {h.catatan}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
