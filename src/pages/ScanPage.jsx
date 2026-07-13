import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ToolTagCard from '../components/ToolTagCard'
import StatusUpdatePanel from '../components/StatusUpdatePanel'
import LoanPanel from '../components/LoanPanel'

const READER_ID = 'scan-reader'

export default function ScanPage() {
  const { displayName, isAdmin } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [item, setItem] = useState(null)
  const [notFoundCode, setNotFoundCode] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [manualKode, setManualKode] = useState('')
  const scannerRef = useRef(null)

  useEffect(() => {
    return () => {
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function lookupKode(kode) {
    setLoading(true)
    setError(null)
    setNotFoundCode(null)
    setItem(null)

    const { data, error: err } = await supabase
      .from('perkakas')
      .select('*')
      .eq('kode', kode)
      .maybeSingle()

    setLoading(false)

    if (err) {
      setError('Gagal mengambil data. Periksa koneksi atau pengaturan Supabase.')
      return
    }
    if (!data) {
      setNotFoundCode(kode)
      return
    }
    setItem(data)
  }

  async function startScanner() {
    setError(null)
    setItem(null)
    setNotFoundCode(null)
    setScanning(true)

    try {
      const html5Qrcode = new Html5Qrcode(READER_ID)
      scannerRef.current = html5Qrcode
      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        async (decodedText) => {
          await stopScanner()
          lookupKode(decodedText.trim())
        },
        () => {
          // ignore per-frame scan failures
        }
      )
    } catch (e) {
      setScanning(false)
      setError(
        'Tidak bisa mengakses kamera. Pastikan izin kamera diberikan dan situs diakses lewat HTTPS.'
      )
    }
  }

  async function stopScanner() {
    const s = scannerRef.current
    if (s) {
      try {
        await s.stop()
        s.clear()
      } catch (e) {
        // scanner already stopped
      }
    }
    setScanning(false)
  }

  return (
    <div>
      <div className="scan-frame">
        <div id={READER_ID} style={{ minHeight: scanning ? undefined : 0 }} />
        {!scanning && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div className="empty-state-icon">▢</div>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--paper-dim)' }}>
              Arahkan kamera ke barcode/QR di label perkakas
            </p>
          </div>
        )}
      </div>

      {!scanning ? (
        <button className="scan-cta" onClick={startScanner}>
          Mulai Scan
        </button>
      ) : (
        <button className="scan-cta secondary" onClick={stopScanner}>
          Hentikan Scan
        </button>
      )}

      {/* Manual code input fallback */}
      <div className="manual-divider">
        <span>atau ketik kode manual</span>
      </div>
      <form
        className="manual-input-row"
        onSubmit={(e) => {
          e.preventDefault()
          const kode = manualKode.trim()
          if (!kode) return
          stopScanner()
          lookupKode(kode)
          setManualKode('')
        }}
      >
        <input
          className="field-input"
          placeholder="Cth: BJ-001"
          value={manualKode}
          onChange={(e) => setManualKode(e.target.value)}
          style={{ flex: 1, margin: 0 }}
        />
        <button
          className="scan-cta"
          type="submit"
          disabled={!manualKode.trim() || loading}
          style={{ width: 'auto', marginTop: 0, padding: '11px 20px' }}
        >
          Cari
        </button>
      </form>

      {loading && (
        <p className="scan-hint">
          <span className="spinner" /> Mencari data...
        </p>
      )}

      {error && <div className="banner-error" style={{ marginTop: 14 }}>{error}</div>}

      {notFoundCode && (
        <div className="empty-state">
          <div className="empty-state-icon">?</div>
          <p style={{ margin: 0 }}>
            Kode <strong style={{ fontFamily: 'var(--font-mono)' }}>{notFoundCode}</strong> belum
            terdaftar di database.
          </p>
          <p style={{ fontSize: 12.5, marginTop: 6 }}>
            Tambahkan barang ini lewat tab "Tambah Barang".
          </p>
        </div>
      )}

      {item && (
        <>
          <ToolTagCard item={item} />
          <LoanPanel
            item={item}
            onUpdated={(updated) => setItem(updated)}
            defaultPeminjam={displayName}
            lockPeminjamName={!isAdmin}
          />
          <StatusUpdatePanel
            item={item}
            onUpdated={(updated) => setItem(updated)}
            defaultPetugas={displayName}
          />
        </>
      )}

      {!scanning && !item && !notFoundCode && !error && !loading && (
        <p className="scan-hint">
          Tekan "Mulai Scan" atau ketik kode barang di kolom di atas.
        </p>
      )}
    </div>
  )
}
