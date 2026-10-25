import { execSync } from "child_process";
import { THEME_PRESETS, ACCENT_PRESETS, getThemePreset, computeThemeVariables, getContrastForeground } from "../app/lib/theme.ts";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";

async function runThemeEngineTests() {
	console.log("============================================================");
	console.log("MOBIO STUDIO — THEME ENGINE V2 & ACCENT ENGINE TESTS");
	console.log("============================================================\n");

	const adminHeaders = {
		"X-Mobio-Dev-Identity": "admin@localhost.local",
		Origin: BASE_URL,
		"Content-Type": "application/json",
	};

	try {
		// Ensure clean baseline before running
		try {
			execSync(
				'npx.cmd wrangler d1 execute mobio-studio-db --local --command "UPDATE appearance_settings SET palette = \'frost-aurora\', accent_color = \'#8b5cf6\' WHERE id IN (\'draft\', \'published\');"',
				{ stdio: "ignore" }
			);
		} catch {}

		// ---------------------------------------------------------------------
		// TEST 1: THEME PRESETS INTEGRITY & DIVERSITY (16 PRESETS)
		// ---------------------------------------------------------------------
		console.log("TEST 1: Verifying 16 Theme Presets (8 Light, 8 Dark)...");
		if (THEME_PRESETS.length !== 16) {
			throw new Error(`Expected 16 presets, got ${THEME_PRESETS.length}`);
		}

		const lightThemes = THEME_PRESETS.filter((t) => t.mode === "light");
		const darkThemes = THEME_PRESETS.filter((t) => t.mode === "dark");

		if (lightThemes.length !== 8 || darkThemes.length !== 8) {
			throw new Error(`Expected 8 light and 8 dark themes, got ${lightThemes.length} light, ${darkThemes.length} dark`);
		}

		const presetIds = new Set(THEME_PRESETS.map((t) => t.id));
		if (presetIds.size !== 16) {
			throw new Error("Duplicate preset IDs found.");
		}

		// Verify each preset computes complete CSS custom properties
		for (const preset of THEME_PRESETS) {
			const vars = computeThemeVariables({ palette: preset.id });
			if (vars["--theme-mode"] !== preset.mode) {
				throw new Error(`Preset ${preset.id} has mode mismatch: ${vars["--theme-mode"]} !== ${preset.mode}`);
			}
			if (!vars["--text-primary"] || !vars["--accent-color"] || !vars["--bg-mesh-gradient"]) {
				throw new Error(`Preset ${preset.id} missing critical CSS tokens.`);
			}
		}
		console.log("  ✓ All 16 presets (8 Light, 8 Dark) generate valid, distinct CSS token sets.");

		// ---------------------------------------------------------------------
		// TEST 2: BACKWARDS COMPATIBILITY & ALIAS RESOLUTION
		// ---------------------------------------------------------------------
		console.log("\nTEST 2: Verifying backwards compatibility aliases...");
		const skyAuroraPreset = getThemePreset("sky-aurora");
		if (skyAuroraPreset.id !== "ocean-breeze") {
			throw new Error(`sky-aurora should resolve to ocean-breeze, got ${skyAuroraPreset.id}`);
		}
		const defaultFallback = getThemePreset("non-existent-theme-xyz");
		if (defaultFallback.id !== "frost-aurora") {
			throw new Error(`Unknown theme should fallback to frost-aurora, got ${defaultFallback.id}`);
		}
		console.log("  ✓ sky-aurora alias correctly resolves to ocean-breeze.");
		console.log("  ✓ Unknown theme correctly falls back to frost-aurora.");

		// ---------------------------------------------------------------------
		// TEST 3: ACCENT COLOR PRESETS & WCAG CONTRAST ENGINE
		// ---------------------------------------------------------------------
		console.log("\nTEST 3: Verifying 16 Accent Presets & WCAG Contrast Engine...");
		if (ACCENT_PRESETS.length !== 16) {
			throw new Error(`Expected 16 accent presets, got ${ACCENT_PRESETS.length}`);
		}
		for (const accent of ACCENT_PRESETS) {
			if (!/^#[0-9a-fA-F]{6}$/.test(accent.hex)) {
				throw new Error(`Invalid hex code for accent ${accent.id}: ${accent.hex}`);
			}
		}

		// Test contrast computation
		const whiteFg = getContrastForeground("#000000"); // Black background -> White text
		const darkFg = getContrastForeground("#ffffff"); // White background -> Dark text
		const yellowFg = getContrastForeground("#eab308"); // Bright yellow -> Dark text
		const purpleFg = getContrastForeground("#7c3aed"); // Deep purple -> White text

		if (whiteFg !== "#ffffff") throw new Error("Expected white fg on black, got " + whiteFg);
		if (darkFg !== "#0f172a") throw new Error("Expected dark fg on white, got " + darkFg);
		if (yellowFg !== "#0f172a") throw new Error("Expected dark fg on bright yellow, got " + yellowFg);
		if (purpleFg !== "#ffffff") throw new Error("Expected white fg on deep purple, got " + purpleFg);

		console.log("  ✓ Contrast engine correctly computes readable text color across light and dark accents.");

		// ---------------------------------------------------------------------
		// TEST 4: APPEARANCE STUDIO DRAFT SAVING & ISOLATION
		// ---------------------------------------------------------------------
		console.log("\nTEST 4: Studio draft appearance saving and isolation...");

		// 1. Fetch current public page to get baseline
		const baselinePublicRes = await fetch(`${BASE_URL}/`);
		const baselineHtml = await baselinePublicRes.text();
		const baselineTheme = baselineHtml.includes('data-theme="dark"') ? "dark" : "light";

		// 2. Save a dark preset (midnight-blue) with a custom accent (#06b6d4) to draft
		const saveDraftRes = await fetch(`${BASE_URL}/api/studio/appearance`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				palette: "midnight-blue",
				accent_color: "#06b6d4",
				glass_blur: "20px",
				glass_opacity: 0.85,
				background_type: "gradient",
				background_animation: 1,
			}),
		});

		const saveDraftData = await saveDraftRes.json();
		if (!saveDraftRes.ok || (saveDraftData.status !== "ok" && !saveDraftData.success)) {
			throw new Error(`Failed to save draft appearance: ${JSON.stringify(saveDraftData)}`);
		}
		if (saveDraftData.appearance?.palette !== "midnight-blue") {
			throw new Error(`Expected saved palette 'midnight-blue', got: ${saveDraftData.appearance?.palette}`);
		}
		console.log("  ✓ Draft appearance saved successfully with midnight-blue and #06b6d4.");

		// 3. Verify public page did NOT change yet (Draft Isolation)
		const unpubPublicRes = await fetch(`${BASE_URL}/`);
		const unpubHtml = await unpubPublicRes.text();
		const unpubTheme = unpubHtml.includes('data-theme="dark"') ? "dark" : "light";

		if (unpubTheme !== baselineTheme) {
			throw new Error("DRAFT LEAK: Public website changed before publishing!");
		}
		if (unpubHtml.includes("--accent-color:#06b6d4") || unpubHtml.includes("--accent-color: #06b6d4")) {
			throw new Error("DRAFT LEAK: Draft accent color leaked to public site before publishing!");
		}
		console.log("  ✓ Draft isolation verified: Public site unchanged before publish.");

		// ---------------------------------------------------------------------
		// TEST 5: PUBLISH PROMOTION & LIVE RENDERING
		// ---------------------------------------------------------------------
		console.log("\nTEST 5: Promoting draft to published and verifying public SSR tokens...");
		const pubRes = await fetch(`${BASE_URL}/api/studio/publish`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({ note: "Test Theme Engine V2 Publish" }),
		});
		const pubData = await pubRes.json();
		if (!pubRes.ok || (pubData.status !== "ok" && !pubData.success)) {
			throw new Error(`Failed to publish draft: ${JSON.stringify(pubData)}`);
		}
		console.log("  ✓ Successfully published draft changes.");

		// Verify public page NOW reflects the published dark theme and custom accent
		const publishedPublicRes = await fetch(`${BASE_URL}/`);
		const publishedHtml = await publishedPublicRes.text();

		if (!publishedHtml.includes('data-theme="dark"')) {
			throw new Error("Public page failed to apply data-theme='dark' after publishing midnight-blue!");
		}
		if (!publishedHtml.includes("#06b6d4")) {
			throw new Error("Public page failed to apply accent color #06b6d4 after publishing!");
		}
		if (!publishedHtml.includes("text-theme-primary")) {
			throw new Error("Public page missing semantic text-theme-primary classes.");
		}
		console.log("  ✓ Public SSR HTML correctly renders data-theme='dark' and accent #06b6d4.");

		// ---------------------------------------------------------------------
		// TEST 6: RESTORE CLEAN NEUTRAL DEFAULT
		// ---------------------------------------------------------------------
		console.log("\nTEST 6: Restoring clean neutral default appearance...");
		const restoreRes = await fetch(`${BASE_URL}/api/studio/appearance`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				palette: "frost-aurora",
				glass_intensity: "medium",
				accent_color: "#8b5cf6",
				glass_blur: "16px",
				glass_opacity: 0.70,
				glass_tint: "rgba(255, 255, 255, 0.65)",
				background_type: "gradient",
				background_animation: 1,
				background_overlay_color: "rgba(248, 250, 252, 0.45)",
				background_overlay_opacity: 0.45,
				cover_enabled: 0,
			}),
		});
		const restoreData = await restoreRes.json();
		if (!restoreRes.ok || (restoreData.status !== "ok" && !restoreData.success)) {
			throw new Error(`Failed to restore default appearance: ${JSON.stringify(restoreData)}`);
		}

		// Publish restored default
		const pubRestoreRes = await fetch(`${BASE_URL}/api/studio/publish`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({ note: "Restore Frost Aurora Default" }),
		});
		if (!pubRestoreRes.ok) {
			throw new Error("Failed to publish restored defaults.");
		}

		const finalPublicRes = await fetch(`${BASE_URL}/`);
		const finalHtml = await finalPublicRes.text();
		if (finalHtml.includes('data-theme="dark"')) {
			throw new Error("Public page still dark after restoring Frost Aurora!");
		}
		if (!finalHtml.includes('data-theme="light"')) {
			throw new Error("Public page should have data-theme='light' for Frost Aurora.");
		}
		console.log("  ✓ Clean neutral default (Frost Aurora, light mode, #8b5cf6) restored successfully.");

		console.log("\n============================================================");
		console.log("ALL THEME ENGINE V2 TESTS PASSED SUCCESSFULLY! (6/6)");
		console.log("============================================================\n");
	} catch (err) {
		console.error("\n❌ TEST SUITE FAILED:", err);
		process.exit(1);
	}
}

runThemeEngineTests();
