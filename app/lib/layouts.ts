/**
 * MOBIO STUDIO — 20 DISTINCT LAYOUT THEMES REGISTRY (V4)
 *
 * Provides:
 * - 20 Structurally Distinct Layout Presets
 * - Meaningful Composition Variation (Widths, Alignments, Grids, Densities, Framing, and Responsive Split)
 * - Safe Responsive Rules (Zero Mobile Overflow)
 * - Composable Layout Architecture for Home and Studio Preview
 */

export type LinkArrangement =
	| "stack"          // Clean vertical stack
	| "grid-2"         // 2-column grid on >= sm/md
	| "dense-stack"    // High-density vertical stack
	| "capsule-stack"  // Pill-shaped rounded-full cards
	| "minimal-stack"  // Frameless, understated cards
	| "island-stack"   // Floating glass elevation cards
	| "split-desktop"; // Desktop two-column split

export type LayoutAlignment = "center" | "start";

export interface LayoutTheme {
	id: string;
	name: { id: string; en: string };
	tagline: { id: string; en: string };
	description: { id: string; en: string };
	containerMaxWidth: string; // Tailwind class e.g. "max-w-md"
	linkArrangement: LinkArrangement;
	alignment: LayoutAlignment;
	contentGap: string; // Tailwind class e.g. "gap-3 sm:gap-4"
	isSplitDesktop: boolean;
	hasOuterFrame: boolean;
	previewIcon: string;
}

