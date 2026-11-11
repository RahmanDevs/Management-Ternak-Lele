# TRD: Ternak Lele Management System (MVP Showcase)

Versi 1.0 | 11 November 2026 | Status: Draft showcase

## 1. Tujuan

Mendefinisikan rancangan teknis paling sederhana agar MVP showcase dapat selesai dalam kurang dari 1 jam. Prinsipnya: **tanpa backend sungguhan, tanpa database eksternal, satu codebase kecil yang mudah dideploy**.

## 2. Keputusan Arsitektur

| Aspek | Pilihan | Alasan |
| --- | --- | --- |
| Bentuk aplikasi | Single Page Application (SPA) responsif | Cepat dibuat, mudah didemokan |
| Framework | React (Vite) atau satu file HTML + JS | Ekosistem luas dan cepat |
| Styling | Tailwind CSS | Layout mobile-first tanpa menulis CSS panjang |
| State | React state + Context | Cukup untuk skala demo |
| Penyimpanan | localStorage (JSON) | Persisten di browser, tanpa server |
| Routing | Hash/React Router | Tanpa konfigurasi server |
| Hosting | Vercel, Netlify, atau GitHub Pages | Deploy statis gratis |
| Auth | Mock auth di sisi klien | Hanya untuk demo |

**Catatan:** Bila dibuat sebagai artifact atau satu file HTML, localStorage mungkin tidak tersedia; gunakan state di memori dan data seed dimuat ulang saat halaman dibuka.

## 3. Arsitektur Tingkat Tinggi

Browser (SPA) terdiri dari tiga lapisan:

1. **UI**: halaman Login, Dashboard, Batch, Input Harian, Panen dan Jual.
2. **Logika bisnis**: fungsi murni untuk validasi dan perhitungan (umur, panen 90 hari, mortality, laba).
3. **Store**: satu objek state yang disinkronkan ke localStorage.

Tidak ada panggilan jaringan ke server.

## 4. Model Data

Semua entitas disimpan dalam satu objek JSON.

| Entitas | Field utama |
| --- | --- |
| User | id, username, password, role (`owner` atau `worker`), nama |
| Farm | id, nama |
| Pond | id, farmId, nama, status turunan (kosong atau terisi) |
| Supplier | id, nama |
| Client | id, nama |
| Batch | id, kode, farmId, pondId, supplierId, tanggalTebar, jumlahBibit, hargaBibitTotal, biayaLain, status (`aktif`, `panen`, `selesai`), tanggalSelesai |
| FeedLog | id, batchId, tanggal, jenis, kg, biaya |
| MortalityLog | id, batchId, tanggal, ekor, catatan |
| Harvest | id, batchId, tanggal, beratKg, ekor |
| Sale | id, batchId, clientId, tanggal, beratKg, hargaPerKg, lunas (boolean) |

Relasi: Farm punya 3 Pond; Pond punya banyak Batch (maksimal satu berstatus aktif atau panen); Batch punya banyak FeedLog, MortalityLog, Harvest, dan Sale; Sale mengacu ke satu Client.

## 5. Aturan Validasi (Sisi Klien)

| Aturan | Implementasi |
| --- | --- |
| Satu kolam satu batch aktif | Saat membuat batch, tolak jika ada batch lain di pondId dengan status aktif atau panen |
| Nilai tidak negatif | Input `min=0` dan cek ulang di fungsi simpan |
| Berat jual tidak melebihi berat panen | `sum(sale.beratKg) + beratBaru <= sum(harvest.beratKg)` |
| Status batch | Aktif menjadi Panen saat panen pertama dicatat; Selesai saat ditutup |
| Perkiraan panen | `tanggalTebar + 90 hari` |
| Tanggal catatan harian | Tidak boleh sebelum tanggal tebar atau setelah batch selesai |
| Penutupan batch | Hitung ikan belum terjual dan penjualan belum lunas; tampilkan dialog konfirmasi |

## 6. Fungsi Perhitungan

Fungsi murni, mudah diuji:

- `batchAge(tanggalTebar, today)`
- `expectedHarvest(tanggalTebar)`
- `mortalityRate(batch)` = total ekor mati / jumlahBibit x 100
- `totalFeedCost(batch)` = jumlah biaya FeedLog
- `totalCost(batch)` = hargaBibitTotal + totalFeedCost + biayaLain
- `revenue(batch)` = jumlah (beratKg x hargaPerKg) semua Sale
- `outstanding(batch)` = nilai Sale dengan lunas = false
- `grossProfit(batch)` = revenue - totalCost
- `margin(batch)` = grossProfit / revenue x 100, null jika revenue 0
- `unsoldKg(batch)` = total panen - total jual

