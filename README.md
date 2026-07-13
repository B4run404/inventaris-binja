# Inventaris Perkakas Binja

Aplikasi web untuk mendata perkakas di Binja Lapas dan mengecek nama serta
kelayakan barang lewat scan barcode/QR menggunakan kamera HP.

- **Scan Barang** — buka kamera, scan barcode di label perkakas, langsung
  muncul kartu detail (nama, kategori, lokasi, status kelayakan).
- **Tambah Barang** — isi form data barang baru, sistem otomatis membuat
  kode unik + QR code siap cetak untuk ditempel di barang.
- **Rekap** — daftar semua barang beserta ringkasan jumlah per status.
- **Ubah Status & Riwayat** — langsung dari hasil scan, bisa ubah status
  kondisi barang (dengan catatan dan nama petugas), dan lihat riwayat
  perubahan status sebelumnya.
- **Peminjaman Alat** — dari hasil scan, tandai barang "Dipinjam" (wajib isi
  nama peminjam) atau "Dikembalikan", dengan konfirmasi sebelum disimpan.
  Status peminjaman juga terlihat di tab Rekap.

Dibangun dengan React + Vite, database Supabase (PostgreSQL).

---

## 1. Siapkan Supabase

> **Sudah punya database dari versi sebelumnya?** Jangan jalankan seluruh
> `schema.sql` dari atas (nanti error karena tabel sudah ada). Cukup buka
> file itu, scroll ke bagian paling bawah berjudul **"MIGRASI"**, lalu
> jalankan hanya blok SQL itu di SQL Editor Supabase. Ini aman dan tidak
> akan menghapus data barang yang sudah ada.

1. Buat akun/login di [supabase.com](https://supabase.com) dan buat project baru.
2. Di dashboard project, buka **SQL Editor** → buat query baru → tempel
   seluruh isi file `supabase/schema.sql` dari folder ini → klik **Run**.
   Ini akan membuat tabel `perkakas`, `riwayat_kondisi`, dan mengaktifkan
   Row Level Security dengan kebijakan akses dasar.
3. Buka **Project Settings > API**. Catat dua nilai berikut:
   - `Project URL`
   - `anon public` key

## 2. Jalankan project di komputer (lewat VSCode)

1. Buka folder ini di VSCode (`File > Open Folder`).
2. Buka terminal di VSCode (`` Ctrl+` ``), lalu jalankan:
   ```bash
   npm install
   ```
3. Salin `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
4. Buka file `.env`, isi dengan `Project URL` dan `anon public key` dari
   Supabase yang tadi dicatat.
5. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
6. Buka alamat yang muncul di terminal (biasanya `http://localhost:5173`).

> **Catatan soal kamera:** browser hanya mengizinkan akses kamera lewat
> `localhost` atau HTTPS. Saat sudah di-deploy (langkah di bawah), fitur
> scan akan otomatis jalan karena domainnya sudah HTTPS.

## 3. Push ke GitHub

Dari terminal VSCode, di dalam folder project:

```bash
git init
git add .
git commit -m "Inisialisasi aplikasi inventaris perkakas Binja"
```

Lalu buat repo baru di GitHub (lewat github.com, tombol **New repository**,
jangan centang "Add README" karena sudah ada), lalu hubungkan:

```bash
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME/NAMA-REPO` dengan punya kamu.

## 4. Deploy (opsional, supaya bisa diakses dari HP di lapangan)

Cara termudah pakai **Vercel** (gratis untuk pemakaian seperti ini):

1. Buka [vercel.com](https://vercel.com), login pakai akun GitHub.
2. **Add New Project** → pilih repo yang barusan di-push.
3. Di bagian **Environment Variables**, tambahkan `VITE_SUPABASE_URL` dan
   `VITE_SUPABASE_ANON_KEY` dengan nilai yang sama seperti di `.env`.
4. Klik **Deploy**. Setelah selesai, kamu dapat URL publik (HTTPS) yang
   bisa dibuka lewat HP untuk scan barcode langsung di lapangan.

## Struktur project

```
src/
  App.jsx              # navigasi tab (Scan / Tambah / Rekap)
  supabaseClient.js     # koneksi ke Supabase
  pages/
    ScanPage.jsx        # scan kamera + tampilkan kartu detail
    AddItemPage.jsx     # form tambah barang + generate QR
    ListPage.jsx        # daftar & rekap semua barang
  components/
    ToolTagCard.jsx        # kartu detail bergaya label gantung perkakas
    StatusUpdatePanel.jsx  # ubah status kondisi + lihat riwayat
    LoanPanel.jsx          # tandai dipinjam/dikembalikan + konfirmasi
  styles/index.css      # semua styling
supabase/schema.sql      # skema tabel + RLS untuk dijalankan di Supabase
```

## Mengembangkan lebih lanjut

Beberapa ide lanjutan yang bisa ditambahkan nanti:
- Login petugas (Supabase Auth) supaya nama petugas di riwayat kondisi
  terisi otomatis, bukan diketik manual.
- Upload foto barang (Supabase Storage) dan tampilkan di kartu detail.
- Sistem peminjaman alat (siapa pinjam, kapan kembali).
- Reminder jadwal pengecekan berkala.
- Filter & pencarian di tab Rekap kalau data sudah banyak.
