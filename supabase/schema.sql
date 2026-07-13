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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_perkakas_kode on perkakas (kode);

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

-- KEBIJAKAN SEDERHANA UNTUK PEMAKAIAN INTERNAL:
-- mengizinkan akses penuh lewat anon key (cukup untuk aplikasi internal
-- yang hanya dipakai petugas di jaringan/HP kantor).
-- Untuk produksi yang lebih ketat, ganti dengan kebijakan berbasis
-- Supabase Auth (mis. hanya user yang login yang boleh insert/update).
create policy "Izinkan semua akses (internal)" on perkakas
  for all using (true) with check (true);

create policy "Izinkan semua akses riwayat (internal)" on riwayat_kondisi
  for all using (true) with check (true);
