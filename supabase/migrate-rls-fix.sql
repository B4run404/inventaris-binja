-- ====================================================================
-- MIGRASI: Perbaikan RLS riwayat_peminjaman
-- Jalankan di Supabase SQL Editor jika migrate-auth.sql sudah pernah
-- dijalankan sebelumnya (database sudah aktif).
--
-- Masalah sebelumnya: semua user authenticated bisa UPDATE baris
-- riwayat_peminjaman milik siapapun (mis. mengubah tanggal_kembali
-- orang lain). Policy ini membatasi UPDATE hanya untuk admin.
-- ====================================================================

-- Hapus policy lama yang terlalu permisif
drop policy if exists "riwayat_peminjaman: ubah" on riwayat_peminjaman;

-- Pastikan fungsi is_admin() ada (sudah dibuat oleh migrate-auth.sql)
-- Ganti dengan policy baru: hanya admin yang bisa UPDATE
create policy "riwayat_peminjaman: ubah admin" on riwayat_peminjaman
  for update to authenticated
  using (is_admin())
  with check (is_admin());
