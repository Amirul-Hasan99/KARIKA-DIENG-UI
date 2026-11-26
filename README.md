# D'Oleh-Oleh Dieng (`KARIKA-DIENG-UI`)

Sistem E-Commerce & Manajemen Pengantaran Lokal untuk **D'Oleh-Oleh Dieng** — Sentra Oleh-Oleh Khas Dataran Tinggi Dieng & Kabupaten Wonosobo (Manisan Carica, Keripik Tempe Kemul, Keripik Carica, Opak Singkong, dan kuliner khas lainnya).

- **Live Production URL:** https://di-oleh-oleh.vercel.app
- **Repository:** `Amirul-Hasan99/KARIKA-DIENG-UI` (branch: `main`)

---

## Fitur Utama

1. **Katalog & Keranjang Pembeli (`/`, `/catalog`)**:
   - Etalase 9 produk resmi khas Dieng & Wonosobo dengan filter kategori (`Semua`, `Carica`, `Makanan`, `Camilan`, `Minuman`) dan pencarian instan.
   - Validasi minimum pembelian **5 paket** (boleh campur) serta kalkulasi jarak otomatis dari **Titik 0 Km Dieng** (radius maksimal **8 km**).
2. **Checkout Kondisional COD vs QRIS & Upload Struk (`/orders/[orderId]`)**:
   - **QRIS:** Menampilkan kode QRIS resmi toko, instruksi pembayaran, form upload bukti struk transfer (dengan kompresi gambar otomatis di browser), dan satu tombol utama konfirmasi ke WhatsApp Admin.
   - **COD (Tunai):** Menyembunyikan form upload struk transfer dan menampilkan ringkasan konfirmasi tunai uang pas saat kurir tiba.
3. **Pelacakan Pesanan Real-time (`/orders`, `/orders/[orderId]`)**:
   - Pencarian pesanan berdasarkan ID atau Nomor WhatsApp pembeli.
   - Sinkronisasi status pengantaran secara langsung dengan panel admin.
4. **Dashboard Operasional Admin (`/admin`)**:
   - Ringkasan omzet, jumlah pesanan aktif, dan manajemen status pembayaran/pesanan.
   - Sinkronisasi otomatis bukti transfer QRIS pembeli (tanpa ketergantungan scan barcode), lengkap dengan lightbox pratinjau resolusi penuh dan slot status konsisten pada seluruh pesanan QRIS.
   - **Auto-Studio Foto Produk:** Penghapusan background otomatis di browser (`@imgly/background-removal` via WebAssembly/ONNX) dengan pilihan output **Transparan Murni (PNG)** atau **Template Katalog D'Oleh-Oleh** berbasis HTML5 Canvas.
5. **Panel Pengiriman 2-Tahap (`/admin/delivery`)**:
   - Kartu pengiriman ringkas (*compact density*) dengan rute Google Maps dan alur status 2 tahap: **`Dalam Pengiriman`** &rarr; **`Terkirim`**.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS 3 (`Plus Jakarta Sans` + `JetBrains Mono`)
- **Database & Persistence:** Neon Serverless PostgreSQL (`@neondatabase/serverless`) + local JSON cache fallback untuk dev
- **AI Image Processing:** `@imgly/background-removal` (Client-Side WASM/ONNX) + HTML5 Canvas Compositor
- **Security:** HMAC-SHA256 Admin Session Cookie (`dioleh2_admin_session`), Rate Limiting, Security Headers (`X-Frame-Options`, `nosniff`, `HSTS`)
- **Deployment:** Vercel

---

## Struktur Direktori Proyek

