const STATUS_MAP = {
  'Layak Pakai': { cls: 'layak', label: 'Layak Pakai' },
  'Perlu Perbaikan': { cls: 'perbaikan', label: 'Perlu Perbaikan' },
  'Rusak / Afkir': { cls: 'rusak', label: 'Rusak / Afkir' },
}

export default function ToolTagCard({ item }) {
  const status = STATUS_MAP[item.kondisi] || { cls: 'perbaikan', label: item.kondisi }

  return (
    <div className="tool-tag">
      <div className={`stamp ${status.cls}`}>{status.label}</div>
      <p className="tool-tag-kode">{item.kode}</p>
      <h2 className="tool-tag-nama">{item.nama}</h2>

      <div className="tool-tag-row">
        <span>Kategori</span>
        <span>{item.kategori || '—'}</span>
      </div>
      <div className="tool-tag-row">
        <span>Lokasi</span>
        <span>{item.lokasi || '—'}</span>
      </div>
      <div className="tool-tag-row">
        <span>Terakhir Dicek</span>
        <span>
          {item.updated_at
            ? new Date(item.updated_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </span>
      </div>
      {item.catatan ? (
        <div className="tool-tag-row">
          <span>Catatan</span>
          <span>{item.catatan}</span>
        </div>
      ) : null}
    </div>
  )
}
