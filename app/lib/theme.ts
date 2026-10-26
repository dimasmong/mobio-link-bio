/**
 * MOBIO STUDIO — COMPLETE THEME ENGINE & DESIGN TOKEN ARCHITECTURE (V2)
 *
 * Provides:
 * - 16 Premium Theme Presets (8 Light, 8 Dark) with distinct visual identities
 * - Dynamic Token Generation (Surfaces, Borders, Shadows, Highlights, Text & Accents)
 * - Contrast & Readable Foreground Computation (WCAG Rel. Luminance)
 * - Accent Color Engine with Custom HEX Override & 16 Preset Chips
 * - Pure CSS Variables export for SSR and Live Studio Preview
 */

export type ThemeMode = "light" | "dark";

export interface ThemeTokens {
	// Background mesh
	meshGradient: string;
	fallbackBg: string;
	overlayColor: string;
	overlayOpacity: number;

	// Glass surfaces
	glassSurfacePrimary: string;
	glassSurfaceSecondary: string;
	glassSurfaceInteractive: string;
	glassSurfaceHover: string;
	glassSurfaceNav: string;

	// Glass borders
	glassBorderSpecular: string;
	glassBorderSubtle: string;
	glassBorderHover: string;

	// Glass shadows & highlights
	glassShadowPrimary: string;
	glassShadowCard: string;
	glassShadowHover: string;
	glassHighlightTop: string;
	glassHighlightBottom: string;

	// Text tokens
	textPrimary: string;
	textSecondary: string;
	textMuted: string;

	// Default preset accent
	defaultAccent: string;

	// Default glass optical properties
	glassBlur: string;
	glassOpacity: number;
	glassRadius: string;
}

export interface ThemePreset {
	id: string;
	name: { id: string; en: string };
	mode: ThemeMode;
	description: { id: string; en: string };
	previewGradient: string;
	tokens: ThemeTokens;
}

export interface AccentColorPreset {
	id: string;
	name: { id: string; en: string };
	hex: string;
}

// -----------------------------------------------------------------------------
// 1. 16 ACCENT COLOR PRESETS
// -----------------------------------------------------------------------------
export const ACCENT_PRESETS: AccentColorPreset[] = [
	{ id: "purple", name: { id: "Ungu", en: "Purple" }, hex: "#8b5cf6" },
	{ id: "violet", name: { id: "Violet", en: "Violet" }, hex: "#7c3aed" },
	{ id: "blue", name: { id: "Biru", en: "Blue" }, hex: "#2563eb" },
	{ id: "cyan", name: { id: "Sian", en: "Cyan" }, hex: "#06b6d4" },
	{ id: "teal", name: { id: "Teal", en: "Teal" }, hex: "#0d9488" },
	{ id: "emerald", name: { id: "Zamrud", en: "Emerald" }, hex: "#10b981" },
	{ id: "mint", name: { id: "Mint", en: "Mint" }, hex: "#059669" },
	{ id: "green", name: { id: "Hijau", en: "Green" }, hex: "#16a34a" },
	{ id: "yellow", name: { id: "Kuning", en: "Yellow" }, hex: "#eab308" },
	{ id: "amber", name: { id: "Amber", en: "Amber" }, hex: "#d97706" },
	{ id: "orange", name: { id: "Oranye", en: "Orange" }, hex: "#ea580c" },
	{ id: "coral", name: { id: "Koral", en: "Coral" }, hex: "#f97316" },
	{ id: "pink", name: { id: "Merah Muda", en: "Pink" }, hex: "#ec4899" },
	{ id: "rose", name: { id: "Mawar", en: "Rose" }, hex: "#f43f5e" },
	{ id: "red", name: { id: "Merah", en: "Red" }, hex: "#ef4444" },
	{ id: "silver", name: { id: "Perak", en: "Silver" }, hex: "#94a3b8" },
];

