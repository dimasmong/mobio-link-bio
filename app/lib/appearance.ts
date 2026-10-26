/**
 * MOBIO STUDIO — UNIFIED APPEARANCE RESOLVER (V4)
 *
 * Coordinates the 4 Independent Customization Systems:
 * 1. Color Themes (30 Presets: 15 Light, 15 Dark)
 * 2. Layout Themes (20 Distinct Layout Compositions)
 * 3. Profile Card Styles (10 Styles) & Card Size Engine (Small, Medium, Normal)
 * 4. Typography (24 Curated Google Fonts)
 *
 * Ensures Safe Defaults, Cross-Layer Independence, and Pure Token Computation.
 */

import {
	getThemePreset,
	computeThemeVariables,
	type ThemePreset,
	type ComputedThemeVariables,
} from "./theme";
import { getLayoutTheme, type LayoutTheme } from "./layouts";
import {
	getProfileCardStyle,
	getCardSizeConfig,
	type ProfileCardStyle,
	type CardSizeConfig,
	type CardSize,
} from "./profileCard";
import {
	getFontPreset,
	getGoogleFontHref,
	type FontPreset,
} from "./typography";
import type { AppearanceRecord } from "./db.server";

export interface ResolvedAppearance {
	colorTheme: ThemePreset;
	layoutTheme: LayoutTheme;
	cardStyle: ProfileCardStyle;
	cardSize: CardSizeConfig;
	font: FontPreset;
	themeVariables: ComputedThemeVariables;
	googleFontHref: string;
	dynamicStyles: React.CSSProperties;
}

/**
 * Resolves full appearance from raw DB/Draft record with bulletproof fallbacks.
 */
export function resolveAppearance(
	raw?: Partial<AppearanceRecord> | null
): ResolvedAppearance {
	const colorTheme = getThemePreset(raw?.palette);
	const layoutTheme = getLayoutTheme(raw?.layout_theme_id);
	const cardStyle = getProfileCardStyle(raw?.profile_card_style_id);
	const cardSize = getCardSizeConfig(raw?.profile_card_size as CardSize);
	const font = getFontPreset(raw?.font_family_id);

	const themeVariables = computeThemeVariables(raw as any);
	const googleFontHref = getGoogleFontHref(font);

	const dynamicStyles: React.CSSProperties = {
		...(themeVariables as unknown as React.CSSProperties),
		fontFamily: font.cssFontFamily,
		"--font-sans": font.cssFontFamily,
	} as React.CSSProperties;

	return {
		colorTheme,
		layoutTheme,
		cardStyle,
		cardSize,
		font,
		themeVariables,
		googleFontHref,
		dynamicStyles,
	};
}
