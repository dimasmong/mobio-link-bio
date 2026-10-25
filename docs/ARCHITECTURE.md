# Personal Link Bio — Architecture Overview

Dokumen ini menjelaskan arsitektur teknis dari proyek **Personal Link Bio**, integrasi runtime Cloudflare Workers dengan React Router v7 SSR, serta peta koneksi untuk fase mendatang.

---

## 1. Bagaimana Public SSR Bekerja

1. **Request Lifecycle:**
   - Permintaan HTTP yang masuk ke Cloudflare Worker pertama kali diterima oleh handler di `workers/app.ts`.
   - Handler memanggil `createRequestHandler` dari React Router yang membundel build server `virtual:react-router/server-build`.
2. **Server-Side Rendering Pipeline:**
   - `app/entry.server.tsx` mengeksekusi fungsi `renderToReadableStream` dari `react-dom/server`.
   - Komponen pohon React Router diproses di server, menghasilkan streaming respons HTML langsung dengan `Content-Type: text/html`.
   - Data profil diambil via `loader` pada rute `app/routes/home.tsx` sehingga HTML lengkap siap dibaca oleh browser atau web crawler tanpa menunggu eksekusi JavaScript di client (SEO friendly).
3. **Client Hydration:**
   - Setelah browser menerima dokumen HTML, `app/root.tsx` dan `entry.client.tsx` melakukan hidrasi ringan untuk mengaktifkan interaktivitas (seperti switch bahasa ID/EN).

---

## 2. Integrasi Cloudflare Workers dengan React Router

- **Vite Plugin (`@cloudflare/vite-plugin`):**
  Menggunakan API modern Vite Environment (`ssr`) untuk mengemulasikan lingkungan Cloudflare Worker (`workerd`) secara lokal, sehingga kode berjalan persis seperti di edge network Cloudflare.
- **Konfigurasi Wrangler (`wrangler.json`):**
  Mengatur entry point `./workers/app.ts`, `compatibility_date`, dan flag `nodejs_compat`.
- **Ekstensi Context:**
  Variabel lingkungan dan bindings Cloudflare (seperti `env` dan `ctx`) diinjeksikan secara otomatis ke dalam `AppLoadContext` React Router.

---

## 3. Pembatasan Rute Administratif

- Pada Phase 1A / FUN MVP, seluruh rute `/admin` dan `/api/admin/*` tidak didaftarkan ke public router sehingga permintaan akan ditolak secara server-side (404/403 fail-closed).
- Tidak ada autentikasi palsu di sisi client (`localStorage` atau mock form). Sistem autentikasi penuh berbasis server-side session atau token akan diterapkan pada fase admin.

---

## 4. Titik Sambung Fitur Mendatang (Future Roadmap)

| Modul | Lokasi Integrasi Masa Depan | Keterangan |
| :--- | :--- | :--- |
| **Cloudflare D1** | `wrangler.json` bindings `d1_databases` & `app/server/db.ts` | Untuk menyimpan data profil dinamis, link kustom, dan metrik klik |
| **Cloudflare R2** | `wrangler.json` bindings `r2_buckets` & `app/server/storage.ts` | Media library untuk upload foto profil, favicon, dan thumbnail link |
| **Autentikasi Admin**| `app/server/auth.ts` & middleware loader `/admin` | Server-side auth (Passkey / TOTP / Session cookies aman) |
| **Visual Editor** | Rute `app/routes/admin/editor.tsx` | Schema-driven editor untuk kustomisasi tema, reorder link, dan preview instan |
| **Privacy Analytics** | `app/routes/api/event.ts` | Pencatatan klik link anonim tanpa cookie pihak ketiga |
