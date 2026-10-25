# Panduan Personalisasi Website Link in Bio

Panduan ini menjelaskan cara mempersonalisasi seluruh isi website **Personal Link Bio** Anda dengan mudah, baik secara langsung melalui file konfigurasi maupun dengan bantuan AI assistant.

---

## 🚀 Cara 1: Personalisasi Instan Menggunakan Bantuan AI (Paling Mudah)

Anda tidak perlu mengedit kode atau memahami TypeScript. Cukup salin dan lengkapi template formulir di bawah ini, lalu kirimkan langsung di percakapan dengan AI assistant:

```text
Halo, tolong perbarui data website Link in Bio saya dengan informasi berikut:

1. Nama Lengkap: [Nama Anda]
2. Username / Handle: @[username]
3. Lokasi: [Kota / Negara] (Opsional)
4. Bio Singkat (Bahasa Indonesia): [Tulis bio Anda di sini]
5. Bio Singkat (English): [Opsional - atau biarkan AI menerjemahkannya]
6. Akun Media Sosial (Isi yang ingin ditampilkan):
   - GitHub: https://github.com/...
   - LinkedIn: https://linkedin.com/in/...
   - X (Twitter): https://x.com/...
   - Instagram: https://instagram.com/...
   - Email: mailto:alamat@email.com
7. Tautan Unggulan (Featured Link):
   - Judul: [Judul Tautan]
   - Deskripsi: [Deskripsi Singkat]
   - URL: https://...
8. Daftar Tautan Lainnya (Link Cards):
   - Tautan 1: Judul | Deskripsi | URL | Kategori
   - Tautan 2: Judul | Deskripsi | URL | Kategori
```

AI assistant akan secara otomatis memperbarui file konfigurasi `app/data/profile.ts`, memvalidasi URL, dan menguji build untuk Anda.

---

## 🛠️ Cara 2: Personalisasi Mandiri via `app/data/profile.ts`

Seluruh konten website diatur dalam **satu file tunggal**:
👉 [app/data/profile.ts](file:///c:/Users/Dimas%20Mong/Downloads/Project/Link%20in%20Bio/app/data/profile.ts)

### 1. Menambahkan Foto Profil Lokal
1. Siapkan file foto Anda (format `.jpg`, `.png`, atau `.webp`).
2. Masukkan file tersebut ke dalam folder: `public/images/` (misalnya `public/images/avatar.jpg`).
3. Pada file `app/data/profile.ts`, ubah nilai:
   ```ts
   avatarUrl: "/images/avatar.jpg",
   ```
4. **Fallback Inisial:** Jika `avatarUrl` dikosongkan (`""`) atau file foto gagal dimuat, sistem otomatis membuat avatar monogram cantik berbasis inisial nama Anda.

### 2. Akun Sosial Media
Akun sosial terletak di bagian `socials`:
```ts
socials: [
  { platform: "github", label: "GitHub", url: "https://github.com/username" },
  { platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/username" },
  { platform: "email", label: "Email", url: "mailto:anda@domain.com" },
]
```
> **Catatan:** Jika `url` dibiarkan kosong (`""`), ikon sosial tersebut otomatis disembunyikan.

### 3. Menambahkan & Mengatur Tautan
Daftar tautan diatur di bagian `links`:
```ts
links: [
  {
    id: "proyek-saya",
    title: {
      id: "Judul Tautan (Indonesia)",
      en: "Link Title (English)",
    },
    description: {
      id: "Deskripsi singkat tentang tautan ini",
      en: "Short description about this link",
    },
    url: "https://tautan-anda.com",
    featured: true, // Beri 'true' untuk kartu unggulan yang lebih menonjol
    badge: { id: "Unggulan", en: "Featured" },
    icon: "sparkles", // Pilihan: "sparkles" | "code" | "book" | "message" | "globe"
    category: { id: "Kategori", en: "Category" },
  },
]
```
> **Aturan Keamanan:** Hanya tautan dengan format URL yang valid dan aktif yang dapat diklik. Tautan kosong tidak akan di-render.

---

## 🧪 Menguji Perubahan Secara Lokal

Jalankan perintah ini di terminal:
```powershell
npm run dev
```
Buka browser di: [http://localhost:5173](http://localhost:5173). Seluruh perubahan akan otomatis ter-update secara instan (Hot Module Replacement).
