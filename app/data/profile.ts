/**
 * PERSONAL LINK BIO — CONFIGURATION FILE
 *
 * File konfigurasi terpusat untuk profil personal, tautan media sosial,
 * kartu tautan, dan pengaturan tampilan.
 *
 * Seluruh teks mendukung dwibahasa:
 * - id: Bahasa Indonesia
 * - en: English
 *
 * CATATAN PENTING:
 * - Foto profil: Letakkan foto Anda di folder `public/images/` (contoh: `public/images/avatar.jpg`)
 *   lalu isi avatarUrl dengan "/images/avatar.jpg".
 *   Jika avatarUrl dikosongkan (""), inisial nama akan otomatis digunakan sebagai avatar.
 * - Akun sosial & link: Jika `url` dikosongkan (""), item terkait akan otomatis disembunyikan.
 */

export type Language = "id" | "en";

export interface LocalizedString {
	id: string;
	en: string;
}

export type SocialPlatform =
	| "github"
	| "linkedin"
	| "twitter"
	| "instagram"
	| "youtube"
	| "email"
	| "telegram"
	| "website";

export interface SocialLink {
	platform: SocialPlatform;
	label: string;
	/**
	 * URL profil media sosial Anda.
	 * Jika dikosongkan (""), ikon ini otomatis disembunyikan.
	 */
	url: string;
}

export type LinkIconType =
	| "code"
	| "briefcase"
	| "sparkles"
	| "book"
	| "globe"
	| "rocket"
	| "palette"
	| "message"
	| "external";

export interface BioLink {
	id: string;
	title: LocalizedString;
	description?: LocalizedString;
	/**
	 * URL tujuan tautan.
	 * Jika kosong atau "#", tautan tidak akan ditampilkan sebagai link aktif.
	 */
	url?: string;
	/**
	 * Set true untuk kartu unggulan utama (Featured).
	 */
	featured?: boolean;
	badge?: LocalizedString;
	icon?: LinkIconType;
	category?: LocalizedString;
}

export interface ProfileData {
	// Informasi Profil Pribadi
	name: string;
	handle: string;
	avatarUrl: string;
	location?: LocalizedString;
	bio: LocalizedString;

	// Opsi Tampilan (Default OFF)
	showVerifiedBadge?: boolean;
	showStatusBadge?: boolean;
	statusBadge?: LocalizedString;

	// Label Bagian (Bilingual)
	labels: {
		featuredSection: LocalizedString;
		linksSection: LocalizedString;
		socialNavLabel: LocalizedString;
	};

	// Akun Sosial Media
	socials: SocialLink[];

	// Daftar Kartu Tautan
	links: BioLink[];

	// Pengaturan Footer Pribadi
	footer: {
		showFooter: boolean;
		customText?: LocalizedString;
	};
}

export const profileData: ProfileData = {
	// [MENUNGGU DATA PEMILIK] Ganti dengan nama lengkap atau display name Anda
	name: "[Nama Anda]",

	// [MENUNGGU DATA PEMILIK] Ganti dengan handle / username Anda
	handle: "@username",

	// [OPSIONAL] Path gambar lokal di public/images/ (contoh: "/images/avatar.jpg").
	// Kosongkan ("") untuk menggunakan inisial nama otomatis.
	avatarUrl: "",

	// [OPSIONAL] Lokasi (kosongkan jika tidak ingin ditampilkan)
	location: {
		id: "Indonesia",
		en: "Indonesia",
	},

	// [MENUNGGU DATA PEMILIK] Deskripsi bio dwibahasa Anda
	bio: {
		id: "Selamat datang di Link in Bio saya. Bagian bio ini dapat disesuaikan dengan deskripsi diri dan fokus Anda.",
		en: "Welcome to my Link in Bio. Customize this bio section with your personal description and focus.",
	},

	// Opsi Lencana (Default OFF)
	showVerifiedBadge: false,
	showStatusBadge: false,
	statusBadge: {
		id: "Terbuka untuk Diskusi",
		en: "Open for Discussions",
	},

	// Label Bagian Antarmuka
	labels: {
		featuredSection: {
			id: "Tautan Unggulan",
			en: "Featured Links",
		},
		linksSection: {
			id: "Tautan & Eksplorasi",
			en: "Links & Exploration",
		},
		socialNavLabel: {
			id: "Tautan media sosial",
			en: "Social media links",
		},
	},

	// [MENUNGGU DATA PEMILIK] Akun Sosial Media
	// Hanya item dengan URL terisi yang akan ditampilkan. Kosongkan ("") jika belum ada.
	socials: [
		{
			platform: "github",
			label: "GitHub",
			url: "",
		},
		{
			platform: "linkedin",
			label: "LinkedIn",
			url: "",
		},
		{
			platform: "twitter",
			label: "X (Twitter)",
			url: "",
		},
		{
			platform: "instagram",
			label: "Instagram",
			url: "",
		},
		{
			platform: "email",
			label: "Email",
			url: "",
		},
	],

	// [MENUNGGU DATA PEMILIK] Daftar Kartu Tautan
	// Item dengan URL kosong otomatis disembunyikan sampai data asli diisi.
	links: [],

	// Footer Pribadi
	footer: {
		showFooter: true,
		customText: {
			id: "Hak cipta dilindungi undang-undang.",
			en: "All rights reserved.",
		},
	},
};
