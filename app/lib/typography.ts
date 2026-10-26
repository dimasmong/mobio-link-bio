/**
 * MOBIO STUDIO — PREMIUM TYPOGRAPHY REGISTRY & FONT LIBRARY (V4)
 *
 * Provides:
 * - 24 Curated Google Fonts across 5 Distinct Categories
 * - Efficient On-Demand Font Loading (Public loads active font only)
 * - Safe CSS Fallback Stacks preventing Layout Shifts
 * - Progressive Font Preview Support for Appearance Studio
 */

export type FontCategory =
	| "clean"
	| "geometric"
	| "professional"
	| "rounded"
	| "creative";

export interface FontCategoryInfo {
	id: FontCategory;
	name: { id: string; en: string };
	description: { id: string; en: string };
}

export interface FontPreset {
	id: string;
	name: string;
	category: FontCategory;
	googleFamily: string; // e.g. "Plus+Jakarta+Sans:wght@400;500;600;700"
	cssFontFamily: string;
	weights: number[];
	previewText: string;
}

export const FONT_CATEGORIES: FontCategoryInfo[] = [
	{
		id: "clean",
		name: { id: "Bersih & Modern", en: "Clean & Modern" },
		description: { id: "Tipografi netral, jernih, dan sangat mudah dibaca", en: "Neutral, crisp, and highly legible typography" },
	},
	{
		id: "geometric",
		name: { id: "Geometris", en: "Geometric" },
		description: { id: "Bentuk proporsional dan arsitektural kontemporer", en: "Proportional forms and contemporary architecture" },
	},
	{
		id: "professional",
		name: { id: "Minimal & Profesional", en: "Minimal & Professional" },
		description: { id: "Karakter teknis, korporat rapi, dan terstruktur", en: "Technical, polished corporate, and structured character" },
	},
	{
		id: "rounded",
		name: { id: "Lembut & Membulat", en: "Soft & Rounded" },
		description: { id: "Sentuhan hangat, ramah, dan bersahabat", en: "Warm, friendly, and approachable aesthetics" },
	},
	{
		id: "creative",
		name: { id: "Editorial & Kreatif", en: "Editorial & Creative" },
		description: { id: "Gaya ekspresif, berani, dan berjiwa desain tinggi", en: "Expressive, bold, and high-design editorial voice" },
	},
];