export const LAYOUT_THEMES: LayoutTheme[] = [
	// 1. COMPACT CENTER (Default)
	{
		id: "compact-center",
		name: { id: "Pusat Kompak", en: "Compact Center" },
		tagline: { id: "Kolom ramping simetris", en: "Slim symmetrical column" },
		description: {
			id: "Kolom tengah ramping dengan ritme vertikal padat dan kartu profil terpusat rapi.",
			en: "Slim central column with tight vertical rhythm and neatly centered profile card.",
		},
		containerMaxWidth: "max-w-md",
		linkArrangement: "stack",
		alignment: "center",
		contentGap: "gap-3 sm:gap-4",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-center",
	},

	// 2. MINIMAL STACK
	{
		id: "minimal-stack",
		name: { id: "Tumpukan Minimal", en: "Minimal Stack" },
		tagline: { id: "Sederhana tanpa ornamen", en: "Simple without chrome" },
		description: {
			id: "Kolom ultra-bersih dengan bingkai kartu minimalis dan hirarki berbasis konten murni.",
			en: "Ultra-clean column with minimal card framing and content-first visual hierarchy.",
		},
		containerMaxWidth: "max-w-sm",
		linkArrangement: "minimal-stack",
		alignment: "center",
		contentGap: "gap-2.5 sm:gap-3",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-minimal",
	},

	// 3. FLOATING ISLANDS
	{
		id: "floating-islands",
		name: { id: "Pulau Melayang", en: "Floating Islands" },
		tagline: { id: "Blok konten independen", en: "Independent content blocks" },
		description: {
			id: "Blok konten melayang mandiri dengan elevasi kaca lembut dan pemisahan tegas.",
			en: "Independent floating content blocks with subtle glass elevation and crisp separation.",
		},
		containerMaxWidth: "max-w-md",
		linkArrangement: "island-stack",
		alignment: "center",
		contentGap: "gap-4 sm:gap-5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-islands",
	},

	// 4. EDITORIAL COLUMN
	{
		id: "editorial-column",
		name: { id: "Kolom Editorial", en: "Editorial Column" },
		tagline: { id: "Tipografi asimetris", en: "Asymmetrical typography" },
		description: {
			id: "Tampilan berbasis tipografi majalah dengan perataan kiri asimetris yang berkarakter.",
			en: "Magazine-inspired typographic layout with characterful asymmetrical left alignment.",
		},
		containerMaxWidth: "max-w-lg",
		linkArrangement: "stack",
		alignment: "start",
		contentGap: "gap-3.5 sm:gap-4.5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-editorial",
	},

	// 5. MODERN PORTFOLIO
	{
		id: "modern-portfolio",
		name: { id: "Portofolio Modern", en: "Modern Portfolio" },
		tagline: { id: "Fokus karya & kreasi", en: "Projects & creation focus" },
		description: {
			id: "Komposisi lebar proporsional yang seimbang antara identitas profil dan pameran tautan karya.",
			en: "Proportional wider composition balancing profile identity and work showcase links.",
		},
		containerMaxWidth: "max-w-2xl",
		linkArrangement: "grid-2",
		alignment: "center",
		contentGap: "gap-4 sm:gap-5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-portfolio",
	},

	// 6. SOFT GRID
	{
		id: "soft-grid",
		name: { id: "Kisi Lembut", en: "Soft Grid" },
		tagline: { id: "Kisi dua kolom responsif", en: "Responsive two-column grid" },
		description: {
			id: "Ritme kisi lembut di mana kartu tautan tersusun dua kolom pada layar tablet dan desktop.",
			en: "Gentle grid rhythm where link cards arrange in two columns on tablet and desktop.",
		},
		containerMaxWidth: "max-w-2xl",
		linkArrangement: "grid-2",
		alignment: "center",
		contentGap: "gap-3 sm:gap-4",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-grid",
	},

	// 7. NEO CAPSULE
	{
		id: "neo-capsule",
		name: { id: "Neo Kapsul", en: "Neo Capsule" },
		tagline: { id: "Siluet kapsul membulat", en: "Rounded capsule silhouette" },
		description: {
			id: "Komponen berbentuk kapsul modern dengan tombol membulat penuh dan estetika halus.",
			en: "Modern pill-shaped components with fully rounded buttons and sleek smooth contours.",
		},
		containerMaxWidth: "max-w-md",
		linkArrangement: "capsule-stack",
		alignment: "center",
		contentGap: "gap-3 sm:gap-3.5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-capsule",
	},

	// 8. AIRY MINIMAL
	{
		id: "airy-minimal",
		name: { id: "Minimalis Lapang", en: "Airy Minimal" },
		tagline: { id: "Ruang bernapas lega", en: "Spacious breathing room" },
		description: {
			id: "Tata letak bernapas santai dengan jarak spasial lega tanpa menimbulkan kekosongan berlebih.",
			en: "Relaxed breathing layout with generous spatial rhythm without excessive blank areas.",
		},
		containerMaxWidth: "max-w-md",
		linkArrangement: "stack",
		alignment: "center",
		contentGap: "gap-5 sm:gap-6",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-airy",
	},

	// 9. DENSE COMPACT
	{
		id: "dense-compact",
		name: { id: "Kompak Padat", en: "Dense Compact" },
		tagline: { id: "Efisiensi vertikal tinggi", en: "High vertical efficiency" },
		description: {
			id: "Kerapatan informasi maksimal dengan jarak efisien agar seluruh konten terlihat seketika.",
			en: "Maximum information density with efficient spacing so all content is instantly visible.",
		},
		containerMaxWidth: "max-w-sm",
		linkArrangement: "dense-stack",
		alignment: "center",
		contentGap: "gap-2 sm:gap-2.5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-dense",
	},

	// 10. CINEMATIC FOCUS
	{
		id: "cinematic-focus",
		name: { id: "Fokus Sinematik", en: "Cinematic Focus" },
		tagline: { id: "Nuansa fotografi dramatis", en: "Dramatic photographic tone" },
		description: {
			id: "Penekanan visual kuat pada fotografi sampul dengan atmosfer pencahayaan kontras terlindungi.",
			en: "Strong visual emphasis on cover photography with protected atmospheric contrast lighting.",
		},
		containerMaxWidth: "max-w-lg",
		linkArrangement: "stack",
		alignment: "center",
		contentGap: "gap-4 sm:gap-5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-cinematic",
	},

	// 11. SPLIT COMPOSITION
	{
		id: "split-composition",
		name: { id: "Komposisi Pisah", en: "Split Composition" },
		tagline: { id: "Dua kolom desktop seimbang", en: "Balanced desktop two-column" },
		description: {
			id: "Dua kolom terpisah pada desktop (profil di sisi kiri dan tautan di kanan), runtuh rapi di ponsel.",
			en: "Two-column split on desktop (profile on left and links on right), collapsing neatly on mobile.",
		},
		containerMaxWidth: "max-w-4xl",
		linkArrangement: "split-desktop",
		alignment: "center",
		contentGap: "gap-4 sm:gap-6",
		isSplitDesktop: true,
		hasOuterFrame: false,
		previewIcon: "layout-split",
	},

	// 12. CENTERED SHOWCASE
	{
		id: "centered-showcase",
		name: { id: "Etalase Terpusat", en: "Centered Showcase" },
		tagline: { id: "Penyorotan tautan utama", en: "Featured primary highlight" },
		description: {
			id: "Pendahuluan profil terpusat dengan penekanan khusus pada tautan sorotan paling atas.",
			en: "Centered profile introduction with distinct emphasis on the top featured highlight link.",
		},
		containerMaxWidth: "max-w-md",
		linkArrangement: "stack",
		alignment: "center",
		contentGap: "gap-3.5 sm:gap-4.5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-showcase",
	},

	// 13. SOFT PANELS
	{
		id: "soft-panels",
		name: { id: "Panel Halus", en: "Soft Panels" },
		tagline: { id: "Pengelompokan berbingkai kaca", en: "Glass framed groupings" },
		description: {
			id: "Struktur panel teratur yang menyatukan setiap bagian dalam bingkai kaca sekunder elegan.",
			en: "Structured panel organization unifying each section in an elegant secondary glass frame.",
		},
		containerMaxWidth: "max-w-lg",
		linkArrangement: "stack",
		alignment: "center",
		contentGap: "gap-4 sm:gap-5",
		isSplitDesktop: false,
		hasOuterFrame: true,
		previewIcon: "layout-panels",
	},

	// 14. GLASS ATELIER
	{
		id: "glass-atelier",
		name: { id: "Atelier Kaca", en: "Glass Atelier" },
		tagline: { id: "Lapisan kaca berlapis ganda", en: "Layered specular surfaces" },
		description: {
			id: "Permukaan kaca berlapis transparan dengan batas spekular ganda dan kilau reflektif jernih.",
			en: "Layered translucent glass surfaces with double specular borders and crisp reflective sheen.",
		},
		containerMaxWidth: "max-w-md",
		linkArrangement: "island-stack",
		alignment: "center",
		contentGap: "gap-3.5 sm:gap-4.5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-glass",
	},

	// 15. MODULAR FLOW
	{
		id: "modular-flow",
		name: { id: "Aliran Modular", en: "Modular Flow" },
		tagline: { id: "Ritme kartu modular fleksibel", en: "Flexible modular card rhythm" },
		description: {
			id: "Tata letak modular yang dinamis dengan pemisahan lencana kategori dan ritme kartu adaptif.",
			en: "Dynamic modular layout with distinct category tags and adaptive card rhythm.",
		},
		containerMaxWidth: "max-w-xl",
		linkArrangement: "grid-2",
		alignment: "center",
		contentGap: "gap-3 sm:gap-4",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-modular",
	},

	// 16. FOCUSED IDENTITY
	{
		id: "focused-identity",
		name: { id: "Identitas Utama", en: "Focused Identity" },
		tagline: { id: "Prioritas penuh pada profil", en: "Full priority on profile" },
		description: {
			id: "Prioritas visual penuh pada kartu identitas dan biografi, dengan tautan yang lebih ramping.",
			en: "Full visual priority on identity and bio card, with refined subtle link styling.",
		},
		containerMaxWidth: "max-w-md",
		linkArrangement: "dense-stack",
		alignment: "center",
		contentGap: "gap-3 sm:gap-4",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-identity",
	},

	// 17. CREATOR STUDIO
	{
		id: "creator-studio",
		name: { id: "Studio Kreator", en: "Creator Studio" },
		tagline: { id: "Harmoni media & jejaring", en: "Media & social network balance" },
		description: {
			id: "Format studio kreator konten yang menyeimbangkan profil, kanal media sosial, dan portofolio.",
			en: "Content creator studio format balancing profile, social channels, and portfolio.",
		},
		containerMaxWidth: "max-w-2xl",
		linkArrangement: "grid-2",
		alignment: "center",
		contentGap: "gap-4 sm:gap-5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-creator",
	},

	// 18. HORIZONTAL RHYTHM
	{
		id: "horizontal-rhythm",
		name: { id: "Ritme Horisontal", en: "Horizontal Rhythm" },
		tagline: { id: "Tampilan melebar multi-kolom", en: "Expanded multi-column view" },
		description: {
			id: "Penyajian horisontal luas pada desktop dengan kartu berpasangan dua kolom yang runtuh di ponsel.",
			en: "Expansive horizontal desktop presentation with paired cards collapsing vertically on mobile.",
		},
		containerMaxWidth: "max-w-3xl",
		linkArrangement: "grid-2",
		alignment: "center",
		contentGap: "gap-3.5 sm:gap-4.5",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-horizontal",
	},

	// 19. FLOATING FRAME
	{
		id: "floating-frame",
		name: { id: "Bingkai Melayang", en: "Floating Frame" },
		tagline: { id: "Wadah luar elegan terlindungi", en: "Protected outer glass frame" },
		description: {
			id: "Seluruh konten dibingkai dalam wadah kaca melayang terpadu dengan cincin pembatas spekular.",
			en: "Entire content is framed within a cohesive floating glass container with specular ring.",
		},
		containerMaxWidth: "max-w-lg",
		linkArrangement: "stack",
		alignment: "center",
		contentGap: "gap-3 sm:gap-4",
		isSplitDesktop: false,
		hasOuterFrame: true,
		previewIcon: "layout-frame",
	},

	// 20. SIGNATURE MINIMAL
	{
		id: "signature-minimal",
		name: { id: "Signature Minimalis", en: "Signature Minimal" },
		tagline: { id: "Kemewahan kesederhanaan murni", en: "Luxury of pure simplicity" },
		description: {
			id: "Kesederhanaan mewah tanpa dekorasi berlebihan, mengandalkan presisi tipografi dan ruang negatif.",
			en: "Luxurious simplicity without excessive chrome, relying on typography precision and whitespace.",
		},
		containerMaxWidth: "max-w-sm",
		linkArrangement: "minimal-stack",
		alignment: "center",
		contentGap: "gap-2.5 sm:gap-3",
		isSplitDesktop: false,
		hasOuterFrame: false,
		previewIcon: "layout-signature",
	},
];

/**
 * Resolves a layout theme by its ID, with safe fallback to 'compact-center'.
 */
export function getLayoutTheme(layoutId?: string | null): LayoutTheme {
	if (!layoutId || typeof layoutId !== "string") {
		return LAYOUT_THEMES[0]; // compact-center
	}
	const clean = layoutId.trim().toLowerCase();
	const found = LAYOUT_THEMES.find((l) => l.id === clean);
	return found || LAYOUT_THEMES[0];
}