// -----------------------------------------------------------------------------
// 2. 16 PREMIUM THEME PRESETS (8 LIGHT, 8 DARK)
// -----------------------------------------------------------------------------
export const THEME_PRESETS: ThemePreset[] = [
	// =========================================================================
	// LIGHT THEMES (1 - 8)
	// =========================================================================
	{
		id: "frost-aurora",
		name: { id: "Frost Aurora", en: "Frost Aurora" },
		mode: "light",
		description: { id: "Kaca lavender es dengan kilau violet lembut", en: "Icy lavender glass with gentle violet glow" },
		previewGradient: "from-violet-200 via-sky-100 to-pink-200",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(224, 242, 254, 0.8) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(252, 231, 243, 0.75) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(237, 233, 254, 0.85) 0%, transparent 55%),
				radial-gradient(circle at 20% 85%, rgba(245, 243, 255, 0.8) 0%, transparent 50%),
				radial-gradient(circle at 80% 80%, rgba(224, 242, 254, 0.7) 0%, transparent 45%),
				#f8fafc`,
			fallbackBg: "#f8fafc",
			overlayColor: "rgba(248, 250, 252, 0.45)",
			overlayOpacity: 0.45,
			glassSurfacePrimary: "rgba(255, 255, 255, 0.72)",
			glassSurfaceSecondary: "rgba(255, 255, 255, 0.58)",
			glassSurfaceInteractive: "rgba(255, 255, 255, 0.65)",
			glassSurfaceHover: "rgba(255, 255, 255, 0.90)",
			glassSurfaceNav: "rgba(255, 255, 255, 0.78)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.85)",
			glassBorderSubtle: "rgba(255, 255, 255, 0.55)",
			glassBorderHover: "rgba(167, 139, 250, 0.65)",
			glassShadowPrimary: "0 20px 48px -12px rgba(124, 58, 237, 0.10), 0 8px 16px -4px rgba(15, 23, 42, 0.04)",
			glassShadowCard: "0 10px 28px -8px rgba(15, 23, 42, 0.05), 0 4px 10px -2px rgba(15, 23, 42, 0.02)",
			glassShadowHover: "0 18px 36px -10px rgba(124, 58, 237, 0.16), 0 6px 16px -3px rgba(15, 23, 42, 0.04)",
			glassHighlightTop: "inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(255, 255, 255, 0.30)",
			textPrimary: "#0f172a",
			textSecondary: "#475569",
			textMuted: "#64748b",
			defaultAccent: "#8b5cf6",
			glassBlur: "16px",
			glassOpacity: 0.72,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "arctic-frost",
		name: { id: "Arctic Frost", en: "Arctic Frost" },
		mode: "light",
		description: { id: "Gletser putih murni dengan aksen biru kutub kristal", en: "Glacier white & crystalline polar blue" },
		previewGradient: "from-sky-200 via-blue-50 to-cyan-100",
		tokens: {
			meshGradient: `radial-gradient(circle at 10% 20%, rgba(186, 230, 253, 0.85) 0%, transparent 45%),
				radial-gradient(circle at 90% 15%, rgba(207, 250, 254, 0.80) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(240, 249, 255, 0.90) 0%, transparent 60%),
				radial-gradient(circle at 25% 85%, rgba(224, 242, 254, 0.80) 0%, transparent 45%),
				radial-gradient(circle at 80% 85%, rgba(186, 230, 253, 0.75) 0%, transparent 45%),
				#f0f9ff`,
			fallbackBg: "#f0f9ff",
			overlayColor: "rgba(240, 249, 255, 0.40)",
			overlayOpacity: 0.40,
			glassSurfacePrimary: "rgba(255, 255, 255, 0.78)",
			glassSurfaceSecondary: "rgba(255, 255, 255, 0.62)",
			glassSurfaceInteractive: "rgba(255, 255, 255, 0.70)",
			glassSurfaceHover: "rgba(255, 255, 255, 0.94)",
			glassSurfaceNav: "rgba(255, 255, 255, 0.82)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.92)",
			glassBorderSubtle: "rgba(186, 230, 253, 0.60)",
			glassBorderHover: "rgba(56, 189, 248, 0.75)",
			glassShadowPrimary: "0 20px 48px -12px rgba(14, 165, 233, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.04)",
			glassShadowCard: "0 10px 28px -8px rgba(14, 165, 233, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.02)",
			glassShadowHover: "0 18px 36px -10px rgba(14, 165, 233, 0.20), 0 6px 16px -3px rgba(15, 23, 42, 0.04)",
			glassHighlightTop: "inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.98)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(186, 230, 253, 0.40)",
			textPrimary: "#0c4a6e",
			textSecondary: "#0369a1",
			textMuted: "#0284c7",
			defaultAccent: "#0284c7",
			glassBlur: "18px",
			glassOpacity: 0.78,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "pearl-white",
		name: { id: "Pearl White", en: "Pearl White" },
		mode: "light",
		description: { id: "Gading hangat elegan dengan pantulan mutiara mewah", en: "Elegant warm ivory with subtle pearlescent sheen" },
		previewGradient: "from-amber-100 via-stone-50 to-orange-100",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 15%, rgba(254, 243, 199, 0.75) 0%, transparent 45%),
				radial-gradient(circle at 85% 20%, rgba(254, 249, 195, 0.70) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(250, 250, 249, 0.90) 0%, transparent 60%),
				radial-gradient(circle at 20% 85%, rgba(254, 243, 199, 0.70) 0%, transparent 45%),
				#fafaf9`,
			fallbackBg: "#fafaf9",
			overlayColor: "rgba(250, 250, 249, 0.50)",
			overlayOpacity: 0.50,
			glassSurfacePrimary: "rgba(255, 255, 255, 0.80)",
			glassSurfaceSecondary: "rgba(255, 255, 255, 0.65)",
			glassSurfaceInteractive: "rgba(255, 255, 255, 0.72)",
			glassSurfaceHover: "rgba(255, 255, 255, 0.96)",
			glassSurfaceNav: "rgba(255, 255, 255, 0.85)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.95)",
			glassBorderSubtle: "rgba(231, 229, 228, 0.70)",
			glassBorderHover: "rgba(217, 119, 6, 0.60)",
			glassShadowPrimary: "0 20px 48px -12px rgba(120, 113, 108, 0.10), 0 8px 16px -4px rgba(28, 25, 23, 0.04)",
			glassShadowCard: "0 10px 28px -8px rgba(120, 113, 108, 0.06), 0 4px 10px -2px rgba(28, 25, 23, 0.02)",
			glassShadowHover: "0 18px 36px -10px rgba(180, 83, 9, 0.15), 0 6px 16px -3px rgba(28, 25, 23, 0.04)",
			glassHighlightTop: "inset 0 1.5px 1px 0 rgba(255, 255, 255, 1)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(245, 245, 244, 0.50)",
			textPrimary: "#1c1917",
			textSecondary: "#44403c",
			textMuted: "#78716c",
			defaultAccent: "#d97706",
			glassBlur: "16px",
			glassOpacity: 0.80,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "rose-quartz",
		name: { id: "Rose Quartz", en: "Rose Quartz" },
		mode: "light",
		description: { id: "Kaca merah muda lembut dengan nuansa blush hangat", en: "Soft pink crystal with warm blushing glass" },
		previewGradient: "from-pink-200 via-rose-50 to-pink-100",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(252, 231, 243, 0.85) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(255, 228, 230, 0.80) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(253, 242, 248, 0.90) 0%, transparent 55%),
				radial-gradient(circle at 20% 85%, rgba(251, 207, 232, 0.75) 0%, transparent 45%),
				#fdf2f8`,
			fallbackBg: "#fdf2f8",
			overlayColor: "rgba(253, 242, 248, 0.45)",
			overlayOpacity: 0.45,
			glassSurfacePrimary: "rgba(255, 255, 255, 0.75)",
			glassSurfaceSecondary: "rgba(255, 255, 255, 0.60)",
			glassSurfaceInteractive: "rgba(255, 255, 255, 0.68)",
			glassSurfaceHover: "rgba(255, 255, 255, 0.92)",
			glassSurfaceNav: "rgba(255, 255, 255, 0.80)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.90)",
			glassBorderSubtle: "rgba(244, 114, 182, 0.35)",
			glassBorderHover: "rgba(236, 72, 153, 0.65)",
			glassShadowPrimary: "0 20px 48px -12px rgba(236, 72, 153, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.04)",
			glassShadowCard: "0 10px 28px -8px rgba(236, 72, 153, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.02)",
			glassShadowHover: "0 18px 36px -10px rgba(236, 72, 153, 0.20), 0 6px 16px -3px rgba(15, 23, 42, 0.04)",
			glassHighlightTop: "inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(251, 207, 232, 0.35)",
			textPrimary: "#831843",
			textSecondary: "#9d174d",
			textMuted: "#be185d",
			defaultAccent: "#ec4899",
			glassBlur: "16px",
			glassOpacity: 0.75,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "sakura-bloom",
		name: { id: "Sakura Bloom", en: "Sakura Bloom" },
		mode: "light",
		description: { id: "Bunga sakura mekar dengan gradasi krem lembut", en: "Cherry blossom petals with soft cream gradients" },
		previewGradient: "from-pink-300 via-rose-100 to-amber-100",
		tokens: {
			meshGradient: `radial-gradient(circle at 10% 25%, rgba(244, 114, 182, 0.70) 0%, transparent 45%),
				radial-gradient(circle at 85% 20%, rgba(254, 215, 170, 0.65) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(255, 241, 242, 0.85) 0%, transparent 55%),
				radial-gradient(circle at 25% 80%, rgba(251, 207, 232, 0.70) 0%, transparent 45%),
				#fff1f2`,
			fallbackBg: "#fff1f2",
			overlayColor: "rgba(255, 241, 242, 0.45)",
			overlayOpacity: 0.45,
			glassSurfacePrimary: "rgba(255, 255, 255, 0.76)",
			glassSurfaceSecondary: "rgba(255, 255, 255, 0.62)",
			glassSurfaceInteractive: "rgba(255, 255, 255, 0.70)",
			glassSurfaceHover: "rgba(255, 255, 255, 0.94)",
			glassSurfaceNav: "rgba(255, 255, 255, 0.82)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.92)",
			glassBorderSubtle: "rgba(251, 113, 133, 0.35)",
			glassBorderHover: "rgba(244, 63, 94, 0.70)",
			glassShadowPrimary: "0 20px 48px -12px rgba(244, 63, 94, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.04)",
			glassShadowCard: "0 10px 28px -8px rgba(244, 63, 94, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.02)",
			glassShadowHover: "0 18px 36px -10px rgba(244, 63, 94, 0.20), 0 6px 16px -3px rgba(15, 23, 42, 0.04)",
			glassHighlightTop: "inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(254, 205, 211, 0.40)",
			textPrimary: "#881337",
			textSecondary: "#9f1239",
			textMuted: "#be123c",
			defaultAccent: "#f43f5e",
			glassBlur: "16px",
			glassOpacity: 0.76,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "ocean-breeze",
		name: { id: "Ocean Breeze", en: "Ocean Breeze" },
		mode: "light",
		description: { id: "Hembusan laut pirus segar dan langit cerah (Sky Aurora)", en: "Fresh turquoise sea breeze and clear cyan sky" },
		previewGradient: "from-cyan-200 via-sky-100 to-teal-100",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(165, 243, 252, 0.85) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(153, 246, 228, 0.80) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(207, 250, 254, 0.85) 0%, transparent 55%),
				radial-gradient(circle at 20% 85%, rgba(186, 230, 253, 0.80) 0%, transparent 45%),
				#ecfeff`,
			fallbackBg: "#ecfeff",
			overlayColor: "rgba(236, 254, 255, 0.45)",
			overlayOpacity: 0.45,
			glassSurfacePrimary: "rgba(255, 255, 255, 0.74)",
			glassSurfaceSecondary: "rgba(255, 255, 255, 0.60)",
			glassSurfaceInteractive: "rgba(255, 255, 255, 0.68)",
			glassSurfaceHover: "rgba(255, 255, 255, 0.92)",
			glassSurfaceNav: "rgba(255, 255, 255, 0.80)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.90)",
			glassBorderSubtle: "rgba(103, 232, 249, 0.50)",
			glassBorderHover: "rgba(6, 182, 212, 0.75)",
			glassShadowPrimary: "0 20px 48px -12px rgba(6, 182, 212, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.04)",
			glassShadowCard: "0 10px 28px -8px rgba(6, 182, 212, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.02)",
			glassShadowHover: "0 18px 36px -10px rgba(6, 182, 212, 0.20), 0 6px 16px -3px rgba(15, 23, 42, 0.04)",
			glassHighlightTop: "inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(165, 243, 252, 0.40)",
			textPrimary: "#155e75",
			textSecondary: "#0e7490",
			textMuted: "#0891b2",
			defaultAccent: "#06b6d4",
			glassBlur: "16px",
			glassOpacity: 0.74,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "mint-serenity",
		name: { id: "Mint Serenity", en: "Mint Serenity" },
		mode: "light",
		description: { id: "Ketenangan daun mint hijau dengan kaca bening", en: "Tranquil spearmint leaves with crystal clear glass" },
		previewGradient: "from-emerald-200 via-teal-50 to-green-100",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(167, 243, 208, 0.80) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(209, 250, 229, 0.75) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(236, 253, 245, 0.90) 0%, transparent 55%),
				radial-gradient(circle at 20% 85%, rgba(167, 243, 208, 0.75) 0%, transparent 45%),
				#ecfdf5`,
			fallbackBg: "#ecfdf5",
			overlayColor: "rgba(236, 253, 245, 0.45)",
			overlayOpacity: 0.45,
			glassSurfacePrimary: "rgba(255, 255, 255, 0.75)",
			glassSurfaceSecondary: "rgba(255, 255, 255, 0.60)",
			glassSurfaceInteractive: "rgba(255, 255, 255, 0.68)",
			glassSurfaceHover: "rgba(255, 255, 255, 0.92)",
			glassSurfaceNav: "rgba(255, 255, 255, 0.80)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.90)",
			glassBorderSubtle: "rgba(110, 231, 183, 0.50)",
			glassBorderHover: "rgba(16, 185, 129, 0.75)",
			glassShadowPrimary: "0 20px 48px -12px rgba(16, 185, 129, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.04)",
			glassShadowCard: "0 10px 28px -8px rgba(16, 185, 129, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.02)",
			glassShadowHover: "0 18px 36px -10px rgba(16, 185, 129, 0.20), 0 6px 16px -3px rgba(15, 23, 42, 0.04)",
			glassHighlightTop: "inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(167, 243, 208, 0.40)",
			textPrimary: "#064e3b",
			textSecondary: "#065f46",
			textMuted: "#047857",
			defaultAccent: "#10b981",
			glassBlur: "16px",
			glassOpacity: 0.75,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "golden-hour",
		name: { id: "Golden Hour", en: "Golden Hour" },
		mode: "light",
		description: { id: "Cahaya matahari terbenam dengan sampanye keemasan", en: "Warm twilight champagne with rich golden amber" },
		previewGradient: "from-amber-300 via-yellow-100 to-orange-200",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(253, 230, 138, 0.85) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(254, 215, 170, 0.80) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.85) 0%, transparent 55%),
				radial-gradient(circle at 20% 85%, rgba(253, 230, 138, 0.75) 0%, transparent 45%),
				#fef3c7`,
			fallbackBg: "#fef3c7",
			overlayColor: "rgba(254, 243, 199, 0.45)",
			overlayOpacity: 0.45,
			glassSurfacePrimary: "rgba(255, 255, 255, 0.78)",
			glassSurfaceSecondary: "rgba(255, 255, 255, 0.62)",
			glassSurfaceInteractive: "rgba(255, 255, 255, 0.70)",
			glassSurfaceHover: "rgba(255, 255, 255, 0.94)",
			glassSurfaceNav: "rgba(255, 255, 255, 0.82)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.95)",
			glassBorderSubtle: "rgba(245, 158, 11, 0.40)",
			glassBorderHover: "rgba(217, 119, 6, 0.75)",
			glassShadowPrimary: "0 20px 48px -12px rgba(217, 119, 6, 0.15), 0 8px 16px -4px rgba(15, 23, 42, 0.04)",
			glassShadowCard: "0 10px 28px -8px rgba(217, 119, 6, 0.07), 0 4px 10px -2px rgba(15, 23, 42, 0.02)",
			glassShadowHover: "0 18px 36px -10px rgba(217, 119, 6, 0.22), 0 6px 16px -3px rgba(15, 23, 42, 0.04)",
			glassHighlightTop: "inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.98)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(253, 230, 138, 0.40)",
			textPrimary: "#78350f",
			textSecondary: "#92400e",
			textMuted: "#b45309",
			defaultAccent: "#f59e0b",
			glassBlur: "16px",
			glassOpacity: 0.78,
			glassRadius: "1.5rem",
		},
	},

	// =========================================================================
	// DARK THEMES (9 - 16)
	// =========================================================================
	{
		id: "dark-liquid",
		name: { id: "Dark Liquid", en: "Dark Liquid" },
		mode: "dark",
		description: { id: "Batu obsidian dan kaca hitam pekat beraura violet", en: "Obsidian slate and deep glass with subtle violet aura" },
		previewGradient: "from-slate-950 via-slate-900 to-violet-950",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(30, 27, 75, 0.70) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(88, 28, 135, 0.60) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.95) 0%, transparent 60%),
				radial-gradient(circle at 20% 85%, rgba(49, 46, 129, 0.65) 0%, transparent 45%),
				#090d16`,
			fallbackBg: "#090d16",
			overlayColor: "rgba(9, 13, 22, 0.65)",
			overlayOpacity: 0.65,
			glassSurfacePrimary: "rgba(15, 23, 42, 0.75)",
			glassSurfaceSecondary: "rgba(30, 41, 59, 0.65)",
			glassSurfaceInteractive: "rgba(30, 41, 59, 0.68)",
			glassSurfaceHover: "rgba(51, 65, 85, 0.85)",
			glassSurfaceNav: "rgba(15, 23, 42, 0.85)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.20)",
			glassBorderSubtle: "rgba(255, 255, 255, 0.12)",
			glassBorderHover: "rgba(167, 139, 250, 0.60)",
			glassShadowPrimary: "0 24px 52px -12px rgba(0, 0, 0, 0.65), 0 8px 20px -4px rgba(0, 0, 0, 0.40)",
			glassShadowCard: "0 12px 30px -8px rgba(0, 0, 0, 0.50)",
			glassShadowHover: "0 20px 40px -10px rgba(124, 58, 237, 0.35)",
			glassHighlightTop: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(0, 0, 0, 0.45)",
			textPrimary: "#f8fafc",
			textSecondary: "#cbd5e1",
			textMuted: "#94a3b8",
			defaultAccent: "#a78bfa",
			glassBlur: "20px",
			glassOpacity: 0.85,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "midnight-blue",
		name: { id: "Midnight Blue", en: "Midnight Blue" },
		mode: "dark",
		description: { id: "Malam samudra dalam dengan kilau neon cyan cerah", en: "Deep oceanic midnight with luminous cyan accents" },
		previewGradient: "from-blue-950 via-slate-950 to-cyan-950",
		tokens: {
			meshGradient: `radial-gradient(circle at 10% 20%, rgba(30, 58, 138, 0.70) 0%, transparent 45%),
				radial-gradient(circle at 90% 15%, rgba(6, 78, 119, 0.65) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(2, 6, 23, 0.95) 0%, transparent 60%),
				radial-gradient(circle at 25% 85%, rgba(15, 23, 42, 0.85) 0%, transparent 45%),
				#020617`,
			fallbackBg: "#020617",
			overlayColor: "rgba(2, 6, 23, 0.70)",
			overlayOpacity: 0.70,
			glassSurfacePrimary: "rgba(15, 23, 42, 0.80)",
			glassSurfaceSecondary: "rgba(30, 58, 138, 0.35)",
			glassSurfaceInteractive: "rgba(15, 23, 42, 0.75)",
			glassSurfaceHover: "rgba(30, 41, 59, 0.90)",
			glassSurfaceNav: "rgba(2, 6, 23, 0.88)",
			glassBorderSpecular: "rgba(56, 189, 248, 0.35)",
			glassBorderSubtle: "rgba(56, 189, 248, 0.15)",
			glassBorderHover: "rgba(56, 189, 248, 0.75)",
			glassShadowPrimary: "0 24px 52px -12px rgba(2, 6, 23, 0.80), 0 8px 20px -4px rgba(6, 182, 212, 0.15)",
			glassShadowCard: "0 12px 30px -8px rgba(2, 6, 23, 0.60)",
			glassShadowHover: "0 20px 40px -10px rgba(6, 182, 212, 0.35)",
			glassHighlightTop: "inset 0 1px 1px 0 rgba(186, 230, 253, 0.30)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(0, 0, 0, 0.60)",
			textPrimary: "#f0f9ff",
			textSecondary: "#bae6fd",
			textMuted: "#7dd3fc",
			defaultAccent: "#38bdf8",
			glassBlur: "20px",
			glassOpacity: 0.82,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "amoled-black",
		name: { id: "AMOLED Black", en: "AMOLED Black" },
		mode: "dark",
		description: { id: "Hitam absolut murni hemat daya dengan garis specular presisi", en: "Pure true black (#000000) with ultra-precise specular rim" },
		previewGradient: "from-black via-zinc-950 to-neutral-900",
		tokens: {
			meshGradient: `radial-gradient(circle at 50% 20%, rgba(24, 24, 27, 0.50) 0%, transparent 45%),
				radial-gradient(circle at 50% 80%, rgba(9, 9, 11, 0.80) 0%, transparent 60%),
				#000000`,
			fallbackBg: "#000000",
			overlayColor: "rgba(0, 0, 0, 0.75)",
			overlayOpacity: 0.75,
			glassSurfacePrimary: "rgba(10, 10, 12, 0.90)",
			glassSurfaceSecondary: "rgba(18, 18, 20, 0.85)",
			glassSurfaceInteractive: "rgba(15, 15, 18, 0.88)",
			glassSurfaceHover: "rgba(28, 28, 32, 0.96)",
			glassSurfaceNav: "rgba(8, 8, 10, 0.92)",
			glassBorderSpecular: "rgba(255, 255, 255, 0.22)",
			glassBorderSubtle: "rgba(255, 255, 255, 0.10)",
			glassBorderHover: "rgba(255, 255, 255, 0.50)",
			glassShadowPrimary: "0 24px 60px -12px rgba(0, 0, 0, 0.95)",
			glassShadowCard: "0 12px 30px -8px rgba(0, 0, 0, 0.80)",
			glassShadowHover: "0 20px 40px -10px rgba(255, 255, 255, 0.15)",
			glassHighlightTop: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(0, 0, 0, 0.80)",
			textPrimary: "#ffffff",
			textSecondary: "#e4e4e7",
			textMuted: "#a1a1aa",
			defaultAccent: "#ffffff",
			glassBlur: "24px",
			glassOpacity: 0.92,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "cosmic-violet",
		name: { id: "Cosmic Violet", en: "Cosmic Violet" },
		mode: "dark",
		description: { id: "Ruang angkasa nebula ungu tua dan kilauan neon ultraviolet", en: "Deep cosmic nebula with electric ultraviolet highlights" },
		previewGradient: "from-purple-950 via-slate-950 to-fuchsia-950",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(126, 34, 206, 0.70) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(192, 38, 211, 0.65) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.90) 0%, transparent 60%),
				radial-gradient(circle at 20% 85%, rgba(88, 28, 135, 0.75) 0%, transparent 45%),
				#0c0714`,
			fallbackBg: "#0c0714",
			overlayColor: "rgba(12, 7, 20, 0.68)",
			overlayOpacity: 0.68,
			glassSurfacePrimary: "rgba(24, 15, 41, 0.80)",
			glassSurfaceSecondary: "rgba(46, 16, 77, 0.55)",
			glassSurfaceInteractive: "rgba(35, 18, 60, 0.75)",
			glassSurfaceHover: "rgba(58, 24, 98, 0.90)",
			glassSurfaceNav: "rgba(19, 10, 34, 0.88)",
			glassBorderSpecular: "rgba(232, 121, 249, 0.40)",
			glassBorderSubtle: "rgba(192, 38, 211, 0.20)",
			glassBorderHover: "rgba(217, 70, 239, 0.80)",
			glassShadowPrimary: "0 24px 52px -12px rgba(112, 26, 117, 0.40), 0 8px 20px -4px rgba(0, 0, 0, 0.50)",
			glassShadowCard: "0 12px 30px -8px rgba(112, 26, 117, 0.25)",
			glassShadowHover: "0 20px 40px -10px rgba(192, 38, 211, 0.50)",
			glassHighlightTop: "inset 0 1px 1px 0 rgba(245, 208, 254, 0.35)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(0, 0, 0, 0.60)",
			textPrimary: "#faf5ff",
			textSecondary: "#e9d5ff",
			textMuted: "#c084fc",
			defaultAccent: "#c084fc",
			glassBlur: "20px",
			glassOpacity: 0.84,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "emerald-night",
		name: { id: "Emerald Night", en: "Emerald Night" },
		mode: "dark",
		description: { id: "Hutan pinus malam gelap dengan cahaya batu zamrud", en: "Deep boreal night with radiant emerald gemstone luminescence" },
		previewGradient: "from-emerald-950 via-slate-950 to-teal-950",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(6, 78, 59, 0.75) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(19, 78, 74, 0.65) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(2, 44, 34, 0.85) 0%, transparent 60%),
				radial-gradient(circle at 20% 85%, rgba(4, 120, 87, 0.50) 0%, transparent 45%),
				#021d17`,
			fallbackBg: "#021d17",
			overlayColor: "rgba(2, 29, 23, 0.70)",
			overlayOpacity: 0.70,
			glassSurfacePrimary: "rgba(4, 35, 28, 0.80)",
			glassSurfaceSecondary: "rgba(6, 78, 59, 0.45)",
			glassSurfaceInteractive: "rgba(6, 44, 35, 0.75)",
			glassSurfaceHover: "rgba(6, 78, 59, 0.85)",
			glassSurfaceNav: "rgba(2, 29, 23, 0.88)",
			glassBorderSpecular: "rgba(52, 211, 153, 0.35)",
			glassBorderSubtle: "rgba(52, 211, 153, 0.15)",
			glassBorderHover: "rgba(52, 211, 153, 0.75)",
			glassShadowPrimary: "0 24px 52px -12px rgba(6, 78, 59, 0.45), 0 8px 20px -4px rgba(0, 0, 0, 0.50)",
			glassShadowCard: "0 12px 30px -8px rgba(6, 78, 59, 0.25)",
			glassShadowHover: "0 20px 40px -10px rgba(16, 185, 129, 0.45)",
			glassHighlightTop: "inset 0 1px 1px 0 rgba(167, 243, 208, 0.30)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(0, 0, 0, 0.60)",
			textPrimary: "#ecfdf5",
			textSecondary: "#a7f3d0",
			textMuted: "#6ee7b7",
			defaultAccent: "#10b981",
			glassBlur: "20px",
			glassOpacity: 0.82,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "crimson-noir",
		name: { id: "Crimson Noir", en: "Crimson Noir" },
		mode: "dark",
		description: { id: "Hitam jelaga dramatis dengan api merah delima", en: "Dramatic charcoal noir with glowing ruby crimson embers" },
		previewGradient: "from-rose-950 via-zinc-950 to-red-950",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(136, 19, 55, 0.75) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(159, 18, 57, 0.65) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(24, 24, 27, 0.90) 0%, transparent 60%),
				radial-gradient(circle at 20% 85%, rgba(190, 18, 60, 0.55) 0%, transparent 45%),
				#110508`,
			fallbackBg: "#110508",
			overlayColor: "rgba(17, 5, 8, 0.70)",
			overlayOpacity: 0.70,
			glassSurfacePrimary: "rgba(33, 11, 16, 0.82)",
			glassSurfaceSecondary: "rgba(76, 14, 28, 0.50)",
			glassSurfaceInteractive: "rgba(42, 14, 21, 0.78)",
			glassSurfaceHover: "rgba(76, 14, 28, 0.88)",
			glassSurfaceNav: "rgba(22, 6, 10, 0.90)",
			glassBorderSpecular: "rgba(251, 113, 133, 0.40)",
			glassBorderSubtle: "rgba(244, 63, 94, 0.20)",
			glassBorderHover: "rgba(244, 63, 94, 0.80)",
			glassShadowPrimary: "0 24px 52px -12px rgba(159, 18, 57, 0.45), 0 8px 20px -4px rgba(0, 0, 0, 0.50)",
			glassShadowCard: "0 12px 30px -8px rgba(159, 18, 57, 0.25)",
			glassShadowHover: "0 20px 40px -10px rgba(244, 63, 94, 0.50)",
			glassHighlightTop: "inset 0 1px 1px 0 rgba(254, 205, 211, 0.35)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(0, 0, 0, 0.60)",
			textPrimary: "#fff1f2",
			textSecondary: "#fecdd3",
			textMuted: "#fda4af",
			defaultAccent: "#f43f5e",
			glassBlur: "20px",
			glassOpacity: 0.84,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "graphite-silver",
		name: { id: "Graphite Silver", en: "Graphite Silver" },
		mode: "dark",
		description: { id: "Baja arang metalik dengan aksen perak berkilau", en: "Metallic charcoal steel with luminous chrome silver sheen" },
		previewGradient: "from-zinc-900 via-slate-900 to-stone-900",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(63, 63, 70, 0.60) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(82, 82, 91, 0.55) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(24, 24, 27, 0.95) 0%, transparent 60%),
				radial-gradient(circle at 20% 85%, rgba(39, 39, 42, 0.70) 0%, transparent 45%),
				#121215`,
			fallbackBg: "#121215",
			overlayColor: "rgba(18, 18, 21, 0.68)",
			overlayOpacity: 0.68,
			glassSurfacePrimary: "rgba(30, 30, 36, 0.80)",
			glassSurfaceSecondary: "rgba(45, 45, 54, 0.65)",
			glassSurfaceInteractive: "rgba(36, 36, 44, 0.75)",
			glassSurfaceHover: "rgba(60, 60, 72, 0.88)",
			glassSurfaceNav: "rgba(22, 22, 26, 0.88)",
			glassBorderSpecular: "rgba(228, 228, 231, 0.35)",
			glassBorderSubtle: "rgba(161, 161, 170, 0.18)",
			glassBorderHover: "rgba(212, 212, 216, 0.75)",
			glassShadowPrimary: "0 24px 52px -12px rgba(0, 0, 0, 0.70), 0 8px 20px -4px rgba(0, 0, 0, 0.40)",
			glassShadowCard: "0 12px 30px -8px rgba(0, 0, 0, 0.50)",
			glassShadowHover: "0 20px 40px -10px rgba(161, 161, 170, 0.30)",
			glassHighlightTop: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.30)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(0, 0, 0, 0.50)",
			textPrimary: "#f4f4f5",
			textSecondary: "#d4d4d8",
			textMuted: "#a1a1aa",
			defaultAccent: "#e4e4e7",
			glassBlur: "20px",
			glassOpacity: 0.82,
			glassRadius: "1.5rem",
		},
	},
	{
		id: "sunset-noir",
		name: { id: "Sunset Noir", en: "Sunset Noir" },
		mode: "dark",
		description: { id: "Langit senja lembayung dengan kobaran oranye tembaga", en: "Moody twilight plum sky with warm fiery sunset amber" },
		previewGradient: "from-purple-950 via-slate-950 to-orange-950",
		tokens: {
			meshGradient: `radial-gradient(circle at 15% 20%, rgba(88, 28, 135, 0.75) 0%, transparent 45%),
				radial-gradient(circle at 85% 25%, rgba(194, 65, 12, 0.65) 0%, transparent 50%),
				radial-gradient(circle at 50% 50%, rgba(15, 10, 24, 0.95) 0%, transparent 60%),
				radial-gradient(circle at 20% 85%, rgba(234, 88, 12, 0.55) 0%, transparent 45%),
				#0e0717`,
			fallbackBg: "#0e0717",
			overlayColor: "rgba(14, 7, 23, 0.68)",
			overlayOpacity: 0.68,
			glassSurfacePrimary: "rgba(28, 14, 40, 0.82)",
			glassSurfaceSecondary: "rgba(67, 20, 50, 0.55)",
			glassSurfaceInteractive: "rgba(38, 18, 52, 0.76)",
			glassSurfaceHover: "rgba(75, 26, 68, 0.90)",
			glassSurfaceNav: "rgba(20, 8, 30, 0.88)",
			glassBorderSpecular: "rgba(251, 146, 60, 0.40)",
			glassBorderSubtle: "rgba(234, 88, 12, 0.22)",
			glassBorderHover: "rgba(249, 115, 22, 0.80)",
			glassShadowPrimary: "0 24px 52px -12px rgba(194, 65, 12, 0.35), 0 8px 20px -4px rgba(0, 0, 0, 0.50)",
			glassShadowCard: "0 12px 30px -8px rgba(194, 65, 12, 0.20)",
			glassShadowHover: "0 20px 40px -10px rgba(249, 115, 22, 0.45)",
			glassHighlightTop: "inset 0 1px 1px 0 rgba(254, 215, 170, 0.35)",
			glassHighlightBottom: "inset 0 -1px 1px 0 rgba(0, 0, 0, 0.60)",
			textPrimary: "#fff7ed",
			textSecondary: "#fed7aa",
			textMuted: "#fdba74",
			defaultAccent: "#f97316",
			glassBlur: "20px",
			glassOpacity: 0.84,
			glassRadius: "1.5rem",
		},
	},
];

