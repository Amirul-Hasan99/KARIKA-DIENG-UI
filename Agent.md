# Agent Constitution — `KARIKA-DIENG-UI`

Dokumen ini adalah pedoman operasional wajib bagi AI Coding Agent yang bekerja pada repository **D'Oleh-Oleh Dieng** (`KARIKA-DIENG-UI`) di dalam Antigravity IDE.

---

## 1. Strategi Delegasi Model

- **Hydrogen (Reasoning / Architecture / Debugging / Docs):**
  - Audit menyeluruh struktur repository, root-cause debugging state & API, state machine pembayaran/pengiriman, integrasi Neon PostgreSQL, pipeline WASM `@imgly/background-removal`, serta penyusunan dokumentasi teknis (`README.md`, `Architecture.md`, `Agent.md`, `PRD.md`, `DESIGN.md`).
- **Flash LLM (Fast Surgical Edits / Styling / Verification):**
  - Refactoring cepat komponen TSX/Tailwind, penerapan token desain "Dieng Highland Craft", perbaikan responsivitas mobile (`360px–1440px`), dan eksekusi check/build cepat.

---

## 2. Aturan Kualitas Kode & TypeScript

1. **Zero `TODO` / Placeholder:** Setiap fitur dan bug fix harus diimplementasikan tuntas sampai siap produksi.
2. **Shared Mapping & Single Source of Truth:**
   - Selalu gunakan `mapNeonRowToOrder()` di `lib/order-store.ts` saat membaca baris tabel `orders` dari Neon PostgreSQL agar tidak ada kolom (seperti `payment_proof_url`) yang tertinggal.
   - Normalisasi pengecekan metode pembayaran secara konsisten: `const isCod = order.payment_type === "cod" || order.payment_type === "cash"`.
3. **Serverless-Safe Persistence (Vercel):**
   - Jangan pernah bergantung pada penulisan file ke `public/uploads/` saat `NODE_ENV === "production"` atau `process.env.VERCEL` aktif. Gunakan Neon PostgreSQL (`products`, `orders`) dan Data URL terkompresi untuk aset dinamis.
4. **Keamanan & Otorisasi:**
   - Endpoint mutasi admin (`/api/products` POST/DELETE, `/api/admin/*`, `/api/orders/[orderId]` PATCH) wajib terproteksi middleware HMAC-SHA256 (`dioleh2_admin_session`).
   - Jangan pernah menurunkan validasi server atau mengekspor secret/password ke kode client maupun laporan.

---

## 3. Aturan Anti-AI Slop UI/UX

- **Dilarang** menggunakan gradien ungu/biru generik ala SaaS template, sudut pil berlebihan pada setiap tombol, atau kartu kosong dengan ruang vertikal terbuang.
- **Wajib** menggunakan palet **Dieng Highland Craft**:
  - Canvas `#F7F5F0`, Card `#FFFFFF` (`border-[#E6E1D6]`), Tinta Utama `#1C1917`, Sekunder `#57534E`, Aksen Amber `#D97706`, Semantik Hijau `#15803D`, Merah `#B91C1C`.
- **Wajib** memakai `Plus Jakarta Sans` untuk UI/heading dan `JetBrains Mono` (`tabular-nums`) untuk seluruh nominal Rupiah, Order ID, koordinat GPS, dan jarak km.
- Maksimal **1 tombol utama solid** per kartu/bagian; hindari duplikasi CTA WhatsApp pada halaman detail pesanan.

---

## 4. Checklist Verifikasi Wajib Sebelum Selesai / Commit

1. `npx tsc --noEmit` lulus dengan **0 error**.
2. `npm run lint` tidak memiliki error fatal.
3. `npm run build` selesai dengan **exit code 0**.
4. Pengujian end-to-end lokal (`http://localhost:3000`) & produksi (`https://di-oleh-oleh.vercel.app`) terverifikasi untuk alur QRIS, COD, `/admin`, `/admin/delivery`, dan favicon.
5. Jangan melakukan `git commit` / `git push` otomatis tanpa persetujuan eksplisit pengguna.
