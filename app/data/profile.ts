/**
 * MOBIO LINK BIO — CONFIGURATION FILE
 *
 * File konfigurasi terpusat untuk profil personal, latar belakang kustom,
 * banner cover, daftar tautan vertikal, bagian Explore modular, dan kontak.
 *
 * Seluruh teks mendukung dwibahasa:
 * - id: Bahasa Indonesia
 * - en: English
 */

export type Language = "id" | "en";

export interface LocalizedString {
	id: string;
	en: string;
}

// 1. Custom Fixed Background System
export type BackgroundType = "gradient" | "image" | "video";

export interface BackgroundConfig {
	type: BackgroundType;
	src?: string; // URL gambar atau video lokal/eksternal
	poster?: string; // Poster fallback untuk video
	position?: string; // e.g. "center center"
	scale?: number | string; // e.g. 1
	overlayColor?: string; // Warna overlay adaptif
	overlayOpacity?: number; // Nilai transparansi overlay (0 - 1)
	brightness?: number; // Nilai kecerahan (0.5 - 1.5)
	blur?: string; // Efek blur tambahan (e.g. "0px", "8px")
	animation?: boolean; // Aktifkan animasi aurora mesh
}

// 2. Custom Cover Banner
export interface CoverConfig {
	enabled: boolean;
	coverUrl?: string; // Path gambar/video cover (opsional, jika kosong merender liquid glass fallback)
	focalPoint?: string; // e.g. "center"
	aspectRatio?: string; // e.g. "aspect-[21/9]" atau "aspect-[16/7]"
	alt?: LocalizedString;
}

// 3. Vertical Link Cards (One column on all viewports, no featured link)
export interface VerticalLink {
	id: string;
	title: LocalizedString;
	description?: LocalizedString;
	url: string;
	icon?: string; // Identifier: "code" | "book" | "sparkles" | "message" | "globe" | "github" | "linkedin" dll.
	platform?: string; // e.g. "github", "linkedin", "twitter", "instagram", "youtube", "website"
	enabled?: boolean;
}

// 4. Explore Section — Modular Content System
export type ExploreContentType =
	| "project"
	| "gallery"
	| "music"
	| "game"
	| "book"
	| "video"
	| "note";

export interface ExploreItem {
	id: string;
	type: ExploreContentType;
	title: LocalizedString;
	subtitle?: LocalizedString;
	description?: LocalizedString;
	coverImage?: string;
	url?: string;
	badge?: LocalizedString;
	metadata?: {
		tags?: string[];
		artist?: string;
		rating?: string;
		year?: string;
		author?: string;
	};
}

export interface ExploreConfig {
	enabled: boolean;
	title: LocalizedString;
	description?: LocalizedString;
	items: ExploreItem[];
}

// 5. Contact Section
export interface ContactMethod {
	id: string;
	platform: "email" | "whatsapp" | "telegram" | "instagram" | "other";
	label: LocalizedString;
	value: string;
	url: string;
	icon?: string;
}

export interface ContactConfig {
	enabled: boolean;
	title: LocalizedString;
	description?: LocalizedString;
	methods: ContactMethod[];
}

// 6. Complete Profile Schema
export interface ProfileData {
	// Identitas Profil
	name: string;
	handle: string;
	avatarUrl: string;
	location?: LocalizedString;
	bio: LocalizedString;

	// Background & Cover
	background: BackgroundConfig;
	cover: CoverConfig;

	// Pengaturan Tema Visual
	theme: {
		palette: "frost-aurora" | "dark" | "glass-crystal";
		glassIntensity: "subtle" | "medium" | "deep";
	};

	// Daftar Tautan Vertikal (Satu kolom vertikal di semua layar)
	links: VerticalLink[];

	// Bagian Explore Modular
	explore: ExploreConfig;

	// Bagian Kontak
	contact: ContactConfig;

	// Navigasi Terapung
	navigation: {
		homeLabel: LocalizedString;
		exploreLabel: LocalizedString;
		contactLabel: LocalizedString;
	};

	// Footer Pribadi
	footer: {
		showFooter: boolean;
		customText?: LocalizedString;
	};
}