// -----------------------------------------------------------------------------
// 3. COLOR & CONTRAST UTILITIES
// -----------------------------------------------------------------------------

/**
 * Converts a 3-, 6-, or 8-digit HEX to normalized {r, g, b, a}
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
	let clean = hex.replace("#", "").trim();
	if (clean.length === 3) {
		clean = clean
			.split("")
			.map((c) => c + c)
			.join("");
	}
	if (clean.length === 6) {
		const num = parseInt(clean, 16);
		return {
			r: (num >> 16) & 255,
			g: (num >> 8) & 255,
			b: num & 255,
			a: 1,
		};
	}
	if (clean.length === 8) {
		const num = parseInt(clean, 16);
		return {
			r: (num >> 24) & 255,
			g: (num >> 16) & 255,
			b: (num >> 8) & 255,
			a: (num & 255) / 255,
		};
	}
	return { r: 139, g: 92, b: 246, a: 1 }; // Default fallback violet
}

/**
 * Converts HEX + alpha (0 to 1) into rgba(...) string
 */
export function hexToRgba(hex: string, alpha: number): string {
	const { r, g, b } = hexToRgb(hex);
	return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * Calculates WCAG relative luminance (0 to 1)
 */
export function getLuminance(r: number, g: number, b: number): number {
	const a = [r, g, b].map((v) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	});
	return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Computes readable foreground text color (#ffffff vs #0f172a) for an accent color
 */
export function getContrastForeground(hex: string): string {
	const { r, g, b } = hexToRgb(hex);
	const lum = getLuminance(r, g, b);
	// Standard threshold: if luminance > 0.45, dark text is more readable, else white
	return lum > 0.45 ? "#0f172a" : "#ffffff";
}

/**
 * Finds theme preset by ID, supporting backwards-compatible aliases (e.g. sky-aurora)
 */
export function getThemePreset(id?: string): ThemePreset {
	if (!id) return THEME_PRESETS[0];
	const clean = id.toLowerCase().trim();

	// Backwards compatibility alias: sky-aurora maps seamlessly to ocean-breeze
	if (clean === "sky-aurora") {
		return THEME_PRESETS.find((t) => t.id === "ocean-breeze") || THEME_PRESETS[0];
	}

	const found = THEME_PRESETS.find((t) => t.id === clean);
	return found || THEME_PRESETS[0];
}

// -----------------------------------------------------------------------------
// 4. DYNAMIC TOKEN GENERATOR
// -----------------------------------------------------------------------------

export interface ComputedThemeVariables {
	"--theme-mode": string;
	"--text-primary": string;
	"--text-secondary": string;
	"--text-muted": string;

	"--aurora-violet": string; // backwards compatibility
	"--accent-color": string;
	"--accent-foreground": string;
	"--accent-subtle": string;
	"--accent-border": string;
	"--accent-hover": string;
	"--accent-ring": string;

	"--glass-surface-primary": string;
	"--glass-surface-secondary": string;
	"--glass-surface-interactive": string;
	"--glass-surface-hover": string;
	"--glass-surface-nav": string;

	"--glass-border-specular": string;
	"--glass-border-subtle": string;
	"--glass-border-hover": string;

	"--glass-shadow-primary": string;
	"--glass-shadow-card": string;
	"--glass-shadow-hover": string;
	"--glass-highlight-top": string;
	"--glass-highlight-bottom": string;

	"--glass-blur": string;
	"--glass-opacity": string;
	"--glass-radius": string;

	"--bg-mesh-gradient": string;
	"--bg-overlay-color": string;
	"--bg-overlay-opacity": string;
}

/**
 * Helper to check whether a color string (HEX or RGBA) is dark
 */
export function isDarkColor(colorStr?: string): boolean {
	if (!colorStr) return false;
	const s = colorStr.trim().toLowerCase();
	if (s.startsWith("#")) {
		const { r, g, b } = hexToRgb(s);
		return getLuminance(r, g, b) < 0.35;
	}
	const rgbaMatch = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
	if (rgbaMatch) {
		const r = parseInt(rgbaMatch[1], 10);
		const g = parseInt(rgbaMatch[2], 10);
		const b = parseInt(rgbaMatch[3], 10);
		return getLuminance(r, g, b) < 0.35;
	}
	return false;
}

/**
 * Computes all CSS custom properties for a given appearance record or preset.
 * Takes user overrides (custom accent color, custom glass blur, custom tint) into account.
 * Guards against cross-mode pollution (e.g. dark tint stuck when switching to a light theme).
 */
export function computeThemeVariables(
	appearance?: {
		palette?: string;
		accent_color?: string;
		glass_blur?: string;
		glass_opacity?: number;
		glass_tint?: string;
		glass_border_opacity?: number;
		glass_radius?: string;
		background_overlay_color?: string;
		background_overlay_opacity?: number;
	} | null
): ComputedThemeVariables {
	const preset = getThemePreset(appearance?.palette);
	const tokens = preset.tokens;

	// Accent color: user override or preset default
	const accentHex =
		appearance?.accent_color && /^#([0-9a-fA-F]{3,8})$/.test(appearance.accent_color.trim())
			? appearance.accent_color.trim()
			: tokens.defaultAccent;

	const accentFg = getContrastForeground(accentHex);
	const accentSubtle = hexToRgba(accentHex, 0.16);
	const accentBorder = hexToRgba(accentHex, 0.35);
	const accentHover = hexToRgba(accentHex, 0.85);
	const accentRing = hexToRgba(accentHex, 0.45);

	// Mode-aware glass surfaces & overlay: prevent obsolete cross-mode overrides (e.g. AMOLED black stuck on Frost Aurora)
	let glassSurfacePrimary = tokens.glassSurfacePrimary;
	if (appearance?.glass_tint && appearance.glass_tint.trim() !== "") {
		const tintDark = isDarkColor(appearance.glass_tint);
		// Only accept override if it matches the preset mode
		if ((preset.mode === "dark" && tintDark) || (preset.mode === "light" && !tintDark)) {
			glassSurfacePrimary = appearance.glass_tint;
		}
	}

	const glassBlur = appearance?.glass_blur || tokens.glassBlur;
	const glassOpacity =
		appearance?.glass_opacity !== undefined
			? appearance.glass_opacity.toString()
			: tokens.glassOpacity.toString();
	const glassRadius = appearance?.glass_radius || tokens.glassRadius;

	let overlayColor = tokens.overlayColor;
	if (appearance?.background_overlay_color && appearance.background_overlay_color.trim() !== "") {
		const overlayDark = isDarkColor(appearance.background_overlay_color);
		if ((preset.mode === "dark" && overlayDark) || (preset.mode === "light" && !overlayDark)) {
			overlayColor = appearance.background_overlay_color;
		}
	}

	const overlayOpacity =
		appearance?.background_overlay_opacity !== undefined
			? appearance.background_overlay_opacity.toString()
			: tokens.overlayOpacity.toString();

	return {
		"--theme-mode": preset.mode,
		"--text-primary": tokens.textPrimary,
		"--text-secondary": tokens.textSecondary,
		"--text-muted": tokens.textMuted,

		"--aurora-violet": accentHex,
		"--accent-color": accentHex,
		"--accent-foreground": accentFg,
		"--accent-subtle": accentSubtle,
		"--accent-border": accentBorder,
		"--accent-hover": accentHover,
		"--accent-ring": accentRing,

		"--glass-surface-primary": glassSurfacePrimary,
		"--glass-surface-secondary": tokens.glassSurfaceSecondary,
		"--glass-surface-interactive": tokens.glassSurfaceInteractive,
		"--glass-surface-hover": tokens.glassSurfaceHover,
		"--glass-surface-nav": tokens.glassSurfaceNav,

		"--glass-border-specular": tokens.glassBorderSpecular,
		"--glass-border-subtle": tokens.glassBorderSubtle,
		"--glass-border-hover": tokens.glassBorderHover,

		"--glass-shadow-primary": tokens.glassShadowPrimary,
		"--glass-shadow-card": tokens.glassShadowCard,
		"--glass-shadow-hover": tokens.glassShadowHover,
		"--glass-highlight-top": tokens.glassHighlightTop,
		"--glass-highlight-bottom": tokens.glassHighlightBottom,

		"--glass-blur": glassBlur,
		"--glass-opacity": glassOpacity,
		"--glass-radius": glassRadius,

		"--bg-mesh-gradient": tokens.meshGradient,
		"--bg-overlay-color": overlayColor,
		"--bg-overlay-opacity": overlayOpacity,
	};
}
