# Panduan Personalisasi Mobio Link Bio (Liquid Glass)

Panduan lengkap untuk mempersonalisasi seluruh aspek tampilan dan konten website **Mobio Link Bio** Anda yang telah didesain ulang dengan estetika **Liquid Glass**.

---

## 🚀 Cara 1: Personalisasi Cepat Lewat Percakapan AI (Paling Praktis)

Cukup salin format formulir di bawah ini, lengkapi datanya, lalu kirimkan di percakapan dengan asisten AI:

```text
Halo, tolong perbarui data website Mobio Link Bio saya dengan detail berikut:

1. PROFIL:
   - Nama Lengkap: [Nama Anda]
   - Username / Handle: @[username]
   - Lokasi: [Kota / Negara]
   - Bio Singkat (Bahasa Indonesia): [Bio Anda]
   - Bio Singkat (English): [Opsional]

2. LATAR BELAKANG & COVER:
   - Tipe Background: gradient / image / video
   - Cover Banner: Aktif (Gunakan fallback aurora kaca / URL gambar kustom)

3. DAFTAR TAUTAN (Satu Kolom Vertikal):
   - Tautan 1: Judul | Deskripsi | URL | Icon (github / linkedin / globe / code / book)
   - Tautan 2: Judul | Deskripsi | URL | Icon
   - Tautan 3: Judul | Deskripsi | URL | Icon

4. BAGIAN EXPLORE:
   - Proyek Unggulan: Judul | Deskripsi | URL Proyek | Tags
   - Galeri / Foto: Judul | Subtitle | URL Foto
   - Playlist Musik: Judul | Subtitle | URL Spotify / YouTube
   - Catatan / Notes: Judul | Deskripsi Singkat

5. KONTAK LANGSUNG:
   - WhatsApp: [Nomor WhatsApp lengkap dengan kode negara, misal: https://wa.me/62812...]
   - Telegram: [https://t.me/username]
   - Instagram: [https://instagram.com/username]
   - Email: [mailto:email@domain.com]
```

Asisten AI akan secara otomatis memodifikasi file [app/data/profile.ts](file:///c:/Users/Dimas%20Mong/Downloads/Project/Link%20in%20Bio/app/data/profile.ts) dan memverifikasi hasilnya untuk Anda.

---

## 🛠️ Cara 2: Personalisasi Mandiri via `app/data/profile.ts`

Seluruh konten diatur pada satu file terpusat:
👉 [app/data/profile.ts](file:///c:/Users/Dimas%20Mong/Downloads/Project/Link%20in%20Bio/app/data/profile.ts)

### 1. Profil Utama & Foto Avatar
```ts
name: "Nama Lengkap Anda",
handle: "@username_anda",
avatarUrl: "", // Jika dikosongkan (""), inisial nama Anda otomatis menjadi avatar monogram cantik
// Atau gunakan gambar lokal di folder public: "/images/avatar.jpg"
location: {
  id: "Jakarta, Indonesia",
  en: "Jakarta, Indonesia",
},
bio: {
  id: "Deskripsi singkat profil Anda dalam bahasa Indonesia.",
  en: "Short description of your profile in English.",
},
```

### 2. Kustomisasi Latar Belakang (Fixed Fullscreen Background)
Anda dapat memilih 3 jenis background:
- **Gradient Mesh Aurora (Default):**
  ```ts
  background: {
    type: "gradient",
    animation: true, // Efek gelombang aurora yang halus
    overlayColor: "rgba(248, 250, 252, 0.45)",
    overlayOpacity: 0.45,
  }
  ```
- **Gambar Statis:**
  ```ts
  background: {
    type: "image",
    src: "/images/bg-custom.jpg",
    position: "center center",
    blur: "4px",
    overlayOpacity: 0.5,
  }
  ```
- **Video Bergerak:**
  ```ts
  background: {
    type: "video",
    src: "/videos/background.mp4",
    poster: "/images/video-poster.jpg",
    overlayOpacity: 0.55,
  }
  ```

### 3. Banner Cover
Terletak di bagian atas sebelum kartu profil:
```ts
cover: {
  enabled: true,
  coverUrl: "", // Dikosongkan = efek aurora specular glass fallback otomatis
  // Atau isi: "/images/cover.jpg"
  aspectRatio: "aspect-[21/9]",
}
```

### 4. Daftar Tautan Vertikal (`links`)
Tautan ditampilkan dalam satu kolom vertikal yang rapi di semua layar:
```ts
links: [
  {
    id: "github",
    title: { id: "Repositori GitHub", en: "GitHub Repositories" },
    description: { id: "Koleksi kode sumber terbuka", en: "Open-source codebase" },
    url: "https://github.com/username",
    platform: "github", // Pilihan ikon: "github" | "linkedin" | "twitter" | "instagram" | "youtube" | "email" | "code" | "book" | "globe"
    icon: "github",
    enabled: true,
  },
]
```

### 5. Bagian Explore Modular (`explore`)
Mendukung kartu proyek, galeri foto dengan Lightbox interaktif, playlist musik, dan catatan:
- **Proyek (`type: "project"`):** Menampilkan judul, deskripsi, tag teknologi, dan tautan eksternal.
- **Galeri Foto (`type: "gallery"`):** Mendukung klik untuk membuka modal Liquid Glass Lightbox ukuran penuh dengan backdrop blur dan tombol tutup (didukung tombol keyboard `Escape`).
- **Musik (`type: "music"`):** Memuat informasi playlist, artis, tag genre, dan tautan Spotify/Apple Music.
- **Catatan Pendek (`type: "note"`):** Menampilkan tulisan inspirasi atau kutipan ringkas.

### 6. Bagian Kontak Langsung (`contact`)
Kartu aksi instan sekali klik tanpa form buatan:
```ts
contact: {
  enabled: true,
  methods: [
    {
      id: "whatsapp",
      platform: "whatsapp",
      title: { id: "Chat WhatsApp", en: "WhatsApp Chat" },
      value: "+62 812-3456-7890",
      url: "https://wa.me/6281234567890",
    },
    {
      id: "telegram",
      platform: "telegram",
      title: { id: "Kirim Pesan Telegram", en: "Telegram Message" },
      value: "@username",
      url: "https://t.me/username",
    },
    {
      id: "email",
      platform: "email",
      title: { id: "Email Resmi", en: "Official Email" },
      value: "halo@domain.com",
      url: "mailto:halo@domain.com",
    },
  ],
}
```

---

## 🧪 Menguji Perubahan Secara Lokal

Jalankan perintah berikut di PowerShell atau terminal:
```bash
npm run dev
```
Buka peramban di [http://localhost:5173](http://localhost:5173). Seluruh pembaruan langsung terlihat secara otomatis (Fast Refresh).
