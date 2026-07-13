-- Jalankan di Supabase Dashboard > SQL Editor (aman dijalankan berkali-kali).
-- Untuk database yang sudah punya tabel perkakas dari versi lama.

alter table perkakas add column if not exists status_pinjam text not null default 'Tersedia'
  check (status_pinjam in ('Tersedia', 'Dipinjam'));
alter table perkakas add column if not exists dipinjam_oleh text;
alter table perkakas add column if not exists tanggal_pinjam timestamptz;

create table if not exists riwayat_peminjaman (
  id uuid primary key default gen_random_uuid(),
  perkakas_id uuid references perkakas (id) on delete cascade,
  peminjam text not null,
  catatan text,
  tanggal_pinjam timestamptz not null default now(),
  tanggal_kembali timestamptz
);

create index if not exists idx_riwayat_peminjaman_perkakas on riwayat_peminjaman (perkakas_id);

alter table riwayat_peminjaman enable row level security;
drop policy if exists "Izinkan semua akses peminjaman (internal)" on riwayat_peminjaman;
create policy "Izinkan semua akses peminjaman (internal)" on riwayat_peminjaman
  for all using (true) with check (true);
