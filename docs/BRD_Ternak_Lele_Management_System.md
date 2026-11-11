# BRD: Ternak Lele Management System (MVP Showcase)

Versi 1.0 | 11 November 2026 | Status: Draft showcase

## 1. Tujuan

Membangun aplikasi web responsif sederhana untuk mencatat budidaya lele dari pembelian bibit, pembesaran, panen, sampai penjualan, serta menampilkan laba kotor per batch. Versi ini adalah **MVP untuk showcase**, bukan produk produksi penuh.

## 2. Latar Belakang

Usaha budidaya lele memiliki satu atau lebih farm, masing-masing dengan tiga kolam. Satu batch dimulai saat bibit ditebar dan umumnya dipanen sekitar 90 hari kemudian. Saat ini pencatatan tersebar di buku, spreadsheet, dan pesan chat, sehingga sulit mengetahui status kolam, performa batch, dan apakah batch menguntungkan.

## 3. Tujuan Bisnis

1. Satu catatan terpusat untuk kolam dan batch produksi.
2. Mencegah satu kolam dipakai dua batch aktif sekaligus.
3. Mencatat pakan dan kematian harian dengan cepat dari ponsel.
4. Mendukung panen bertahap dan penjualan ke beberapa klien.
5. Menampilkan biaya, pendapatan, dan laba kotor per batch.
6. Memberi owner ringkasan batch aktif dan batch yang mendekati panen.

## 4. Pengguna

| Peran | Kebutuhan |
| --- | --- |
| Owner | Akses penuh: mulai batch, panen, penjualan, data keuangan, tutup batch, dashboard. |
| Farm Worker | Input pakan, kematian, dan catatan harian, terutama lewat ponsel. Tidak boleh melihat data keuangan. |

Pemasok bibit dan klien tidak memiliki akses ke sistem.

## 5. Ruang Lingkup MVP Showcase

**Termasuk:**

- Login username dan password, plus tombol demo "Masuk sebagai Owner" dan "Masuk sebagai Farm Worker".
- Satu farm dengan tiga kolam (data seed).
- Mulai batch dengan pemasok, jumlah bibit, biaya bibit, tanggal tebar.
- Perkiraan tanggal panen = tanggal tebar + 90 hari.
- Pencatatan pakan dan kematian harian.
- Panen (termasuk panen bertahap) dan penjualan ke beberapa klien.
- Status pembayaran Lunas / Belum Lunas.
- Dashboard owner dan ringkasan batch (biaya, pendapatan, laba kotor, mortality rate).
- Penutupan batch dengan peringatan bila masih ada ikan belum terjual.

**Tidak termasuk:** audit history, ekspor CSV, notifikasi, kualitas air, sampling pertumbuhan, stok pakan, CRUD farm/kolam/pemasok/klien, cicilan pembayaran, multi bahasa, aplikasi native, mode offline, akuntansi lengkap.

## 6. Aturan Bisnis Utama

- BR-1: Satu batch terhubung ke satu farm dan satu kolam.
- BR-2: Kolam tidak boleh memiliki dua batch berstatus Aktif atau Panen bersamaan.
- BR-3: Perkiraan panen = tanggal tebar + 90 hari; tanggal panen aktual boleh berbeda.
- BR-4: Status batch: Aktif, Panen, Selesai.
- BR-5: Jumlah bibit, pakan, kematian, berat, harga tidak boleh negatif.
- BR-6: Total berat jual tidak boleh melebihi total berat panen batch.
- BR-7: Pendapatan = total nilai penjualan (terlepas sudah dibayar atau belum).
- BR-8: Laba kotor = pendapatan dikurangi biaya bibit, pakan, dan biaya lain.
- BR-9: Farm Worker tidak dapat melihat data keuangan.
- BR-10: Seluruh nilai uang dalam Rupiah (IDR).

## 7. Kriteria Keberhasilan Showcase

- Alur end-to-end dapat didemokan: login, mulai batch, catat harian, panen, jual, lihat laba, tutup batch.
- Mencoba memulai batch kedua di kolam terisi ditolak dengan pesan jelas.
- Penjualan melebihi berat panen ditolak.
- Farm Worker tidak melihat angka keuangan.
- Tampilan nyaman di layar ponsel.

## 8. Asumsi

- Satu farm dengan tiga kolam untuk demo.
- Bibit hanya dari satu pemasok per batch.
- Satuan: pakan dan ikan dalam kg, bibit dan kematian dalam ekor.
- Data awal (seed) disediakan agar dashboard langsung terlihat hidup.
- Keamanan sebatas demo; bukan untuk data produksi nyata.

## 9. Risiko

| Risiko | Penanganan |
| --- | --- |
| Waktu build sangat singkat | Pangkas fitur, fokus pada alur utama. |
| Data tidak persisten | Gunakan localStorage dan sediakan tombol reset demo. |
| Pengguna mengira ini produk final | Beri label "Demo" pada aplikasi. |

## 10. Langkah Berikutnya

Setelah showcase divalidasi: tambah CRUD farm/kolam/pemasok/klien, backend dan database sungguhan, audit history, ekspor CSV, kualitas air, stok pakan, dan notifikasi.
