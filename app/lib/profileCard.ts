/**
 * MOBIO STUDIO — PROFILE CARD ENGINE: 10 STYLES & CARD SIZE MATRIX (V4)
 *
 * Provides:
 * - 3 Selectable Card Sizes (Small, Medium [Default], Normal)
 * - 10 Visibly Distinct Profile Card Styles
 * - Automatic Style-Driven Cover Geometry (Manual Aspect Ratio Removed)
 * - Strict Dimension Constraints (Measurably Compact Default)
 */

export type CardSize = "small" | "medium" | "normal";

export interface CardSizeConfig {
	id: CardSize;
	name: { id: string; en: string };
	tagline: { id: string; en: string };
	maxWidthClass: string;
	avatarSizeClass: string;
	avatarPx: number;
	nameClass: string;
	handleClass: string;
	bioClass: string;
	paddingClass: string;
}

export const CARD_SIZES: CardSizeConfig[] = [
	{
		id: "small",
		name: { id: "Kecil", en: "Small" },
		tagline: { id: "Kompak ramping (sejajar)", en: "Slim compact (aligned)" },
		maxWidthClass: "w-full",
		avatarSizeClass: "w-16 h-16 sm:w-[72px] sm:h-[72px]",
		avatarPx: 68,
		nameClass: "text-lg sm:text-xl font-bold",
		handleClass: "text-xs text-theme-muted",
		bioClass: "text-xs leading-relaxed",
		paddingClass: "p-4 sm:p-5",
	},
	{
		id: "medium",
		name: { id: "Sedang", en: "Medium" },
		tagline: { id: "Kompak seimbang (sejajar)", en: "Balanced compact (aligned)" },
		maxWidthClass: "w-full",
		avatarSizeClass: "w-20 h-20 sm:w-[86px] sm:h-[86px]",
		avatarPx: 84,
		nameClass: "text-xl sm:text-2xl font-bold",
		handleClass: "text-xs sm:text-sm text-theme-muted",
		bioClass: "text-xs sm:text-sm leading-relaxed",
		paddingClass: "p-5 sm:p-6",
	},
	{
		id: "normal",
		name: { id: "Normal", en: "Normal" },
		tagline: { id: "Standar lega (sejajar)", en: "Standard roomy (aligned)" },
		maxWidthClass: "w-full",
		avatarSizeClass: "w-24 h-24 sm:w-[98px] sm:h-[98px]",
		avatarPx: 96,
		nameClass: "text-2xl sm:text-3xl font-bold",
		handleClass: "text-sm text-theme-muted",
		bioClass: "text-sm leading-relaxed",
		paddingClass: "p-6 sm:p-7",
	},
];

export interface ProfileCardStyle {
	id: string;
	name: { id: string; en: string };
	tagline: { id: string; en: string };
	description: { id: string; en: string };
	coverTreatment:
		| "immersive-fade"
		| "minimal-strip"
		| "compact-banner"
		| "backdrop-blur"
		| "accent-bar"
		| "frosted-overlay"
		| "frameless-scrim"
		| "split-texture"
		| "capsule-accent"
		| "cinematic-vignette";
	coverHeightClass: string;
	previewIcon: string;
}

