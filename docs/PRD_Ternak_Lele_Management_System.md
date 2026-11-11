# PRD: Ternak Lele Management System (MVP Showcase)

Versi 1.0 | 11 November 2026 | Status: Draft showcase

## 1. Ringkasan Produk

Aplikasi web responsif (mobile-first) untuk mencatat siklus budidaya lele: tebar bibit, pakan dan kematian harian, panen, penjualan, hingga laba kotor per batch. Tujuan versi ini adalah **showcase alur end-to-end**.

## 2. Pengguna dan Peran

| Peran | Perangkat utama | Akses |
| --- | --- | --- |
| Owner | Desktop dan ponsel | Semua fitur, termasuk data keuangan dan tutup batch. |
| Farm Worker | Ponsel | Input pakan, kematian, catatan harian. Tanpa data keuangan. |

## 3. Login

- Form username dan password.
- Dua tombol demo di halaman login: **"Masuk sebagai Owner"** dan **"Masuk sebagai Farm Worker"**, yang login otomatis tanpa mengetik kredensial.
- Akun demo: `owner / owner123` dan `worker / worker123`.
- Setelah login, menu menyesuaikan peran.

## 4. User Stories

**Owner**

- Sebagai owner, saya ingin melihat status tiga kolam (terisi atau kosong) agar tahu kolam mana yang bisa dipakai.
- Sebagai owner, saya ingin memulai batch baru di kolam kosong dengan data bibit dan pemasok.
- Sebagai owner, saya ingin melihat umur batch dan perkiraan tanggal panen.
- Sebagai owner, saya ingin mencatat panen dan penjualan ke beberapa klien.
- Sebagai owner, saya ingin melihat biaya, pendapatan, laba kotor, dan mortality rate per batch.
- Sebagai owner, saya ingin menutup batch agar kolam bisa dipakai lagi.

**Farm Worker**

- Sebagai worker, saya ingin mencatat pakan harian dengan sedikit ketukan di ponsel.
- Sebagai worker, saya ingin mencatat jumlah ikan mati per hari.
- Sebagai worker, saya ingin melihat riwayat catatan terakhir batch yang saya tangani.

## 5. Kebutuhan Fungsional

| ID | Kebutuhan | Peran | Prioritas |
| --- | --- | --- | --- |
| F-01 | Login dengan username dan password | Semua | Must |
| F-02 | Tombol login demo Owner dan Worker | Semua | Must |
| F-03 | Kontrol akses berdasarkan peran | Semua | Must |
| F-04 | Dashboard: status 3 kolam, batch aktif, umur batch, hari menuju panen | Owner | Must |
| F-05 | Mulai batch: kolam, pemasok, jumlah bibit, harga bibit, tanggal tebar | Owner | Must |
| F-06 | Hitung perkiraan panen = tanggal tebar + 90 hari | Sistem | Must |
| F-07 | Tolak batch baru di kolam yang sudah Aktif atau Panen | Sistem | Must |
| F-08 | Catat pakan harian (tanggal, jenis, kg, biaya opsional) | Owner, Worker | Must |
| F-09 | Catat kematian harian (tanggal, jumlah ekor, catatan) | Owner, Worker | Must |
| F-10 | Catat panen (tanggal, berat kg, jumlah ekor opsional) | Owner | Must |
| F-11 | Catat penjualan (klien, tanggal, berat, harga per kg, status bayar) | Owner | Must |
| F-12 | Tolak penjualan jika total berat jual melebihi total berat panen | Sistem | Must |
| F-13 | Ringkasan batch: biaya, pendapatan, laba kotor, margin, mortality rate | Owner | Must |
| F-14 | Tutup batch dengan peringatan jika ada ikan belum terjual atau belum lunas | Owner | Must |
| F-15 | Tombol reset data demo | Owner | Should |
| F-16 | Biaya lain per batch (satu field) | Owner | Should |

## 6. Layar dan Navigasi

**Owner:** Dashboard, Daftar Batch, Detail Batch (tab: Ringkasan, Pakan, Kematian, Panen, Penjualan), Mulai Batch.

**Worker:** Beranda (batch aktif), Input Pakan, Input Kematian, Riwayat. Navigasi bawah (bottom navigation) dengan tombol besar.

## 7. Alur Utama (Demo)

1. Login sebagai Owner lewat tombol demo.
2. Dashboard menampilkan 3 kolam: satu terisi, satu selesai, satu kosong.
3. Mulai batch baru di kolam kosong. Mencoba kolam terisi ditolak.
4. Logout, login sebagai Worker, catat pakan dan kematian dari tampilan ponsel.
5. Kembali sebagai Owner, catat panen, lalu penjualan ke dua klien.
6. Coba jual melebihi berat panen: ditolak.
7. Buka ringkasan batch: lihat laba kotor.
8. Tutup batch: kolam kembali tersedia.

## 8. Rumus

| Ukuran | Rumus |
| --- | --- |
| Umur batch | Hari ini dikurangi tanggal tebar |
| Perkiraan panen | Tanggal tebar + 90 hari |
| Mortality rate | Total kematian dibagi jumlah bibit awal, dikali 100 |
| Total biaya | Biaya bibit + biaya pakan + biaya lain |
| Pendapatan | Jumlah (berat jual kali harga per kg) |
| Piutang | Total nilai penjualan berstatus Belum Lunas |
| Laba kotor | Pendapatan dikurangi total biaya |
| Margin | Laba kotor dibagi pendapatan, dikali 100 (tidak tampil jika pendapatan 0) |

## 9. Data Seed Demo

- 1 farm: "Farm Demo" dengan Kolam A, B, C.
- 3 pemasok bibit dan 3 klien (dropdown, tanpa halaman kelola).
- Kolam A: batch aktif umur sekitar 60 hari, dengan riwayat pakan dan kematian.
- Kolam B: batch selesai lengkap dengan penjualan dan laba.
- Kolam C: kosong, siap dipakai demo mulai batch.

## 10. Kebutuhan Non-Fungsional

- Responsif; prioritas layar ponsel (lebar sekitar 375px), tombol dan input besar.
- Bahasa Indonesia; format Rupiah (Rp 1.250.000) dan tanggal dd/mm/yyyy; zona waktu Asia/Jakarta.
- Halaman terasa instan (data lokal).
- Label "Mode Demo" terlihat di aplikasi.

## 11. Kriteria Penerimaan

- Tombol demo masuk sebagai Owner dan Worker tanpa mengetik.
- Worker tidak melihat nominal uang di layar mana pun.
- Batch baru di kolam terisi ditolak dengan pesan jelas.
- Perkiraan panen tepat 90 hari setelah tanggal tebar.
- Penjualan melebihi berat panen ditolak.
- Ringkasan batch menampilkan laba kotor yang benar sesuai rumus.
- Setelah batch ditutup, kolam menjadi tersedia.
- Dua penjualan ke klien berbeda dengan harga berbeda dapat disimpan.

## 12. Di Luar Cakupan

Audit history, ekspor CSV, notifikasi, kualitas air, sampling pertumbuhan, stok pakan, CRUD master data, cicilan dan jatuh tempo, multi farm UI, multi bahasa, mode offline, aplikasi native.

## 13. Rencana Build (sekitar 60 menit)

| Menit | Pekerjaan |
| --- | --- |
| 0-10 | Setup, seed data, login, tombol demo, peran |
| 10-25 | Dashboard dan form mulai batch |
| 25-40 | Input pakan dan kematian (mobile-first) |
| 40-52 | Panen, penjualan, validasi berat |
| 52-60 | Ringkasan batch, tutup batch, poles tampilan |
