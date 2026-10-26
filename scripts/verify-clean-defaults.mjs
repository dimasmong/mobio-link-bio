import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = (process.env.TEST_URL || "http://localhost:5173").trim();
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-artifacts/screenshots/clean-defaults");

if (!fs.existsSync(SCREENSHOT_DIR)) {
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
	console.log("============================================================");
	console.log("MOBIO LINK BIO — CLEAN DEFAULTS VERIFICATION SUITE");
	console.log("============================================================\n");

	const report = {
		publicTitleClean: false,
		publicNameAndHandleClean: false,
		avatarMonogramClean: false,
		linksEmptyStateClean: false,
		exploreEmptyStateClean: false,
		contactEmptyStateClean: false,
		bilingualToggleClean: false,
		noPersonalDataFound: false,
		studioOverviewClean: false,
		studioProfileEditorClean: false,
		studioLinksClean: false,
		studioContactClean: false,
		responsiveChecks: {},
		screenshots: [],
	};

	let browser;
	try {
		browser = await chromium.launch({ channel: "msedge", headless: true });
	} catch (e) {
		browser = await chromium.launch({ channel: "chrome", headless: true });
	}

	const context = await browser.newContext();
	const page = await context.newPage();

	const authHeaders = {
		"X-Mobio-Dev-Identity": "admin@localhost.local",
	};

	// -------------------------------------------------------------------------
	// 1. PUBLIC HOMEPAGE DEFAULT VERIFICATION
	// -------------------------------------------------------------------------
	console.log("TEST 1: Verifying Public Homepage Neutral Defaults...");
	await page.setViewportSize({ width: 1440, height: 900 });
	const res = await page.goto(BASE_URL, { waitUntil: "load" });

	const title = await page.title();
	report.publicTitleClean =
		title.includes("MOBIO Link in Bio") ||
		title.includes("MOBIO Link Bio");
	console.log(`  ✓ Page Title: "${title}" (${report.publicTitleClean ? "PASS" : "FAIL"})`);

	const h1 = (await page.textContent("h1"))?.trim();
	const handle = (await page.textContent("header span"))?.trim();
	report.publicNameAndHandleClean = h1 === "Your Name" && handle === "@username";
	console.log(`  ✓ Identity: Name="${h1}", Handle="${handle}" (${report.publicNameAndHandleClean ? "PASS" : "FAIL"})`);

	// Check monogram avatar
	const avatarMonogram = await page.textContent("header div[aria-label='Your Name']");
	report.avatarMonogramClean = avatarMonogram?.trim() === "YN";
	console.log(`  ✓ Monogram Avatar Initials: "${avatarMonogram?.trim()}" (${report.avatarMonogramClean ? "PASS" : "FAIL"})`);

	// Check empty links state
	const linkSectionText = await page.textContent("#tabpanel-home");
	report.linksEmptyStateClean =
		linkSectionText.includes("Tautan Belum Dikonfigurasi") ||
		linkSectionText.includes("No Links Configured Yet");
	console.log(`  ✓ Links Empty State: ${report.linksEmptyStateClean ? "PASS" : "FAIL"}`);

	// Capture Desktop Home
	const homeDesktopShot = path.join(SCREENSHOT_DIR, "clean-home-desktop.png");
	await page.screenshot({ path: homeDesktopShot, fullPage: false });
	report.screenshots.push(homeDesktopShot);

	// Capture Mobile Home (390px)
	await page.setViewportSize({ width: 390, height: 844 });
	const homeMobileShot = path.join(SCREENSHOT_DIR, "clean-home-mobile.png");
	await page.screenshot({ path: homeMobileShot, fullPage: false });
	report.screenshots.push(homeMobileShot);
	await page.setViewportSize({ width: 1440, height: 900 });

	// -------------------------------------------------------------------------
	// 2. EXPLORE TAB EMPTY STATE
	// -------------------------------------------------------------------------
	console.log("\nTEST 2: Verifying Explore Tab Neutral Empty State...");
	await page.click("button:has-text('Explore'), button:has-text('Eksplorasi')");
	await page.waitForTimeout(200);
	const exploreText = await page.textContent("#tabpanel-explore");
	report.exploreEmptyStateClean =
		exploreText.includes("Eksplorasi Belum Dikonfigurasi") ||
		exploreText.includes("No Highlights Configured Yet");
	console.log(`  ✓ Explore Empty State: ${report.exploreEmptyStateClean ? "PASS" : "FAIL"}`);

	const exploreShot = path.join(SCREENSHOT_DIR, "clean-explore-tab.png");
	await page.screenshot({ path: exploreShot, fullPage: false });
	report.screenshots.push(exploreShot);

	// -------------------------------------------------------------------------
	// 3. CONTACT TAB EMPTY STATE
	// -------------------------------------------------------------------------
	console.log("\nTEST 3: Verifying Contact Tab Neutral Empty State...");
	await page.click("button:has-text('Contact'), button:has-text('Kontak')");
	await page.waitForTimeout(200);
	const contactText = await page.textContent("#tabpanel-contact");
	report.contactEmptyStateClean =
		contactText.includes("Kontak Belum Dikonfigurasi") ||
		contactText.includes("No Contact Methods Configured Yet");
	console.log(`  ✓ Contact Empty State: ${report.contactEmptyStateClean ? "PASS" : "FAIL"}`);

	const contactShot = path.join(SCREENSHOT_DIR, "clean-contact-tab.png");
	await page.screenshot({ path: contactShot, fullPage: false });
	report.screenshots.push(contactShot);

	// -------------------------------------------------------------------------
	// 4. BILINGUAL TOGGLE CHECK
	// -------------------------------------------------------------------------
	console.log("\nTEST 4: Verifying Bilingual Toggle (ID / EN)...");
	await page.click("button:has-text('Home'), button:has-text('Beranda')");
	await page.waitForTimeout(200);

	// Open dropdown from navbar globe button if present
	const globeBtn = await page.$("button[aria-label*='Pilih Bahasa'], button[aria-label*='Language'], button[aria-haspopup='menu']");
	if (globeBtn) {
		await globeBtn.click();
		await page.waitForTimeout(200);
	}
	await page.click("button:has-text('EN')");
	await page.waitForTimeout(200);
	const enLinksText = await page.textContent("#tabpanel-home");
	const hasEnglish = enLinksText.includes("No Links Configured Yet");

	if (globeBtn) {
		await globeBtn.click();
		await page.waitForTimeout(200);
	}
	await page.click("button:has-text('ID')");
	await page.waitForTimeout(200);
	const idLinksText = await page.textContent("#tabpanel-home");
	const hasIndonesian = idLinksText.includes("Tautan Belum Dikonfigurasi");
	report.bilingualToggleClean = hasEnglish && hasIndonesian;
	console.log(`  ✓ Bilingual Toggle: ${report.bilingualToggleClean ? "PASS" : "FAIL"}`);

	// -------------------------------------------------------------------------
	// 5. AUDIT PAGE VISIBLE CONTENT FOR ANY PERSONALIZED DATA
	// -------------------------------------------------------------------------
	console.log("\nTEST 5: Auditing Page Visible Text for Residual Personal Information...");
	const bodyText = await page.innerText("body");
	const hasDimas = bodyText.toLowerCase().includes("dimas");
	const hasPersonalDomain = bodyText.toLowerCase().includes("dimasmong");
	report.noPersonalDataFound = !hasDimas && !hasPersonalDomain;
	console.log(`  ✓ Personal Data Audit in Page Text: ${report.noPersonalDataFound ? "PASS (Zero personal strings found)" : "FAIL"}`);

	// -------------------------------------------------------------------------
	// 6. MOBIO STUDIO CLEAN DEFAULTS
	// -------------------------------------------------------------------------
	console.log("\nTEST 6: Verifying MOBIO Studio Dashboard Initial Clean Defaults...");
	await page.setExtraHTTPHeaders(authHeaders);
	await page.goto(`${BASE_URL}/studio`, { waitUntil: "load" });

	const overviewContent = await page.textContent("main");
	report.studioOverviewClean =
		overviewContent.includes("Entitas Konten D1") &&
		overviewContent.includes("Tautan Vertikal") &&
		overviewContent.includes("Metode Kontak") &&
		overviewContent.includes("Versi Aktif");
	console.log(`  ✓ Studio Overview Clean: ${report.studioOverviewClean ? "PASS" : "FAIL"}`);

	const studioOverviewShot = path.join(SCREENSHOT_DIR, "clean-studio-overview.png");
	await page.screenshot({ path: studioOverviewShot, fullPage: false });
	report.screenshots.push(studioOverviewShot);

	// Profile Editor tab
	await page.click("button:has-text('Profile')");
	await page.waitForTimeout(200);
	const pNameVal = await page.inputValue("#p-name");
	const pHandleVal = await page.inputValue("#p-handle");
	const pAvatarVal = await page.inputValue("#p-avatar");
	report.studioProfileEditorClean = pNameVal === "Your Name" && pHandleVal === "@username" && pAvatarVal === "";
	console.log(`  ✓ Profile Editor: Name="${pNameVal}", Handle="${pHandleVal}", Avatar="${pAvatarVal}" (${report.studioProfileEditorClean ? "PASS" : "FAIL"})`);

	const studioProfileShot = path.join(SCREENSHOT_DIR, "clean-studio-profile.png");
	await page.screenshot({ path: studioProfileShot, fullPage: false });
	report.screenshots.push(studioProfileShot);

	// Links Editor tab
	await page.click("button:has-text('Links')");
	await page.waitForTimeout(200);
	const linksContent = await page.textContent("main");
	report.studioLinksClean = linksContent.includes("Belum ada tautan di dalam draft");
	console.log(`  ✓ Links Editor Clean Empty State: ${report.studioLinksClean ? "PASS" : "FAIL"}`);

	// Contact Editor tab
	await page.click("button:has-text('Contact')");
	await page.waitForTimeout(200);
	const contactContent = await page.textContent("main");
	report.studioContactClean = contactContent.includes("Belum ada metode kontak di dalam draft");
	console.log(`  ✓ Contact Editor Clean Empty State: ${report.studioContactClean ? "PASS" : "FAIL"}`);

	// -------------------------------------------------------------------------
	// 7. RESPONSIVENESS CHECK
	// -------------------------------------------------------------------------
	console.log("\nTEST 7: Testing Responsiveness on Clean Defaults...");
	const viewports = [
		{ name: "360px (Mobile Small)", width: 360, height: 740 },
		{ name: "400px (Mobile Standard)", width: 400, height: 840 },
		{ name: "768px (Tablet)", width: 768, height: 1024 },
		{ name: "1440px (Desktop)", width: 1440, height: 900 },
	];

	await page.goto(BASE_URL, { waitUntil: "load" });
	for (const vp of viewports) {
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.waitForTimeout(100);
		const overflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > document.documentElement.clientWidth;
		});
		report.responsiveChecks[vp.name] = !overflow ? "PASS (No overflow)" : "FAIL";
		console.log(`  ✓ Viewport ${vp.name}: ${!overflow ? "PASS" : "FAIL"}`);
	}

	await browser.close();

	console.log("\n============================================================");
	console.log("CLEAN DEFAULTS VERIFICATION SUMMARY");
	console.log("============================================================");
	console.log(JSON.stringify(report, null, 2));

	const allClean =
		report.publicTitleClean &&
		report.publicNameAndHandleClean &&
		report.avatarMonogramClean &&
		report.linksEmptyStateClean &&
		report.exploreEmptyStateClean &&
		report.contactEmptyStateClean &&
		report.bilingualToggleClean &&
		report.noPersonalDataFound &&
		report.studioOverviewClean &&
		report.studioProfileEditorClean &&
		report.studioLinksClean &&
		report.studioContactClean;

	if (allClean) {
		console.log("\n🎉 ALL CLEAN DEFAULTS VERIFICATIONS PASSED 100%!");
		process.exit(0);
	} else {
		console.error("\n❌ ONE OR MORE CHECKS FAILED.");
		process.exit(1);
	}
}

run().catch((err) => {
	console.error("FATAL ERROR:", err);
	process.exit(1);
});
