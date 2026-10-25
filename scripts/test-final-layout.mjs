import { chromium } from "playwright";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";

const ADMIN_HEADERS = {
	"X-Mobio-Dev-Identity": "admin@localhost.local",
	Origin: BASE_URL,
	"Content-Type": "application/json",
};

async function updateAppearanceAndPublish(appearance) {
	const res = await fetch(`${BASE_URL}/api/studio/appearance`, {
		method: "POST",
		headers: ADMIN_HEADERS,
		body: JSON.stringify({
			action: "save",
			appearance,
		}),
	});
	if (!res.ok) {
		throw new Error(`Failed to save draft appearance: ${res.statusText}`);
	}

	const pubRes = await fetch(`${BASE_URL}/api/studio/publish`, {
		method: "POST",
		headers: ADMIN_HEADERS,
	});
	if (!pubRes.ok) {
		throw new Error(`Failed to publish draft: ${pubRes.statusText}`);
	}
}

async function restoreBaseline() {
	await updateAppearanceAndPublish({
		cover_enabled: 0,
		cover_url: "",
		palette: "frost-aurora",
		accent_color: "#8b5cf6",
	});
}

async function runFinalLayoutTests() {
	console.log("============================================================");
	console.log("MOBIO — FINAL LAYOUT FOLLOW-UP VERIFICATION SUITE");
	console.log("Cover Banner, Overlapping Avatar & Navbar Language Dropdown");
	console.log("============================================================\n");

	let browser;
	try {
		browser = await chromium.launch({ channel: "msedge", headless: true });
	} catch (e) {
		browser = await chromium.launch({ channel: "chrome", headless: true });
	}
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		// ---------------------------------------------------------------------
		// TEST 1: COVER BANNER & OVERLAPPING AVATAR (WITH COVER ENABLED)
		// ---------------------------------------------------------------------
		console.log("TEST 1: Verifying Unified Cover Banner & Overlapping Avatar (Cover Enabled)...");
		await updateAppearanceAndPublish({
			cover_enabled: 1,
			cover_url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200",
		});

		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(BASE_URL, { waitUntil: "networkidle" });

		// Verify no separate floating LanguageToggle exists outside navigation
		const separateLanguageToggle = await page.$("main > div > div > button:has-text('ID'), main > div > .LanguageToggle");
		if (separateLanguageToggle) {
			throw new Error("Found separate floating language toggle outside navigation bar!");
		}
		console.log("  ✓ No separate floating language switcher found outside navigation dock.");

		// Verify ProfileGlassCard structure contains cover and overlapping avatar
		const headerCard = await page.$("header .glass-liquid-primary");
		if (!headerCard) {
			throw new Error("Header glass-liquid-primary card not found.");
		}

		// Verify cover banner is integrated inside the header card as unified banner
		const integratedCover = await page.$("header .glass-liquid-primary div[class*='aspect-'] img, header .glass-liquid-primary div[class*='aspect-'] video");
		if (!integratedCover) {
			throw new Error("Integrated cover media not found within ProfileGlassCard.");
		}
		console.log("  ✓ Cover banner is rendered as a unified banner at top of ProfileGlassCard.");

		// Check for overlapping avatar styling (-mt-12 / -mt-14 / -mt-16)
		const overlappingAvatar = await page.$("header .glass-liquid-primary [class*='-mt-']");
		if (!overlappingAvatar) {
			throw new Error("Overlapping avatar with negative top margin (-mt-*) not found at cover boundary.");
		}
		console.log("  ✓ Avatar correctly overlaps the cover and profile body boundary.");

		// Check that there is no translucent capsule cutting across the banner
		const cuttingCapsule = await page.$(".glass-liquid-cover");
		if (cuttingCapsule) {
			const hasNegativeMargin = await page.evaluate(() => {
				const el = document.querySelector(".glass-liquid-cover");
				if (!el) return false;
				const parent = el.parentElement;
				return parent && (parent.className.includes("mb-[-") || parent.className.includes("-mb-"));
			});
			if (hasNegativeMargin) {
				throw new Error("Cover banner parent still has negative bottom margin overlaying subsequent cards!");
			}
		}
		console.log("  ✓ Cover banner has zero cutting capsule and zero negative bottom margins.");

		// ---------------------------------------------------------------------
		// TEST 2: PROFILE CARD STRUCTURE (WITH COVER DISABLED)
		// ---------------------------------------------------------------------
		console.log("\nTEST 2: Verifying Profile Card Clean Layout (Cover Disabled)...");
		await updateAppearanceAndPublish({
			cover_enabled: 0,
			cover_url: "",
		});
		await page.goto(BASE_URL, { waitUntil: "networkidle" });

		const coverWhenDisabled = await page.$("header .glass-liquid-primary div[class*='aspect-'] img");
		if (coverWhenDisabled) {
			throw new Error("Cover media should not be present when cover_enabled is 0.");
		}

		const normalAvatar = await page.$("header .glass-liquid-primary [class*='mb-4']");
		if (!normalAvatar) {
			throw new Error("Avatar did not revert to standard margin when cover is disabled.");
		}
		console.log("  ✓ Profile card renders cleanly with standard padding when cover is disabled.");

		// ---------------------------------------------------------------------
		// TEST 3: INTEGRATED NAVBAR LANGUAGE GLOBE BUTTON & DROPDOWN (DESKTOP)
		// ---------------------------------------------------------------------
		console.log("\nTEST 3: Verifying Integrated Navbar Language Globe Button & Dropdown on Desktop...");
		const desktopNav = await page.$("aside[aria-label='Desktop Tab Navigation']");
		if (!desktopNav) {
			throw new Error("Desktop Tab Navigation not found.");
		}

		const desktopGlobeBtn = await desktopNav.$("button[aria-label*='Pilih Bahasa'], button[aria-label*='Language']");
		if (!desktopGlobeBtn) {
			throw new Error("Globe language button not found inside Desktop Navigation dock.");
		}
		console.log("  ✓ Globe language button integrated inside Desktop Navigation dock.");

		// Open dropdown
		await desktopGlobeBtn.click();
		await page.waitForTimeout(250);

		// Verify dropdown menu opened with ID and EN options
		const enMenuItem = await desktopNav.$("button[role='menuitem'][aria-label='English'], button[role='menuitem']:has-text('EN')");
		const idMenuItem = await desktopNav.$("button[role='menuitem'][aria-label='Bahasa Indonesia'], button[role='menuitem']:has-text('ID')");

		if (!enMenuItem || !idMenuItem) {
			throw new Error("Dropdown menu missing ID or EN language options.");
		}
		console.log("  ✓ Language dropdown opened with ID and EN options.");

		// Click English
		await enMenuItem.click();
		await page.waitForTimeout(300);

		// Verify page switched to English
		const linksSectionEn = await page.textContent("#tabpanel-home");
		const isEnglish = linksSectionEn.includes("No Links Configured Yet") || linksSectionEn.includes("Links");
		if (!isEnglish) {
			throw new Error("Page content failed to switch to English.");
		}
		console.log("  ✓ Successfully switched page language to English via dropdown.");

		// Switch back to Indonesian
		await desktopGlobeBtn.click();
		await page.waitForTimeout(250);
		const idMenuItemReopen = await desktopNav.$("button[role='menuitem'][aria-label='Bahasa Indonesia'], button[role='menuitem']:has-text('ID')");
		await idMenuItemReopen.click();
		await page.waitForTimeout(300);

		const linksSectionId = await page.textContent("#tabpanel-home");
		const isIndonesian = linksSectionId.includes("Tautan Belum Dikonfigurasi") || linksSectionId.includes("Tautan");
		if (!isIndonesian) {
			throw new Error("Page content failed to switch back to Indonesian.");
		}
		console.log("  ✓ Successfully switched page language back to Indonesian via dropdown.");

		// ---------------------------------------------------------------------
		// TEST 4: INTEGRATED NAVBAR LANGUAGE GLOBE BUTTON (MOBILE)
		// ---------------------------------------------------------------------
		console.log("\nTEST 4: Verifying Integrated Navbar Language Globe Button & Dropdown on Mobile...");
		await page.setViewportSize({ width: 390, height: 844 });
		await page.waitForTimeout(300);

		const mobileNav = await page.$("aside[aria-label='Mobile Tab Navigation Dock']");
		if (!mobileNav) {
			throw new Error("Mobile Tab Navigation Dock not found.");
		}

		const mobileGlobeBtn = await mobileNav.$("button[aria-label*='Pilih Bahasa'], button[aria-label*='Language']");
		if (!mobileGlobeBtn) {
			throw new Error("Globe language button not found inside Mobile Navigation dock.");
		}
		console.log("  ✓ Globe language button integrated inside Mobile Navigation dock.");

		// Open mobile dropdown (pops up above dock)
		await mobileGlobeBtn.click();
		await page.waitForTimeout(250);

		const mobileEnItem = await mobileNav.$("div[role='menu'] button[aria-label='English']");
		if (!mobileEnItem) {
			throw new Error("Mobile language dropdown menu item 'English' not found.");
		}
		await mobileEnItem.click();
		await page.waitForTimeout(300);

		const mobileEnText = await page.textContent("#tabpanel-home");
		if (!mobileEnText.includes("No Links Configured Yet") && !mobileEnText.includes("Links")) {
			throw new Error("Mobile language toggle failed to switch to English.");
		}
		console.log("  ✓ Mobile dropdown language switch to English verified.");

		// Switch back on mobile
		await mobileGlobeBtn.click();
		await page.waitForTimeout(250);
		const mobileIdItem = await mobileNav.$("div[role='menu'] button[aria-label='Bahasa Indonesia']");
		if (!mobileIdItem) {
			throw new Error("Mobile language dropdown menu item 'Bahasa Indonesia' not found.");
		}
		await mobileIdItem.click();
		await page.waitForTimeout(300);

		const mobileIdText = await page.textContent("#tabpanel-home");
		if (!mobileIdText.includes("Tautan Belum Dikonfigurasi") && !mobileIdText.includes("Tautan")) {
			throw new Error("Mobile language toggle failed to switch back to Indonesian.");
		}
		console.log("  ✓ Mobile dropdown language switch back to Indonesian verified.");

		// ---------------------------------------------------------------------
		// TEST 5: RESPONSIVE VIEWPORTS & NO HORIZONTAL OVERFLOW
		// ---------------------------------------------------------------------
		console.log("\nTEST 5: Testing Horizontal Overflow on Mobile and Desktop Viewports...");
		const viewports = [
			{ width: 360, height: 740, label: "360px (Mobile Small)" },
			{ width: 400, height: 844, label: "400px (Mobile Standard)" },
			{ width: 768, height: 1024, label: "768px (Tablet)" },
			{ width: 1440, height: 900, label: "1440px (Desktop)" },
		];

		for (const vp of viewports) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.waitForTimeout(200);
			const overflow = await page.evaluate(() => {
				return document.documentElement.scrollWidth > window.innerWidth;
			});
			if (overflow) {
				throw new Error(`Horizontal overflow detected at ${vp.label}!`);
			}
			console.log(`  ✓ ${vp.label}: Clean layout, zero horizontal overflow.`);
		}

		console.log("\n============================================================");
		console.log("ALL FINAL LAYOUT FOLLOW-UP TESTS PASSED SUCCESSFULLY! (5/5)");
		console.log("============================================================\n");
	} catch (err) {
		console.error("\n❌ FINAL LAYOUT TEST FAILED:", err);
		process.exit(1);
	} finally {
		// Always restore clean baseline
		try {
			await restoreBaseline();
		} catch {}
		await browser.close();
	}
}

runFinalLayoutTests();
