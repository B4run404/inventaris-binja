-- Jalankan script ini di Supabase Dashboard > SQL Editor

-- Tabel utama: perkakas
create table if not exists perkakas (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,
  nama text not null,
  kategori text,
  kondisi text not null default 'Layak Pakai'
    check (kondisi in ('Layak Pakai', 'Perlu Perbaikan', 'Rusak / Afkir')),
  lokasi text,
  catatan text,
  foto_url text,
  status_pinjam text not null default 'Tersedia'
    check (status_pinjam in ('Tersedia', 'Dipinjam')),
  dipinjam_oleh text,
  tanggal_pinjam timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_perkakas_kode on perkakas (kode);

-- Riwayat peminjaman: histori lengkap siapa pinjam kapan, kembali kapan
create table if not exists riwayat_peminjaman (
  id uuid primary key default gen_random_uuid(),
  perkakas_id uuid references perkakas (id) on delete cascade,
  peminjam text not null,
  catatan text,
  tanggal_pinjam timestamptz not null default now(),
  tanggal_kembali timestamptz
);

create index if not exists idx_riwayat_peminjaman_perkakas on riwayat_peminjaman (perkakas_id);

-- Riwayat perubahan kondisi (opsional, untuk audit trail)
create table if not exists riwayat_kondisi (
  id uuid primary key default gen_random_uuid(),
  perkakas_id uuid references perkakas (id) on delete cascade,
  kondisi_lama text,
  kondisi_baru text,
  catatan text,
  diubah_oleh text,
  created_at timestamptz not null default now()
);

-- Trigger: otomatis update updated_at setiap kali baris diubah
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_perkakas_updated_at on perkakas;
create trigger trg_perkakas_updated_at
  before update on perkakas
  for each row execute function set_updated_at();

-- Row Level Security
alter table perkakas enable row level security;
alter table riwayat_kondisi enable row level security;
alter table riwayat_peminjaman enable row level security;

-- KEBIJAKAN SEDERHANA UNTUK PEMAKAIAN INTERNAL:
-- mengizinkan akses penuh lewat anon key (cukup untuk aplikasi internal
-- yang hanya dipakai petugas di jaringan/HP kantor).
-- Untuk produksi yang lebih ketat, ganti dengan kebijakan berbasis
-- Supabase Auth (mis. hanya user yang login yang boleh insert/update).
create policy "Izinkan semua akses (internal)" on perkakas
  for all using (true) with check (true);

create policy "Izinkan semua akses riwayat (internal)" on riwayat_kondisi
  for all using (true) with check (true);

create policy "Izinkan semua akses peminjaman (internal)" on riwayat_peminjaman
  for all using (true) with check (true);

-- ====================================================================
-- MIGRASI: kalau tabel "perkakas" sudah pernah dibuat sebelumnya (versi
-- lama tanpa kolom peminjaman), jalankan blok ini saja untuk menambah
-- kolom baru tanpa menghapus data yang sudah ada. Aman dijalankan
-- berkali-kali (idempotent).
-- ====================================================================
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
alter table riwayat_peminjaman enable row level security;
drop policy if exists "Izinkan semua akses peminjaman (internal)" on riwayat_peminjaman;
create policy "Izinkan semua akses peminjaman (internal)" on riwayat_peminjaman
  for all using (true) with check (true);