export const PROFILE_CARD_STYLES: ProfileCardStyle[] = [
	// 1. IMMERSIVE FADE (Default)
	{
		id: "immersive-fade",
		name: { id: "Imersif Memudar", en: "Immersive Fade" },
		tagline: { id: "Sampul foto memudar alami ke kaca", en: "Full-card cover fading smoothly to glass" },
		description: {
			id: "Sampul fotografis membentang di bagian atas dan memudar secara halus ke permukaan kaca Liquid Glass.",
			en: "Photographic cover bleeds smoothly down into the Liquid Glass surface with centered identity.",
		},
		coverTreatment: "immersive-fade",
		coverHeightClass: "h-28 sm:h-32",
		previewIcon: "card-fade",
	},

	// 2. MINIMAL IDENTITY
	{
		id: "minimal-identity",
		name: { id: "Identitas Minimalis", en: "Minimal Identity" },
		tagline: { id: "Avatar berdampingan teks ringkas", en: "Adjacent avatar with compact identity" },
		description: {
			id: "Format sangat ramping dengan avatar bersanding langsung di sebelah nama dan garis aksen tipis di atas.",
			en: "Ultra-slim format with avatar positioned directly alongside name and a subtle top accent strip.",
		},
		coverTreatment: "minimal-strip",
		coverHeightClass: "h-11 sm:h-12",
		previewIcon: "card-minimal",
	},

	// 3. COMPACT BANNER
	{
		id: "compact-banner",
		name: { id: "Banner Kompak", en: "Compact Banner" },
		tagline: { id: "Banner panorama pendek proporsional", en: "Short panoramic banner with avatar overlap" },
		description: {
			id: "Banner panorama pendek yang rapi dengan avatar tumpang tindih terpusat di garis batas kartu.",
			en: "Neat, short panoramic banner with avatar cleanly overlapping at the card boundary.",
		},
		coverTreatment: "compact-banner",
		coverHeightClass: "h-20 sm:h-22",
		previewIcon: "card-banner",
	},

	// 4. FLOATING AVATAR
	{
		id: "floating-avatar",
		name: { id: "Avatar Melayang", en: "Floating Avatar" },
		tagline: { id: "Fokus utama pada cincin avatar", en: "Focal avatar with glowing ring" },
		description: {
			id: "Avatar menjadi titik fokus utama dengan cincin spekular halus, sementara cover menjadi latar belakang lembut.",
			en: "Avatar stands out with a specular glowing ring while cover serves as a soft diffuse backdrop.",
		},
		coverTreatment: "backdrop-blur",
		coverHeightClass: "h-24 sm:h-28",
		previewIcon: "card-floating",
	},

	// 5. EDITORIAL PROFILE
	{
		id: "editorial-profile",
		name: { id: "Profil Editorial", en: "Editorial Profile" },
		tagline: { id: "Tipografi asimetris rata kiri", en: "Typography-forward left alignment" },
		description: {
			id: "Gaya majalah modern dengan susunan identitas rata kiri, aksen foto vertikal, dan tipografi ekspresif.",
			en: "Modern magazine style with left-aligned identity, vertical photo accent, and editorial hierarchy.",
		},
		coverTreatment: "accent-bar",
		coverHeightClass: "h-16 sm:h-20",
		previewIcon: "card-editorial",
	},

	// 6. FROSTED PANEL
	{
		id: "frosted-panel",
		name: { id: "Panel Terfrosted", en: "Frosted Panel" },
		tagline: { id: "Kaca es transparan menyeluruh", en: "Translucent frosted patina with specular rim" },
		description: {
			id: "Foto sampul menyatu di balik panel kaca es transparan dengan kilau tepi spekular ganda yang anggun.",
			en: "Cover photo seamlessly integrated behind a frosted glass patina with graceful specular highlights.",
		},
		coverTreatment: "frosted-overlay",
		coverHeightClass: "h-28 sm:h-32",
		previewIcon: "card-frosted",
	},

	// 7. FRAMELESS COVER
	{
		id: "frameless-cover",
		name: { id: "Sampul Tanpa Bingkai", en: "Frameless Cover" },
		tagline: { id: "Fotografi organik tanpa batas kaku", en: "Organic photography with contrast scrim" },
		description: {
			id: "Fotografi menyatu secara organik tanpa batas kaku, dengan scrim kontras tinggi melindungi keterbacaan teks.",
			en: "Organic photography without harsh borders, featuring a high-contrast scrim protecting text.",
		},
		coverTreatment: "frameless-scrim",
		coverHeightClass: "h-32 sm:h-36",
		previewIcon: "card-frameless",
	},

	// 8. SPLIT IDENTITY
	{
		id: "split-identity",
		name: { id: "Identitas Terbelah", en: "Split Identity" },
		tagline: { id: "Zona ganda avatar dan biodata", en: "Two-zone avatar and bio composition" },
		description: {
			id: "Komposisi dua zona: sisi visual foto di satu sisi dan data identitas di sisi lain, runtuh anggun di ponsel.",
			en: "Two-zone composition: avatar visual on one side, identity on the other, gracefully responsive.",
		},
		coverTreatment: "split-texture",
		coverHeightClass: "h-20 sm:h-24",
		previewIcon: "card-split",
	},

	// 9. SOFT CAPSULE
	{
		id: "soft-capsule",
		name: { id: "Kapsul Halus", en: "Soft Capsule" },
		tagline: { id: "Bingkai bulat kapsul modern", en: "Modern pill-framed silhouette" },
		description: {
			id: "Siluet kapsul membulat modern dengan avatar kompak, lencana status, dan aksen sampul melengkung rapi.",
			en: "Modern pill-shaped rounded silhouette with compact avatar, status chip, and curved cover accent.",
		},
		coverTreatment: "capsule-accent",
		coverHeightClass: "h-16 sm:h-18",
		previewIcon: "card-capsule",
	},

	// 10. CINEMATIC MINI
	{
		id: "cinematic-mini",
		name: { id: "Sinematik Mini", en: "Cinematic Mini" },
		tagline: { id: "Nuansa poster film dramatis", en: "Movie-poster atmospheric vignette" },
		description: {
			id: "Komposisi sinematik terpadat dengan pencahayaan moody atas-ke-bawah dan keterbacaan tipografi prima.",
			en: "Dense cinematic composition with atmospheric top-to-bottom vignette and prime text legibility.",
		},
		coverTreatment: "cinematic-vignette",
		coverHeightClass: "h-30 sm:h-34",
		previewIcon: "card-cinematic",
	},
];

/**
 * Resolves card size configuration, defaulting to 'medium'.
 */
export function getCardSizeConfig(size?: CardSize | string | null): CardSizeConfig {
	if (!size || typeof size !== "string") {
		return CARD_SIZES[1]; // medium
	}
	const clean = size.trim().toLowerCase();
	const found = CARD_SIZES.find((s) => s.id === clean);
	return found || CARD_SIZES[1];
}

/**
 * Resolves profile card style by ID, defaulting to 'immersive-fade'.
 */
export function getProfileCardStyle(styleId?: string | null): ProfileCardStyle {
	if (!styleId || typeof styleId !== "string") {
		return PROFILE_CARD_STYLES[0]; // immersive-fade
	}
	const clean = styleId.trim().toLowerCase();
	const found = PROFILE_CARD_STYLES.find((s) => s.id === clean);
	return found || PROFILE_CARD_STYLES[0];
}
