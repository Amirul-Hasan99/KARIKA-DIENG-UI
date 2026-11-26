# Design System — "Dieng Highland Craft" (`DESIGN.md`)

Spesifikasi desain antarmuka resmi untuk **D'Oleh-Oleh Dieng** yang dirancang dengan prinsip **Anti-AI Slop**: bersih, terstruktur, taktil, dan autentik dengan nuansa dataran tinggi Dieng.

---

## 1. Color Tokens

| Token Peran | Hex | Penggunaan |
| :--- | :--- | :--- |
| **Canvas Background** | `#F7F5F0` | Latar belakang utama seluruh halaman (Warm Alabaster, bukan putih/abu-abu steril). |
| **Card Surface** | `#FFFFFF` | Permukaan kartu produk, kartu pesanan, dan modal. |
| **Subtle Surface** | `#FAF8F5` | Header kartu internal, baris tabel alternatif, dan panel catatan. |
| **Hairline Border** | `#E6E1D6` | Garis tepi `1px solid` pada kartu, divider, dan input form. |
| **Primary Ink** | `#1C1917` | Judul utama, nama penerima, nominal harga, dan teks berprioritas tinggi. |
| **Secondary Ink** | `#57534E` | Subjudul, metadata, label form, dan deskripsi pendukung. |
| **Brand Accent (Carica Amber)** | `#D97706` | Tombol aksi utama, highlight aktif, dan badge merek. Hover: `#B45309`. |
| **Accent Soft Tint** | `#FEF3C7` | Latar belakang badge QRIS, status pending, dan sorotan informasi. |
| **Semantic Emerald** | `#15803D` | Status lunas, terkirim, tombol konfirmasi WhatsApp, dan bukti transfer terunggah. |
| **Semantic Crimson** | `#B91C1C` | Pesan error validasi, status batal/void, dan peringatan kritis. |
| **Botanical Deep Green** | `#163826` | Frame dasar logo resmi bermotif daun carica dan batik Dieng. |

---

## 2. Typography

- **Primary UI & Headings:** `Plus Jakarta Sans` (weights: `500`, `600`, `700`, `800`).
  - Heading utama: `tracking-tight` (`-0.02em`), tegas dan mudah dibaca di layar mobile.
  - Body copy: `13px–14px` dengan line-height lega (`leading-relaxed`).
  - Micro-label metadata: `11px`, uppercase, `tracking-wider`.
- **Data & Angka (`JetBrains Mono`):**
  - Wajib menerapkan `font-mono` dengan `font-variant-numeric: tabular-nums` pada:
    - Seluruh nominal Rupiah (`Rp248.000`).
    - Nomor Pesanan (`#GC-261123-...`).
    - Koordinat GPS (`-7.204176, 109.911214`), jarak (`~1.21 km`), dan nomor WhatsApp.

---

## 3. Anatomi Komponen & Spasi

1. **Buttons (`components/ui/button.tsx`):**
   - Radius: `rounded-lg` (`8px`).
   - Tinggi sentuh minimum: `min-h-[42px]` (`44px` untuk CTA checkout/WhatsApp mobile).
   - Efek tekan taktil: `active:scale-[0.99]`.
   - Aturan ketat: **maksimal 1 tombol solid utama** per kartu/bagian. Aksi sekunder memakai tombol ghost/outline berbingkai `1px solid #E6E1D6`.
2. **Cards (`/admin/delivery`, `/admin`, `/catalog`):**
   - Tidak boleh ada ruang kosong vertikal yang berlebihan.
   - Struktur kartu 3 bagian: **Header Bar** (`#FAF8F5` + `border-b`) &rarr; **Body Grid** (metadata terstruktur) &rarr; **Footer Action Bar**.
3. **Brand Logo & Favicon:**
   - Logo berlatar hijau tua (`#163826`) ditampilkan dengan sudut membulat (`rounded-xl` pada navbar/footer, `rounded-2xl` pada hero card) dan rasio proporsional `3:2` tanpa memotong motif daun maupun tulisan `OLEH-OLEH`.
   - Favicon (`app/icon.png` & `public/icon-d-oleh2.png`, `256×256`) disinkronkan langsung dari logo navbar kiri atas.

---

## 4. Daftar Larangan (Anti-AI Slop Checklist)

- **JANGAN** gunakan gradien ungu-biru generik atau efek neon/glow berlebihan di belakang kartu.
- **JANGAN** tampilkan dua tombol WhatsApp yang menjalankan aksi serupa pada satu halaman.
- **JANGAN** pakai dropdown multi-status yang membingungkan di halaman kurir (gunakan aksi biner 2 tahap).
- **JANGAN** gunakan `rounded-full` untuk setiap kotak/kartu — gunakan `rounded-lg` untuk tombol/input dan `rounded-xl` untuk kartu.
