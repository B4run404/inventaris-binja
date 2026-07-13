-- Buat akun Admin & Peminjam dengan UUID tetap.
-- Untuk RLS & kebijakan akses lengkap, jalankan juga migrate-auth.sql.
--
-- GANTI password di bawah sebelum dijalankan (min. 6 karakter).
-- Default sementara: Binja@2026

-- ----------------------------------------------------------------
-- 0. Tabel profil (wajib ada sebelum insert user)
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  role text not null default 'peminjam'
    check (role in ('admin', 'peminjam')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ----------------------------------------------------------------
-- Admin
-- UUID : 79abf9e9-7e2b-4122-87f3-7108b1784d4c
-- Email: Admin@binja.id
-- ----------------------------------------------------------------
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '79abf9e9-7e2b-4122-87f3-7108b1784d4c',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'Admin@binja.id',
  crypt('Binja@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nama":"Admin","role":"admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '79abf9e9-7e2b-4122-87f3-7108b1784d4c',
  '79abf9e9-7e2b-4122-87f3-7108b1784d4c',
  jsonb_build_object(
    'sub', '79abf9e9-7e2b-4122-87f3-7108b1784d4c',
    'email', 'Admin@binja.id',
    'email_verified', true
  ),
  'email',
  '79abf9e9-7e2b-4122-87f3-7108b1784d4c',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, nama, role)
values ('79abf9e9-7e2b-4122-87f3-7108b1784d4c', 'Admin', 'admin')
on conflict (id) do update set
  nama = excluded.nama,
  role = excluded.role;

-- ----------------------------------------------------------------
-- Peminjam
-- UUID : 9a45f0a5-fcf4-4d14-8b81-8325ac5ab6f9
-- Email: Peminjam@binja.id
-- ----------------------------------------------------------------
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '9a45f0a5-fcf4-4d14-8b81-8325ac5ab6f9',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'Peminjam@binja.id',
  crypt('Binja@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nama":"Peminjam","role":"peminjam"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '9a45f0a5-fcf4-4d14-8b81-8325ac5ab6f9',
  '9a45f0a5-fcf4-4d14-8b81-8325ac5ab6f9',
  jsonb_build_object(
    'sub', '9a45f0a5-fcf4-4d14-8b81-8325ac5ab6f9',
    'email', 'Peminjam@binja.id',
    'email_verified', true
  ),
  'email',
  '9a45f0a5-fcf4-4d14-8b81-8325ac5ab6f9',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, nama, role)
values ('9a45f0a5-fcf4-4d14-8b81-8325ac5ab6f9', 'Peminjam', 'peminjam')
on conflict (id) do update set
  nama = excluded.nama,
  role = excluded.role;
