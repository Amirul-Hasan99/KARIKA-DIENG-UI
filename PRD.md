# Product Requirements Document (PRD) — D'Oleh-Oleh Dieng

**Produk:** D'Oleh-Oleh Dieng Web Store & Delivery Management  
**URL Produksi:** https://di-oleh-oleh.vercel.app  
**Versi Dokumen:** 2.0 (Post-QA Overhaul)

---

## 1. Latar Belakang & Tujuan Bisnis

Wisatawan yang berkunjung ke Dataran Tinggi Dieng dan Wonosobo membutuhkan cara praktis untuk memesan paket oleh-oleh asli (Manisan Carica, Keripik Tempe Kemul, Keripik Carica, Opak Singkong) langsung dari penginapan/homestay dalam radius 8 km dari Titik 0 Km Dieng, tanpa harus mengantre atau membawa barang berat selama berwisata.

Tujuan sistem:
1. Menyediakan alur pemesanan mobile-first yang cepat dengan dukungan pembayaran **QRIS** dan **COD (Tunai)**.
2. Memberikan dashboard operasional terpadu bagi admin toko untuk memverifikasi bukti transfer QRIS secara instan tanpa hambatan.
3. Menyederhanakan tugas pengantaran kurir dengan peta koordinat presisi dan status 2 tahap yang jelas.

---

## 2. Target Persona

| Persona | Peran & Kebutuhan Utama |
| :--- | :--- |
| **Wisatawan / Pembeli** | Memilih oleh-oleh minimal 5 paket dari HP, menentukan titik pengantaran via Google Maps, membayar via QRIS (unggah struk) atau COD, dan memantau status kurir secara real-time. |
| **Admin Operasional Toko** | Memantau pesanan masuk, melihat foto bukti transfer QRIS pembeli langsung di kartu order, mengkonfirmasi pelunasan, serta menambah/mengedit produk dengan foto katalog yang rapi & seragam. |
| **Kurir Pengantar Dieng** | Melihat daftar pengantaran ringkas dengan rute Google Maps dan mengubah status pengiriman dalam 2 langkah (`Dalam Pengiriman` &rarr; `Terkirim`). |

---

## 3. Functional Requirements

### FR-01: Sinkronisasi Bukti Transfer QRIS ke Panel Admin
- **User Story:** Sebagai pembeli QRIS, saat saya mengunggah foto struk transfer di halaman pesanan, admin harus langsung dapat melihat foto struk tersebut di `/admin` tanpa perlu proses scan barcode.
- **Acceptance Criteria:**
  - Upload bukti transfer langsung tersimpan ke database Neon (`payment_proof_url`).
  - `/admin` melakukan polling berkala dan refresh otomatis saat tab aktif kembali (*focus* / *visibilitychange*).
  - Tidak ada ketergantungan scan barcode agar bukti tampil di kartu order admin.

### FR-02: Form Upload Kondisional (QRIS vs COD)
- **User Story:** Sebagai pembeli yang memilih metode **COD**, saya tidak boleh melihat form upload bukti transfer agar tidak bingung.
- **Acceptance Criteria:**
  - Jika metode pembayaran `cod` atau `cash`, form `Form Upload Bukti Struk Transfer Pembeli` disembunyikan total.
  - Sebagai gantinya, tampilkan kotak informasi ringkas: *"Pembayaran Tunai (COD) — Siapkan uang pas sebesar Rp... saat kurir tiba di lokasi"*.
  - Form upload bukti transfer **hanya** tampil untuk pesanan QRIS yang belum dibatalkan.

### FR-03: Penyatuan Tombol WhatsApp pada Halaman Detail Pesanan
- **User Story:** Sebagai pembeli, saya hanya ingin melihat satu tombol WhatsApp yang jelas di halaman pesanan agar tidak bingung memilih tombol mana yang harus diklik.
- **Acceptance Criteria:**
  - Tombol `Hubungi Admin via WhatsApp` di dalam kartu `TITIK PENGANTARAN & ALAMAT` dihapus.
  - Tersisa **satu** tombol utama WhatsApp berwarna hijau di bagian bawah halaman (`Konfirmasi Pembayaran ke Admin WhatsApp` untuk QRIS, atau `Hubungi Admin via WhatsApp` untuk COD).

### FR-04: Konsistensi Slot Aksi Bukti Transfer pada `/admin`
- **User Story:** Sebagai admin, saya ingin seluruh pesanan QRIS memiliki tampilan tombol/status bukti transfer yang konsisten agar mudah membedakan mana yang sudah upload dan mana yang belum.
- **Acceptance Criteria:**
  - Pesanan COD tidak pernah menampilkan tombol bukti transfer QRIS.
  - Setiap kartu pesanan QRIS menampilkan slot yang sama: tombol aktif `Lihat Bukti Transfer Pembeli` (membuka modal pratinjau penuh) jika `payment_proof_url` sudah ada, atau indikator muted `Menunggu Bukti Transfer Pembeli` jika belum diunggah.

### FR-05: Kartu Pengiriman Ringkas & Alur 2 Status (`/admin/delivery`)
- **User Story:** Sebagai kurir/admin pengiriman, saya ingin kartu pesanan di `/admin/delivery` padat, informatif, dan hanya memiliki 2 status aktif agar tidak salah pilih.
- **Acceptance Criteria:**
  - Kartu menampilkan ID Order, badge metode bayar, badge status, nama & telepon penerima, total rupiah (`tabular-nums`), patokan alamat, jarak km, dan tautan Google Maps secara padat tanpa whitespace berlebih.
  - Opsi status disederhanakan menjadi 2 tahap operasional: **`Dalam Pengiriman`** dan **`Terkirim`** (melalui tombol utama `Tandai Terkirim` dan opsi kembali `Kembali ke Dalam Pengiriman`).

### FR-06: Auto-Studio Background Removal & Template Katalog Produk (`/admin`)
- **User Story:** Sebagai admin, saat saya mengunggah foto produk baru yang masih memiliki background, sistem secara otomatis menghapus background-nya dan memberi opsi memakai template resmi D'Oleh-Oleh.
- **Acceptance Criteria:**
  - Menghapus background secara otomatis di sisi client menggunakan `@imgly/background-removal` dengan indikator progres.
  - Menyediakan toggle preview antara **Transparan Murni (PNG)** dan **Template Katalog D'Oleh-Oleh** (HTML5 Canvas dengan bayangan lembut dan badge kemasan).
  - Hasil ekspor tersimpan sebagai aset gambar produk tanpa memerlukan API key berbayar.

---

## 4. Non-Functional Requirements

- **Performa Jaringan Dataran Tinggi:** Kompresi gambar bukti struk di sisi client (maks. 1200px JPEG) memastikan upload tetap cepat pada koneksi mobile 3G/4G di kawasan wisata Dieng.
- **Responsivitas:** Layout teruji rapi dari ukuran mobile kecil `360px` hingga desktop `1440px`.
- **Integritas Data:** Total pesanan selalu dihitung ulang di server berdasarkan harga resmi katalog di database.