export const profileData: ProfileData = {
	// [DATA PROFIL PEMILIK] Ganti dengan nama dan username Anda
	name: "[Nama Anda]",
	handle: "@username",
	avatarUrl: "", // Kosongkan untuk avatar monogram inisial otomatis, atau isi e.g. "/images/avatar.jpg"
	location: {
		id: "Indonesia",
		en: "Indonesia",
	},
	bio: {
		id: "Selamat datang di Link in Bio saya. Kustomisasi deskripsi ini untuk merepresentasikan profil dan karya Anda.",
		en: "Welcome to my Link in Bio. Customize this description to represent your profile and works.",
	},

	// Background Kustom (Fixed, Fullscreen, Responsive)
	background: {
		type: "gradient", // "gradient" | "image" | "video"
		src: "", // Jika "image" atau "video", masukkan path e.g. "/images/background.jpg"
		position: "center center",
		scale: 1,
		overlayColor: "rgba(248, 250, 252, 0.45)",
		overlayOpacity: 0.45,
		brightness: 1,
		blur: "0px",
		animation: true, // Animasi halus Frost Aurora mesh
	},

	// Custom Cover Banner
	cover: {
		enabled: true,
		coverUrl: "", // Jika kosong (""), merender liquid aurora cover fallback
		focalPoint: "center",
		aspectRatio: "aspect-[21/9]",
		alt: {
			id: "Banner profil",
			en: "Profile banner",
		},
	},

	// Pengaturan Tema
	theme: {
		palette: "frost-aurora",
		glassIntensity: "medium",
	},

	// Daftar Tautan Vertikal (SATU KOLOM di semua ukuran layar)
	// Tambahkan tautan pribadi Anda di sini. Jika kosong, sistem menampilkan empty state profesional.
	links: [
		/* Contoh menambahkan tautan:
		{
			id: "github-profile",
			title: { id: "GitHub", en: "GitHub" },
			description: { id: "Repositori kode dan proyek", en: "Code repositories and projects" },
			url: "https://github.com/username",
			platform: "github",
			icon: "github",
			enabled: true,
		},
		*/
	],

	// Bagian Explore Modular (Mendukung berbagai jenis konten: project, gallery, music, note)
	// Tambahkan konten personal Anda di sini. Jika kosong, sistem menampilkan empty state profesional.
	explore: {
		enabled: true,
		title: {
			id: "Eksplorasi & Karya",
			en: "Explore & Highlights",
		},
		description: {
			id: "Kumpulan proyek terpilih, galeri foto, playlist, dan catatan pribadi",
			en: "Selected projects, photo gallery, music playlists, and notes",
		},
		items: [
			/* Contoh menambahkan item explore:
			{
				id: "my-project-1",
				type: "project",
				title: { id: "Nama Proyek", en: "Project Name" },
				description: { id: "Deskripsi singkat proyek", en: "Short project description" },
				url: "https://tautan-proyek.com",
				badge: { id: "Proyek", en: "Project" },
				metadata: { tags: ["React", "TypeScript"], year: "2026" },
			},
			*/
		],
	},

	// Bagian Kontak
	// Tambahkan saluran komunikasi langsung Anda di sini. Jika kosong, sistem menampilkan empty state profesional.
	contact: {
		enabled: true,
		title: {
			id: "Hubungi Saya",
			en: "Get in Touch",
		},
		description: {
			id: "Silakan hubungi melalui saluran komunikasi pilihan di bawah ini",
			en: "Reach out via any of the direct communication channels below",
		},
		methods: [
			/* Contoh menambahkan kontak:
			{
				id: "contact-email",
				platform: "email",
				label: { id: "Surel Resmi", en: "Direct Email" },
				value: "email@anda.com",
				url: "mailto:email@anda.com",
			},
			{
				id: "contact-whatsapp",
				platform: "whatsapp",
				label: { id: "WhatsApp", en: "WhatsApp" },
				value: "+62 812-xxxx-xxxx",
				url: "https://wa.me/62812xxxxxxxx",
			},
			*/
		],
	},

	// Label Navigasi (Hanya Home, Explore, Contact — NO Links)
	navigation: {
		homeLabel: {
			id: "Beranda",
			en: "Home",
		},
		exploreLabel: {
			id: "Eksplorasi",
			en: "Explore",
		},
		contactLabel: {
			id: "Kontak",
			en: "Contact",
		},
	},

	// Footer Pribadi
	footer: {
		showFooter: true,
		customText: {
			id: "Hak cipta dilindungi undang-undang.",
			en: "All rights reserved.",
		},
	},
};
