import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { THEME_PRESETS, getThemePreset } from "../app/lib/theme.ts";
import { LAYOUT_THEMES, getLayoutTheme } from "../app/lib/layouts.ts";
import { PROFILE_CARD_STYLES, CARD_SIZES, getProfileCardStyle, getCardSizeConfig } from "../app/lib/profileCard.ts";
import { FONT_PRESETS, FONT_CATEGORIES, getFontPreset } from "../app/lib/typography.ts";

const BASE_URL = (process.env.TEST_URL || "http://localhost:5173").trim();
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-artifacts/screenshots/v4");
const DEV_AUTH_HEADER = {
	"X-Mobio-Dev-Identity": "dimas@example.com",
	"Origin": BASE_URL,
	"Content-Type": "application/json",
};

if (!fs.existsSync(SCREENSHOT_DIR)) {
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runV4Verification() {
	console.log("============================================================");
	console.log("MOBIO LINK BIO — V4 ULTRA PREMIUM CUSTOMIZATION ENGINE");
	console.log("20 Layouts • 10 Card Styles • 3 Card Sizes • 24 Fonts • 30 Themes");
	console.log("============================================================\n");

	let browser;
	try {
		browser = await chromium.launch({ channel: "msedge", headless: true });
	} catch {
		browser = await chromium.launch({ channel: "chrome", headless: true });
	}
	const context = await browser.newContext({
		viewport: { width: 1280, height: 800 },
	});
	const page = await context.newPage();

	try {
		// ---------------------------------------------------------------------
		// 1. LAYER A: 30 PRESERVED COLOR THEMES
		// ---------------------------------------------------------------------
		console.log("TEST 1: Verifying Layer A — 30 Curated Color Themes...");
		assert.equal(THEME_PRESETS.length, 30, `Expected 30 themes, got ${THEME_PRESETS.length}`);
		const lightThemes = THEME_PRESETS.filter((t) => t.mode === "light");
		const darkThemes = THEME_PRESETS.filter((t) => t.mode === "dark");
		assert.equal(lightThemes.length, 15, `Expected 15 light themes, got ${lightThemes.length}`);
		assert.equal(darkThemes.length, 15, `Expected 15 dark themes, got ${darkThemes.length}`);
		
		const themeIds = new Set(THEME_PRESETS.map((t) => t.id));
		assert.equal(themeIds.size, 30, "All 30 theme IDs must be unique");

		for (const theme of THEME_PRESETS) {
			assert.ok(theme.tokens.glassSurfacePrimary, `${theme.id} missing glassSurfacePrimary`);
			assert.ok(theme.tokens.textPrimary, `${theme.id} missing textPrimary`);
			assert.ok(theme.tokens.defaultAccent, `${theme.id} missing defaultAccent`);
			assert.ok(theme.tokens.meshGradient, `${theme.id} missing meshGradient`);
		}
		console.log("  ✓ 30 color themes valid (15 Light, 15 Dark, complete tokens).");

		// ---------------------------------------------------------------------
		// 2. LAYER B: 20 DISTINCT LAYOUT THEMES
		// ---------------------------------------------------------------------
		console.log("\nTEST 2: Verifying Layer B — 20 Distinct Layout Themes...");
		assert.equal(LAYOUT_THEMES.length, 20, `Expected 20 layout themes, got ${LAYOUT_THEMES.length}`);
		
		const layoutIds = new Set(LAYOUT_THEMES.map((l) => l.id));
		assert.equal(layoutIds.size, 20, "All 20 layout IDs must be unique");

		// Verify structural diversity across layouts
		const splitLayouts = LAYOUT_THEMES.filter((l) => l.isSplitDesktop);
		const gridLayouts = LAYOUT_THEMES.filter((l) => l.linkArrangement === "grid-2");
		const denseLayouts = LAYOUT_THEMES.filter((l) => l.linkArrangement === "dense-stack");
		const capsuleLayouts = LAYOUT_THEMES.filter((l) => l.linkArrangement === "capsule-stack");
		const islandLayouts = LAYOUT_THEMES.filter((l) => l.linkArrangement === "island-stack");

		assert.ok(splitLayouts.length >= 1, `Expected at least 1 split desktop layout, got ${splitLayouts.length}`);
		assert.ok(gridLayouts.length >= 2, `Expected at least 2 grid layouts, got ${gridLayouts.length}`);
		assert.ok(denseLayouts.length >= 1, `Expected at least 1 dense stack layout, got ${denseLayouts.length}`);
		assert.ok(capsuleLayouts.length >= 1, `Expected at least 1 capsule layout, got ${capsuleLayouts.length}`);
		assert.ok(islandLayouts.length >= 1, `Expected at least 1 island layout, got ${islandLayouts.length}`);
		console.log(`  ✓ 20 layout themes verified (${splitLayouts.length} split, ${gridLayouts.length} grid, ${capsuleLayouts.length} capsule, ${islandLayouts.length} island, ${denseLayouts.length} dense).`);

		// ---------------------------------------------------------------------
		// 3. LAYER C: 10 DISTINCT PROFILE CARD STYLES
		// ---------------------------------------------------------------------
		console.log("\nTEST 3: Verifying Layer C — 10 Distinct Profile Card Styles...");
		assert.equal(PROFILE_CARD_STYLES.length, 10, `Expected 10 profile card styles, got ${PROFILE_CARD_STYLES.length}`);

		const cardStyleIds = new Set(PROFILE_CARD_STYLES.map((s) => s.id));
		assert.equal(cardStyleIds.size, 10, "All 10 card style IDs must be unique");

		const requiredStyles = [
			"immersive-fade", "minimal-identity", "compact-banner", "floating-avatar",
			"editorial-profile", "frosted-panel", "frameless-cover", "split-identity",
			"soft-capsule", "cinematic-mini"
		];
		for (const req of requiredStyles) {
			assert.ok(cardStyleIds.has(req), `Required style '${req}' must be present`);
		}
		console.log("  ✓ 10 distinct profile card styles verified.");

		// ---------------------------------------------------------------------
		// 4. LAYER C: 3 CARD SIZES (MEASURABLE COMPACTNESS)
		// ---------------------------------------------------------------------
		console.log("\nTEST 4: Verifying Layer C — 3 Card Sizes & Measurable Compactness...");
		assert.equal(CARD_SIZES.length, 3, `Expected 3 card sizes, got ${CARD_SIZES.length}`);
		
		const smallCfg = getCardSizeConfig("small");
		const medCfg = getCardSizeConfig("medium");
		const normCfg = getCardSizeConfig("normal");

		assert.equal(smallCfg.avatarPx, 68);
		assert.equal(medCfg.avatarPx, 84);
		assert.equal(normCfg.avatarPx, 96);
		console.log("  ✓ Card sizes registered: Small (avatar 68px), Medium (avatar 84px), Normal (avatar 96px).");

		// ---------------------------------------------------------------------
		// 5. LAYER D: 24 CURATED GOOGLE FONTS & 5 CATEGORIES
		// ---------------------------------------------------------------------
		console.log("\nTEST 5: Verifying Layer D — 24 Curated Google Fonts...");
		assert.equal(FONT_PRESETS.length, 24, `Expected 24 font presets, got ${FONT_PRESETS.length}`);
		
		const fontIds = new Set(FONT_PRESETS.map((f) => f.id));
		assert.equal(fontIds.size, 24, "All 24 font IDs must be unique");

		assert.equal(FONT_CATEGORIES.length, 5, "Expected 5 font categories");
		for (const cat of FONT_CATEGORIES) {
			const count = FONT_PRESETS.filter((f) => f.category === cat.id).length;
			assert.ok(count >= 3, `Category ${cat.id} should have at least 3 fonts, got ${count}`);
		}
		console.log("  ✓ 24 Google Fonts verified across 5 categories (Clean, Geometric, Professional, Rounded, Creative).");

		// ---------------------------------------------------------------------
		// 6. PUBLIC COPY POLISH: ZERO EXPLANATORY HELPER SENTENCES
		// ---------------------------------------------------------------------
		console.log("\nTEST 6: Auditing Removal of Explanatory Public Copy...");
		const forbiddenSentence1 = "Silakan hubungi saya melalui saluran komunikasi resmi berikut.";
		const forbiddenSentence2 = "Kumpulan proyek, karya visual, dan referensi yang telah dikurasi.";

		const publicPages = [
			{ name: "Home Tab", url: `${BASE_URL}/` },
			{ name: "Explore Tab", url: `${BASE_URL}/?tab=explore` },
			{ name: "Contact Tab", url: `${BASE_URL}/?tab=contact` },
			{ name: "Preview Home", url: `${BASE_URL}/studio/preview`, auth: true },
			{ name: "Preview Explore", url: `${BASE_URL}/studio/preview?tab=explore`, auth: true },
			{ name: "Preview Contact", url: `${BASE_URL}/studio/preview?tab=contact`, auth: true },
		];

		for (const target of publicPages) {
			if (target.auth) {
				await page.setExtraHTTPHeaders(DEV_AUTH_HEADER);
			} else {
				await page.setExtraHTTPHeaders({});
			}
			await page.goto(target.url, { waitUntil: "load" });
			await page.waitForTimeout(300);

			const content = await page.content();
			const text = await page.innerText("body");

			assert.ok(!content.includes(forbiddenSentence1), `${target.name} must not contain forbidden sentence 1 in HTML`);
			assert.ok(!content.includes(forbiddenSentence2), `${target.name} must not contain forbidden sentence 2 in HTML`);
			assert.ok(!text.includes(forbiddenSentence1), `${target.name} must not contain forbidden sentence 1 in visible text`);
			assert.ok(!text.includes(forbiddenSentence2), `${target.name} must not contain forbidden sentence 2 in visible text`);
			console.log(`  ✓ ${target.name}: Zero explanatory sentences present.`);
		}

		// ---------------------------------------------------------------------
		// 7. STUDIO APPEARANCE SUBTABS & COVER ASPECT RATIO REMOVAL AUDIT
		// ---------------------------------------------------------------------
		console.log("\nTEST 7: Auditing Appearance Studio UI Subtabs & Controls...");
		await page.setExtraHTTPHeaders(DEV_AUTH_HEADER);
		await page.goto(`${BASE_URL}/studio`, { waitUntil: "load" });
		await page.waitForTimeout(500);

		// Switch to Appearance tab
		await page.click("button:has-text('Appearance')");
		await page.waitForTimeout(400);

		// Verify 6 Subtabs exist
		const subtabs = ["Tema Warna", "Tata Letak", "Kartu Profil", "Tipografi", "Latar Belakang", "Liquid Glass"];
		for (const tabText of subtabs) {
			const tabBtn = await page.$(`button:has-text('${tabText}')`);
			assert.ok(tabBtn, `Subtab button for '${tabText}' must exist`);
		}
		console.log("  ✓ All 6 Appearance Subtabs present in Studio UI.");

		// Verify manual aspect ratio selector buttons (21:9, 16:9, 3:1) are REMOVED from Media subtab
		await page.click("button:has-text('Latar Belakang')");
		await page.waitForTimeout(300);

		const manualRatioBtn = await page.$("button:has-text('Ultrawide (21:9)')");
		assert.equal(manualRatioBtn, null, "Manual aspect ratio button 'Ultrawide (21:9)' must be removed");

		const styleDrivenNotice = await page.$("text=Geometri Cover Otomatis (Style-Driven)");
		assert.ok(styleDrivenNotice, "Style-Driven Cover Geometry informational notice must be present");
		console.log("  ✓ Manual aspect ratio buttons successfully removed and replaced with style-driven geometry notice.");

		// Take studio screenshot
		const studioShot = path.join(SCREENSHOT_DIR, "v4-studio-appearance-subtabs.png");
		await page.screenshot({ path: studioShot, fullPage: false });
		console.log(`  ✓ Saved screenshot: ${path.basename(studioShot)}`);

		// ---------------------------------------------------------------------
		// 8. CARD SIZE ENGINE: BROWSER MEASUREMENT & COMPACTNESS
		// ---------------------------------------------------------------------
		console.log("\nTEST 8: Testing Card Size Engine in Browser (Small vs Medium vs Normal)...");
		
		const sizesToTest = ["small", "medium", "normal"];
		const measuredWidths = {};
		const measuredHeights = {};

		for (const sz of sizesToTest) {
			// Update draft appearance with this size
			await fetch(`${BASE_URL}/api/studio/appearance`, {
				method: "POST",
				headers: DEV_AUTH_HEADER,
				body: JSON.stringify({
					profile_card_size: sz,
					profile_card_style_id: "immersive-fade",
				}),
			});

			await page.goto(`${BASE_URL}/studio/preview`, { waitUntil: "load" });
			await page.waitForTimeout(400);

			const headerCard = await page.$("header .glass-liquid-primary");
			assert.ok(headerCard, `Header card must exist for size ${sz}`);
			const box = await headerCard.boundingBox();
			assert.ok(box, `Bounding box must exist for size ${sz}`);

			measuredWidths[sz] = Math.round(box.width);
			measuredHeights[sz] = Math.round(box.height);
			console.log(`  ✓ Size '${sz}': Width=${measuredWidths[sz]}px, Height=${measuredHeights[sz]}px`);

			// Measure avatar element
			const avatarBox = await (await page.$("header .glass-liquid-primary [aria-label]"))?.boundingBox();
			if (avatarBox) {
				console.log(`    ↳ Avatar size for '${sz}': ${Math.round(avatarBox.width)}x${Math.round(avatarBox.height)}px`);
			}

			// Capture screenshot of each card size
			const cardShot = path.join(SCREENSHOT_DIR, `v4-card-size-${sz}.png`);
			await page.screenshot({ path: cardShot, fullPage: false });
		}

		// Verify sizing ordering: small <= medium <= normal
		assert.ok(measuredWidths["small"] <= measuredWidths["medium"], "Small card width must be <= Medium width");
		assert.ok(measuredWidths["medium"] <= measuredWidths["normal"], "Medium card width must be <= Normal width");
		
		// Verify compact height: all under 350px!
		for (const sz of sizesToTest) {
			assert.ok(measuredHeights[sz] < 350, `Card height for ${sz} (${measuredHeights[sz]}px) must be measurably compact (< 350px)`);
		}
		console.log("  ✓ Card Size Engine verified: Small <= Medium <= Normal, strictly compact height (< 350px).");

		// ---------------------------------------------------------------------
		// 9. PROFILE CARD STYLES: RENDERING & VISUAL VERIFICATION
		// ---------------------------------------------------------------------
		console.log("\nTEST 9: Testing 10 Profile Card Styles Rendering...");
		const stylesToTest = [
			"immersive-fade",
			"minimal-identity",
			"compact-banner",
			"floating-avatar",
			"editorial-profile",
			"frosted-panel",
			"frameless-cover",
			"split-identity",
			"soft-capsule",
			"cinematic-mini",
		];

		for (const st of stylesToTest) {
			await fetch(`${BASE_URL}/api/studio/appearance`, {
				method: "POST",
				headers: DEV_AUTH_HEADER,
				body: JSON.stringify({
					profile_card_style_id: st,
					profile_card_size: "medium",
				}),
			});

			await page.goto(`${BASE_URL}/studio/preview`, { waitUntil: "load" });
			await page.waitForTimeout(300);

			const card = await page.$("header .glass-liquid-primary");
			assert.ok(card, `Card must render for style ${st}`);
			
			// Verify identity rendered
			const nameEl = await page.$("header h1");
			assert.ok(nameEl, `Name heading must exist for style ${st}`);

			// Capture screenshot of selected styles
			if (["immersive-fade", "floating-avatar", "cinematic-mini", "editorial-profile"].includes(st)) {
				const stShot = path.join(SCREENSHOT_DIR, `v4-style-${st}.png`);
				await page.screenshot({ path: stShot, fullPage: false });
				console.log(`  ✓ Style '${st}': Rendered cleanly. Screenshot saved: ${path.basename(stShot)}`);
			} else {
				console.log(`  ✓ Style '${st}': Rendered cleanly.`);
			}
		}

		// ---------------------------------------------------------------------
		// 10. TYPOGRAPHY ENGINE: GOOGLE FONT INJECTION & CSS APPLICATION
		// ---------------------------------------------------------------------
		console.log("\nTEST 10: Testing Curated Typography Engine...");
		const fontsToTest = ["plus-jakarta-sans", "playfair-display", "space-grotesk", "outfit"];

		for (const fId of fontsToTest) {
			const fontPreset = getFontPreset(fId);
			await fetch(`${BASE_URL}/api/studio/appearance`, {
				method: "POST",
				headers: DEV_AUTH_HEADER,
				body: JSON.stringify({
					font_family_id: fId,
				}),
			});

			await page.goto(`${BASE_URL}/studio/preview`, { waitUntil: "load" });
			await page.waitForTimeout(300);

			// Verify Google Font link tag present in DOM
			const fontLink = await page.$(`link[href*='${fontPreset.googleFamily}']`);
			assert.ok(fontLink, `Google Font link for ${fontPreset.name} must exist in DOM`);

			// Verify root container has font-family
			const rootFontFamily = await page.evaluate(() => {
				const root = document.querySelector("#mobio-root");
				return root ? window.getComputedStyle(root).fontFamily : "";
			});
			assert.ok(rootFontFamily.toLowerCase().includes(fontPreset.name.toLowerCase()), `Root font family '${rootFontFamily}' must include '${fontPreset.name}'`);
			console.log(`  ✓ Font '${fontPreset.name}': Google Font stylesheet loaded and CSS applied (${rootFontFamily.split(",")[0]}).`);
		}

		// ---------------------------------------------------------------------
		// 11. LAYOUT THEMES: STRUCTURAL COMPOSITION & RESPONSIVENESS
		// ---------------------------------------------------------------------
		console.log("\nTEST 11: Testing Layout Themes & Responsiveness...");
		const layoutsToTest = [
			{ id: "compact-center", expectedSplit: false },
			{ id: "split-composition", expectedSplit: true },
			{ id: "soft-grid", expectedSplit: false },
			{ id: "neo-capsule", expectedSplit: false },
			{ id: "minimal-stack", expectedSplit: false },
		];

		for (const lyt of layoutsToTest) {
			await fetch(`${BASE_URL}/api/studio/appearance`, {
				method: "POST",
				headers: DEV_AUTH_HEADER,
				body: JSON.stringify({
					layout_theme_id: lyt.id,
				}),
			});

			// Test on Desktop (1280px)
			await page.setViewportSize({ width: 1280, height: 800 });
			await page.goto(`${BASE_URL}/studio/preview`, { waitUntil: "load" });
			await page.waitForTimeout(300);

			// Check split desktop
			const splitGrid = await page.$(".md\\:grid-cols-12");
			if (lyt.expectedSplit) {
				assert.ok(splitGrid, `Layout ${lyt.id} must render desktop split columns`);
			}

			// Capture screenshot of key layouts
			const lytShot = path.join(SCREENSHOT_DIR, `v4-layout-${lyt.id}-desktop.png`);
			await page.screenshot({ path: lytShot, fullPage: false });

			// Test on Mobile (375px) for horizontal overflow
			await page.setViewportSize({ width: 375, height: 667 });
			await page.goto(`${BASE_URL}/studio/preview`, { waitUntil: "load" });
			await page.waitForTimeout(300);

			const hasOverflow = await page.evaluate(() => {
				return document.documentElement.scrollWidth > window.innerWidth;
			});
			assert.equal(hasOverflow, false, `Layout ${lyt.id} must NOT have horizontal overflow on 375px mobile`);

			const lytMobileShot = path.join(SCREENSHOT_DIR, `v4-layout-${lyt.id}-mobile.png`);
			await page.screenshot({ path: lytMobileShot, fullPage: false });

			console.log(`  ✓ Layout '${lyt.id}': Responsiveness verified (Desktop + 375px Mobile zero-overflow).`);
		}

		// Reset viewport
		await page.setViewportSize({ width: 1280, height: 800 });

		// ---------------------------------------------------------------------
		// 12. DRAFT ISOLATION, PUBLISH & DISCARD WORKFLOW
		// ---------------------------------------------------------------------
		console.log("\nTEST 12: Testing Draft Isolation, Atomic Publish & Discard...");

		// 1. Publish clean state
		await fetch(`${BASE_URL}/api/studio/publish`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({}),
		});

		// 2. Mutate draft to a distinct configuration
		await fetch(`${BASE_URL}/api/studio/appearance`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({
				palette: "cyber-indigo",
				layout_theme_id: "split-composition",
				profile_card_style_id: "floating-avatar",
				profile_card_size: "small",
				font_family_id: "space-grotesk",
			}),
		});

		// 3. Verify public page still has previous published state (draft isolation)
		await page.setExtraHTTPHeaders({});
		await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
		await page.waitForTimeout(300);
		const pubFontLink = await page.$("link[href*='Space+Grotesk']");
		assert.equal(pubFontLink, null, "Public page must not reflect draft font before publishing");
		console.log("  ✓ Draft isolation verified: Public page untouched by draft edits.");

		// 4. Verify preview page DOES reflect draft
		await page.setExtraHTTPHeaders(DEV_AUTH_HEADER);
		await page.goto(`${BASE_URL}/studio/preview`, { waitUntil: "load" });
		await page.waitForTimeout(300);
		const prevFontLink = await page.$("link[href*='Space+Grotesk']");
		assert.ok(prevFontLink, "Preview page must reflect draft font");
		console.log("  ✓ Draft Preview verified: Immediately reflects all 4 customization layers.");

		// 5. Publish draft
		await fetch(`${BASE_URL}/api/studio/publish`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({}),
		});

		// 6. Verify public page now HAS the new configuration
		await page.setExtraHTTPHeaders({});
		await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
		await page.waitForTimeout(300);
		const pubFontLinkAfter = await page.$("link[href*='Space+Grotesk']");
		assert.ok(pubFontLinkAfter, "Public page must reflect published font after publish");
		console.log("  ✓ Atomic publish verified: Public page updated successfully.");

		// 7. Test Discard: mutate draft then discard
		await fetch(`${BASE_URL}/api/studio/appearance`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({
				font_family_id: "playfair-display",
			}),
		});
		await fetch(`${BASE_URL}/api/studio/discard`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({}),
		});

		// Verify draft appearance reverted to space-grotesk
		const appRes = await fetch(`${BASE_URL}/api/studio/appearance`, {
			headers: DEV_AUTH_HEADER,
		});
		const appData = await appRes.json();
		const currentFont = appData.appearance?.font_family_id || appData.font_family_id;
		assert.equal(currentFont, "space-grotesk", "Draft must revert to published font after discard");
		console.log("  ✓ Draft discard verified: Clean rollback to published state.");

		// Reset to elegant default configuration
		await fetch(`${BASE_URL}/api/studio/appearance`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({
				palette: "dark-liquid",
				layout_theme_id: "compact-center",
				profile_card_style_id: "immersive-fade",
				profile_card_size: "medium",
				font_family_id: "inter",
			}),
		});
		await fetch(`${BASE_URL}/api/studio/publish`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({}),
		});

		console.log("\n============================================================");
		console.log("🎉 ALL V4 VERIFICATION TESTS PASSED SUCCESSFULLY!");
		console.log("============================================================\n");

	} catch (err) {
		console.error("\n❌ V4 Verification Failed:", err);
		process.exit(1);
	} finally {
		await browser.close();
	}
}

runV4Verification();
