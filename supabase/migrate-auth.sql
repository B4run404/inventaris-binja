-- Jalankan di Supabase SQL Editor SETELAH migrate-peminjaman.sql
-- Mengaktifkan login + peran admin / peminjam

-- ----------------------------------------------------------------
-- 1. Tabel profil pengguna (terhubung ke Supabase Auth)
-- ----------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  role text not null default 'peminjam'
    check (role in ('admin', 'peminjam')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Otomatis buat profil saat user baru dibuat di Supabase Auth.
-- Saat buat user di Dashboard, isi User Metadata JSON:
--   { "nama": "Nama Lengkap", "role": "admin" }
-- atau { "nama": "Nama Lengkap", "role": "peminjam" }
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'peminjam')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- 2. Helper cek peran (dipakai RLS)
-- ----------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from profiles where id = auth.uid()),
    false
  );
$$;

-- ----------------------------------------------------------------
-- 3. RLS profil
-- ----------------------------------------------------------------
drop policy if exists "Profil: baca sendiri" on profiles;
create policy "Profil: baca sendiri" on profiles
  for select to authenticated
  using (id = auth.uid());

-- ----------------------------------------------------------------
-- 4. Ganti kebijakan terbuka dengan akses berbasis login
-- ----------------------------------------------------------------
drop policy if exists "Izinkan semua akses (internal)" on perkakas;
drop policy if exists "Izinkan semua akses riwayat (internal)" on riwayat_kondisi;
drop policy if exists "Izinkan semua akses peminjaman (internal)" on riwayat_peminjaman;

-- perkakas: semua user login bisa baca & ubah status; hanya admin tambah/hapus
create policy "perkakas: baca" on perkakas
  for select to authenticated using (true);

create policy "perkakas: tambah admin" on perkakas
  for insert to authenticated with check (is_admin());

create policy "perkakas: ubah" on perkakas
  for update to authenticated using (true) with check (true);

create policy "perkakas: hapus admin" on perkakas
  for delete to authenticated using (is_admin());

-- riwayat kondisi & peminjaman: semua user login
create policy "riwayat_kondisi: baca" on riwayat_kondisi
  for select to authenticated using (true);
create policy "riwayat_kondisi: tulis" on riwayat_kondisi
  for insert to authenticated with check (true);
create policy "riwayat_kondisi: ubah" on riwayat_kondisi
  for update to authenticated using (true) with check (true);

create policy "riwayat_peminjaman: baca" on riwayat_peminjaman
  for select to authenticated using (true);
create policy "riwayat_peminjaman: tulis" on riwayat_peminjaman
  for insert to authenticated with check (true);
-- UPDATE (catat tanggal_kembali) hanya boleh dilakukan oleh admin,
-- mencegah peminjam mengubah tanggal kembali milik orang lain.
create policy "riwayat_peminjaman: ubah admin" on riwayat_peminjaman
  for update to authenticated using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------
-- 5. User admin pertama (opsional)
-- Buat dulu user di Authentication > Users > Add user,
-- lalu ganti UUID di bawah dengan ID user tersebut:
--
-- insert into profiles (id, nama, role)
-- values ('PASTE-UUID-DISINI', 'Nama Admin', 'admin')
-- on conflict (id) do update set role = 'admin', nama = excluded.nama;