```text
KARIKA-DIENG-BACKUP/
├── app/
│   ├── page.tsx                              # Landing page utama, hero logo & produk favorit
│   ├── layout.tsx                            # Root layout, Google Fonts & metadata favicon
│   ├── globals.css                           # Token warna "Dieng Highland Craft" & utilitas
│   ├── icon.png                              # App icon / favicon resmi
│   ├── catalog/page.tsx                      # Katalog lengkap, keranjang & checkout GPS
│   ├── orders/page.tsx                       # Pencarian pesanan via No. WA / Order ID
│   ├── orders/[orderId]/page.tsx             # Detail pesanan, QRIS/COD & upload struk
│   ├── admin/
│   │   ├── layout.tsx                        # Proteksi sesi & verifikasi admin
│   │   ├── login/page.tsx                    # Halaman login admin
│   │   ├── page.tsx                          # Dashboard operasional, CRUD produk & Auto-Studio
│   │   ├── delivery/page.tsx                 # Panel pengiriman 2-tahap kurir
│   │   └── kitchen/page.tsx                  # Antrean penyiapan paket toko
│   └── api/
│       ├── products/route.ts                 # CRUD produk (Neon DB + fallback)
│       ├── admin/login|logout|orders|upload/ # Endpoint khusus admin (HMAC-protected)
│       └── orders/checkout|search|cancel|confirm-cash|upload-payment-proof|[orderId]/
├── components/
│   ├── admin/AdminRevenueChart.tsx           # Grafik pendapatan ECharts
│   ├── customer/DeliveryLocationPicker.tsx   # Pemilih titik GPS & kalkulator jarak 8 km
│   └── ui/                                   # Komponen UI standar (Button, Card, BrandLogo, Flaticon)
├── hooks/
│   └── useKitchenOrders.ts                   # Polling real-time & tab-focus sync pesanan
├── lib/
│   ├── auth.ts                               # Verifikasi token sesi HMAC-SHA256
│   ├── db.ts                                 # Koneksi & inisialisasi tabel Neon PostgreSQL
│   ├── karika-products.ts                    # Data access layer produk (Dual-write)
│   ├── order-store.ts                        # Data access layer pesanan & bukti transfer
│   └── product-studio.ts                     # Pipeline WASM background removal & template canvas
├── public/
│   ├── icon-d-oleh2.png                      # Favicon PNG 256x256
│   └── images/                               # Logo resmi & 9 foto produk katalog
└── scripts/                                  # Script QA end-to-end & sinkronisasi data
```

---

## Environment Variables

Buat file `.env.local` pada root proyek untuk pengembangan lokal (dan atur di Vercel Environment Variables untuk produksi):

| Variabel | Wajib | Keterangan |
| :--- | :---: | :--- |
| `DATABASE_URL` | Ya | Connection string Neon PostgreSQL (`postgresql://...`) |
| `ADMIN_USERNAME` | Ya | Username login panel `/admin` |
| `ADMIN_PASSWORD` | Ya | Password login panel `/admin` |
| `ADMIN_SESSION_SECRET` | Ya | Secret minimal 32 karakter untuk signing HMAC-SHA256 cookie |
| `STORE_LAT` | Opsional | Latitude Titik 0 Dieng (default `-7.204176`) |
| `STORE_LNG` | Opsional | Longitude Titik 0 Dieng (default `109.911214`) |

---

## Instalasi & Perintah Pengembangan

```bash
# 1. Instal dependensi
npm install

# 2. Jalankan server pengembangan lokal (http://localhost:3000)
npm run dev

# 3. Pemeriksaan tipe TypeScript & Lint
npx tsc --noEmit
npm run lint

# 4. Build produksi
npm run build
npm run start
```

---

## Panduan Deployment (Vercel)

1. Pastikan seluruh perubahan sudah lolos `npx tsc --noEmit`, `npm run lint`, dan `npm run build`.
2. Push ke branch `main` di GitHub (atau jalankan `push.bat` di Windows).
3. Vercel akan otomatis melakukan build dan menerbitkan aplikasi ke **https://di-oleh-oleh.vercel.app**.
4. Pastikan environment variables (`DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`) telah terkonfigurasi di dashboard Vercel Project Settings.