export const FONT_PRESETS: FontPreset[] = [
	// ---------------------------------------------------------------------------
	// 1. CLEAN & MODERN
	// ---------------------------------------------------------------------------
	{
		id: "inter",
		name: "Inter",
		category: "clean",
		googleFamily: "Inter:wght@400;500;600;700",
		cssFontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "The quick brown fox jumps over the lazy dog",
	},
	{
		id: "mulish",
		name: "Mulish",
		category: "clean",
		googleFamily: "Mulish:wght@400;500;600;700",
		cssFontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Minimalist poise with sleek modern readability",
	},
	{
		id: "work-sans",
		name: "Work Sans",
		category: "clean",
		googleFamily: "Work+Sans:wght@400;500;600;700",
		cssFontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Optimized for screens and clean interface craft",
	},
	{
		id: "instrument-sans",
		name: "Instrument Sans",
		category: "clean",
		googleFamily: "Instrument+Sans:wght@400;500;600;700",
		cssFontFamily: "'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Modern neo-grotesque precision and elegance",
	},
	{
		id: "figtree",
		name: "Figtree",
		category: "clean",
		googleFamily: "Figtree:wght@400;500;600;700",
		cssFontFamily: "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Crisp and friendly geometric humanism",
	},
	{
		id: "lexend",
		name: "Lexend",
		category: "clean",
		googleFamily: "Lexend:wght@400;500;600;700",
		cssFontFamily: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Engineered specifically to enhance reading speed",
	},
	{
		id: "be-vietnam-pro",
		name: "Be Vietnam Pro",
		category: "clean",
		googleFamily: "Be+Vietnam+Pro:wght@400;500;600;700",
		cssFontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Global contemporary elegance with balanced rhythm",
	},
	{
		id: "noto-sans",
		name: "Noto Sans",
		category: "clean",
		googleFamily: "Noto+Sans:wght@400;500;600;700",
		cssFontFamily: "'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Universal clarity and pristine typography balance",
	},

	// ---------------------------------------------------------------------------
	// 2. GEOMETRIC
	// ---------------------------------------------------------------------------
	{
		id: "manrope",
		name: "Manrope",
		category: "geometric",
		googleFamily: "Manrope:wght@400;500;600;700",
		cssFontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Modern open-source geometric crossover sans-serif",
	},
	{
		id: "plus-jakarta-sans",
		name: "Plus Jakarta Sans",
		category: "geometric",
		googleFamily: "Plus+Jakarta+Sans:wght@400;500;600;700",
		cssFontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Clean contemporary Indonesian geometric excellence",
	},
	{
		id: "outfit",
		name: "Outfit",
		category: "geometric",
		googleFamily: "Outfit:wght@400;500;600;700",
		cssFontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Vibrant and refined branded geometric harmony",
	},
	{
		id: "urbanist",
		name: "Urbanist",
		category: "geometric",
		googleFamily: "Urbanist:wght@400;500;600;700",
		cssFontFamily: "'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Low-contrast modernist geometric architecture",
	},
	{
		id: "sora",
		name: "Sora",
		category: "geometric",
		googleFamily: "Sora:wght@400;500;600;700",
		cssFontFamily: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Distinctive high-tech cues with crisp geometric proportions",
	},
	{
		id: "onest",
		name: "Onest",
		category: "geometric",
		googleFamily: "Onest:wght@400;500;600;700",
		cssFontFamily: "'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Ergonomic clarity and pristine digital geometry",
	},

	// ---------------------------------------------------------------------------
	// 3. MINIMAL & PROFESSIONAL
	// ---------------------------------------------------------------------------
	{
		id: "dm-sans",
		name: "DM Sans",
		category: "professional",
		googleFamily: "DM+Sans:wght@400;500;600;700",
		cssFontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Precise low-contrast sans designed for clarity",
	},
	{
		id: "ibm-plex-sans",
		name: "IBM Plex Sans",
		category: "professional",
		googleFamily: "IBM+Plex+Sans:wght@400;500;600;700",
		cssFontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Industrial engineered design capturing human essence",
	},
	{
		id: "public-sans",
		name: "Public Sans",
		category: "professional",
		googleFamily: "Public+Sans:wght@400;500;600;700",
		cssFontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Strong neutral neutrality based on classic Franklin Gothic",
	},

	// ---------------------------------------------------------------------------
	// 4. SOFT & ROUNDED
	// ---------------------------------------------------------------------------
	{
		id: "poppins",
		name: "Poppins",
		category: "rounded",
		googleFamily: "Poppins:wght@400;500;600;700",
		cssFontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Friendly rounded geometric curves with stylish flair",
	},
	{
		id: "nunito-sans",
		name: "Nunito Sans",
		category: "rounded",
		googleFamily: "Nunito+Sans:wght@400;500;600;700",
		cssFontFamily: "'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Well-balanced rounded terminal grace and softness",
	},
	{
		id: "rubik",
		name: "Rubik",
		category: "rounded",
		googleFamily: "Rubik:wght@400;500;600;700",
		cssFontFamily: "'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Subtle rounded corners with confident stout weight",
	},

	// ---------------------------------------------------------------------------
	// 5. EDITORIAL & CREATIVE
	// ---------------------------------------------------------------------------
	{
		id: "space-grotesk",
		name: "Space Grotesk",
		category: "creative",
		googleFamily: "Space+Grotesk:wght@400;500;600;700",
		cssFontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Proportional tech grotesque with idiosyncratic charisma",
	},
	{
		id: "syne",
		name: "Syne",
		category: "creative",
		googleFamily: "Syne:wght@500;600;700;800",
		cssFontFamily: "'Syne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [500, 600, 700, 800],
		previewText: "Avant-garde artistic vision and striking visual impact",
	},
	{
		id: "archivo",
		name: "Archivo",
		category: "creative",
		googleFamily: "Archivo:wght@400;500;600;700",
		cssFontFamily: "'Archivo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Dynamic late nineteenth-century metallic architecture",
	},
	{
		id: "bricolage-grotesque",
		name: "Bricolage Grotesque",
		category: "creative",
		googleFamily: "Bricolage+Grotesque:wght@400;500;600;700",
		cssFontFamily: "'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		weights: [400, 500, 600, 700],
		previewText: "Vibrant expressive synthesis of French and British grotesques",
	},
];

/**
 * Resolves a font preset by its ID, with safe fallback to 'inter'.
 */
export function getFontPreset(fontId?: string | null): FontPreset {
	if (!fontId || typeof fontId !== "string") {
		return FONT_PRESETS[0]; // inter
	}
	const clean = fontId.trim().toLowerCase();
	const found = FONT_PRESETS.find((f) => f.id === clean);
	return found || FONT_PRESETS[0];
}

/**
 * Returns Google Fonts stylesheet URL for the specified font preset.
 */
export function getGoogleFontHref(font: FontPreset): string {
	return `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;
}