Pembulatan: nilai Rupiah dalam bilangan bulat; kg dengan satu atau dua desimal.

## 7. Autentikasi dan Otorisasi

- Mock auth: cocokkan username dan password dengan daftar user seed.
- Dua tombol demo memanggil fungsi login dengan akun owner atau worker tanpa input.
- Sesi disimpan di state (dan localStorage opsional).
- **Route guard:** halaman keuangan (Dashboard keuangan, Penjualan, Ringkasan) hanya untuk owner.
- **Penyembunyian data:** komponen yang menampilkan uang dibungkus `<OwnerOnly>`, sehingga worker tidak pernah melihat nominal.
- Catatan: **hanya untuk demo**. Password tidak di-hash dan tidak aman untuk produksi.

## 8. Struktur Proyek (Saran)

- `src/data/seed.js`: data awal demo
- `src/store/`: state, persistensi localStorage, fungsi reset
- `src/lib/calc.js`: rumus perhitungan
- `src/lib/validate.js`: aturan validasi
- `src/lib/format.js`: format Rupiah dan tanggal (`Intl`, `id-ID`, Asia/Jakarta)
- `src/pages/`: Login, Dashboard, Batches, BatchDetail, NewBatch, WorkerHome, FeedForm, MortalityForm
- `src/components/`: OwnerOnly, BottomNav, PondCard, Toast, ConfirmDialog

## 9. UI dan Responsivitas

- Mobile-first: lebar dasar 375px, breakpoint `md` untuk tampilan desktop.
- Worker: bottom navigation, tombol dan input minimal tinggi 44px, form satu kolom.
- Owner: kartu kolam di dashboard, tab di detail batch, tabel dapat digulir horizontal di ponsel.
- Bahasa Indonesia; format `Rp 1.250.000` dan `dd/mm/yyyy`.
- Badge "Mode Demo" tetap tampil di header.

## 10. Seed Data dan Reset

- Satu farm dengan Kolam A, B, C.
- Kolam A: batch aktif umur sekitar 60 hari dengan riwayat pakan dan kematian.
- Kolam B: batch selesai dengan dua panen dan penjualan ke dua klien.
- Kolam C: kosong.
- Tanggal seed dihitung relatif terhadap hari ini agar umur batch selalu realistis.
- Tombol "Reset Data Demo" menghapus localStorage dan memuat ulang seed.

## 11. Non-Fungsional

- Kinerja: semua operasi lokal, tanpa latensi jaringan.
- Kompatibilitas: Chrome dan Safari terbaru di Android dan iOS, serta desktop.
- Aksesibilitas dasar: label input jelas, kontras cukup, target sentuh memadai.
- Penanganan kegagalan localStorage: bungkus akses dengan try/catch dan fallback ke memori.

## 12. Pengujian (Manual)

- Login owner dan worker lewat tombol demo.
- Worker tidak melihat nominal uang di halaman mana pun.
- Batch kedua di Kolam A ditolak; di Kolam C berhasil.
- Perkiraan panen = tebar + 90 hari.
- Jual melebihi berat panen ditolak; dua klien dengan harga berbeda berhasil.
- Laba kotor sesuai hitungan manual pada data seed.
- Tutup batch menampilkan peringatan; setelah ditutup kolam tersedia.
- Refresh halaman: data tetap ada; reset: kembali ke seed.

## 13. Deploy

1. `npm run build` menghasilkan folder statis.
2. Unggah ke Vercel atau Netlify (drag and drop atau Git).
3. Bagikan satu URL untuk showcase.

## 14. Jalur Peningkatan ke Produksi

| Saat ini (demo) | Produksi |
| --- | --- |
| localStorage | Database (PostgreSQL) dengan API |
| Mock auth | Auth sungguhan (hash password, sesi atau JWT) |
| Validasi klien | Validasi server-side dan transaksi |
| Tanpa audit | Tabel audit event |
| Satu farm seed | CRUD farm, kolam, pemasok, klien |
| Tanpa ekspor | Ekspor CSV dan laporan PDF |

Fungsi di `calc.js` dan `validate.js` dapat dipakai ulang di backend, sehingga logika bisnis tidak perlu ditulis ulang.
