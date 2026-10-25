import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";
const ARTIFACT_DIR = "C:/Users/Dimas Mong/.gemini/antigravity/brain/e7780407-5c29-4c73-86e2-b40c63c8185f";
const TEST_ARTIFACTS_DIR = path.resolve("./test-artifacts/screenshots");

if (!fs.existsSync(TEST_ARTIFACTS_DIR)) {
	fs.mkdirSync(TEST_ARTIFACTS_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
	fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
	console.log(`Starting App-Like Tabs verification on ${BASE_URL}...`);

	let browser;
	try {
		browser = await chromium.launch({ channel: "msedge", headless: true });
	} catch (e) {
		browser = await chromium.launch({ channel: "chrome", headless: true });
	}

	const context = await browser.newContext();
	const page = await context.newPage();

	const consoleErrors = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (err) => consoleErrors.push(err.message));

	const results = {
		ssrCheck: false,
		initialHomeTabOnly: false,
		desktopTabSwitching: false,
		mobileTabSwitching: false,
		browserHistoryBackForward: false,
		directHashNavigation: false,
		keyboardTabsNavigation: false,
		cleanNeutralEmptyStates: false,
		languageToggle: false,
		viewports: {},
		consoleErrors: [],
	};

	// 1. SSR & Initial Home Tab Check
	const response = await page.goto(BASE_URL, { waitUntil: "networkidle" });
	results.ssrCheck = response && response.status() === 200;
	console.log(`1. SSR Status 200: ${results.ssrCheck ? "PASS" : "FAIL"}`);

	// Check that Home tab is initially visible, while Explore & Contact panels are hidden
	const isHomeVisible = await page.isVisible("#tabpanel-home");
	const isExploreVisible = await page.isVisible("#tabpanel-explore");
	const isContactVisible = await page.isVisible("#tabpanel-contact");
	results.initialHomeTabOnly = isHomeVisible && !isExploreVisible && !isContactVisible;
	console.log(
		`2. Initial Home Tab Only (Home: ${isHomeVisible}, Explore: ${isExploreVisible}, Contact: ${isContactVisible}): ${
			results.initialHomeTabOnly ? "PASS" : "FAIL"
		}`
	);

	// 3. Desktop Tab Switching (1440px)
	await page.setViewportSize({ width: 1440, height: 900 });

	// Click Explore tab on desktop
	await page.click("#desktop-tab-explore");
	await page.waitForTimeout(300);
	const exploreAfterClick = await page.isVisible("#tabpanel-explore");
	const homeAfterExplore = await page.isVisible("#tabpanel-home");
	const hashAfterExplore = await page.evaluate(() => window.location.hash);

	// Click Contact tab on desktop
	await page.click("#desktop-tab-contact");
	await page.waitForTimeout(300);
	const contactAfterClick = await page.isVisible("#tabpanel-contact");
	const exploreAfterContact = await page.isVisible("#tabpanel-explore");
	const hashAfterContact = await page.evaluate(() => window.location.hash);

	// Click Home tab on desktop
	await page.click("#desktop-tab-home");
	await page.waitForTimeout(300);
	const homeAfterReturn = await page.isVisible("#tabpanel-home");
	const contactAfterReturn = await page.isVisible("#tabpanel-contact");

	results.desktopTabSwitching =
		exploreAfterClick &&
		!homeAfterExplore &&
		hashAfterExplore === "#explore" &&
		contactAfterClick &&
		!exploreAfterContact &&
		hashAfterContact === "#contact" &&
		homeAfterReturn &&
		!contactAfterReturn;

	console.log(`3. Desktop Tab Switching: ${results.desktopTabSwitching ? "PASS" : "FAIL"}`);

	// 4. Browser History Back / Forward navigation
	// Currently at #home. Let's click #desktop-tab-explore -> #desktop-tab-contact
	await page.click("#desktop-tab-explore");
	await page.waitForTimeout(200);
	await page.click("#desktop-tab-contact");
	await page.waitForTimeout(200);

	// Press browser Back
	await page.goBack();
	await page.waitForTimeout(250);
	const backIsExplore = await page.isVisible("#tabpanel-explore");

	// Press browser Back again
	await page.goBack();
	await page.waitForTimeout(250);
	const backIsHome = await page.isVisible("#tabpanel-home");

	// Press browser Forward
	await page.goForward();
	await page.waitForTimeout(250);
	const forwardIsExplore = await page.isVisible("#tabpanel-explore");

	results.browserHistoryBackForward = backIsExplore && backIsHome && forwardIsExplore;
	console.log(`4. Browser History Back/Forward: ${results.browserHistoryBackForward ? "PASS" : "FAIL"}`);

	// 5. Direct Hash URL Navigation
	await page.goto(`${BASE_URL}/#contact`, { waitUntil: "networkidle" });
	await page.waitForTimeout(250);
	const directContactVisible = await page.isVisible("#tabpanel-contact");
	const directHomeHidden = !(await page.isVisible("#tabpanel-home"));

	await page.goto(`${BASE_URL}/#explore`, { waitUntil: "networkidle" });
	await page.waitForTimeout(250);
	const directExploreVisible = await page.isVisible("#tabpanel-explore");

	results.directHashNavigation = directContactVisible && directHomeHidden && directExploreVisible;
	console.log(`5. Direct Hash URL Navigation: ${results.directHashNavigation ? "PASS" : "FAIL"}`);

	// 6. Mobile Tab Switching (400px)
	await page.setViewportSize({ width: 400, height: 840 });
	await page.goto(BASE_URL, { waitUntil: "networkidle" });
	await page.waitForTimeout(200);

	await page.click("#mobile-tab-explore");
	await page.waitForTimeout(300);
	const mobileExploreVisible = await page.isVisible("#tabpanel-explore");

	await page.click("#mobile-tab-contact");
	await page.waitForTimeout(300);
	const mobileContactVisible = await page.isVisible("#tabpanel-contact");

	await page.click("#mobile-tab-home");
	await page.waitForTimeout(300);
	const mobileHomeVisible = await page.isVisible("#tabpanel-home");

	results.mobileTabSwitching = mobileExploreVisible && mobileContactVisible && mobileHomeVisible;
	console.log(`6. Mobile Tab Switching: ${results.mobileTabSwitching ? "PASS" : "FAIL"}`);

	// 7. Keyboard Tabs Navigation (ARIA arrow keys)
	await page.focus("#mobile-tab-home");
	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(200);
	const keyboardExploreVisible = await page.isVisible("#tabpanel-explore");

	await page.keyboard.press("ArrowRight");
	await page.waitForTimeout(200);
	const keyboardContactVisible = await page.isVisible("#tabpanel-contact");

	await page.keyboard.press("ArrowLeft");
	await page.waitForTimeout(200);
	const keyboardBackToExplore = await page.isVisible("#tabpanel-explore");

	results.keyboardTabsNavigation =
		keyboardExploreVisible && keyboardContactVisible && keyboardBackToExplore;
	console.log(`7. Keyboard Tabs Navigation: ${results.keyboardTabsNavigation ? "PASS" : "FAIL"}`);

	// 8. Clean Neutral Empty States Check
	// Verify that empty state cards are displayed professionally without fake demo links
	await page.goto(BASE_URL, { waitUntil: "networkidle" });
	const homeEmptyText = await page.textContent("#tabpanel-home");
	const hasHomeCleanEmptyState = homeEmptyText.includes("Tautan Belum Dikonfigurasi") || homeEmptyText.includes("No Links Configured");

	await page.click("#mobile-tab-explore");
	await page.waitForTimeout(200);
	const exploreEmptyText = await page.textContent("#tabpanel-explore");
	const hasExploreCleanEmptyState = exploreEmptyText.includes("Eksplorasi Belum Dikonfigurasi") || exploreEmptyText.includes("No Highlights Configured");

	await page.click("#mobile-tab-contact");
	await page.waitForTimeout(200);
	const contactEmptyText = await page.textContent("#tabpanel-contact");
	const hasContactCleanEmptyState = contactEmptyText.includes("Kontak Belum Dikonfigurasi") || contactEmptyText.includes("No Contact Methods Configured");

	results.cleanNeutralEmptyStates =
		hasHomeCleanEmptyState && hasExploreCleanEmptyState && hasContactCleanEmptyState;
	console.log(`8. Clean Neutral Empty States: ${results.cleanNeutralEmptyStates ? "PASS" : "FAIL"}`);

	// 9. Language Switcher Check
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(BASE_URL, { waitUntil: "networkidle" });
	await page.click('button[aria-label="English"]');
	await page.waitForTimeout(200);
	const enBio = await page.textContent("header p");

	await page.click('button[aria-label="Bahasa Indonesia"]');
	await page.waitForTimeout(200);
	const idBio = await page.textContent("header p");

	results.languageToggle =
		enBio.includes("Welcome to my Link in Bio") && idBio.includes("Selamat datang");
	console.log(`9. Language Toggle: ${results.languageToggle ? "PASS" : "FAIL"}`);

	// 10. Viewports Check (Responsive & No horizontal overflow)
	const viewports = [
		{ name: "360px (Small Mobile)", width: 360, height: 740 },
		{ name: "400px (Standard Mobile)", width: 400, height: 840 },
		{ name: "768px (Tablet)", width: 768, height: 1024 },
		{ name: "1024px (Small Desktop)", width: 1024, height: 800 },
		{ name: "1440px (Desktop)", width: 1440, height: 900 },
	];

	for (const vp of viewports) {
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.waitForTimeout(150);
		const overflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > document.documentElement.clientWidth;
		});
		results.viewports[vp.name] = !overflow ? "PASS (No overflow)" : "FAIL (Overflow)";
	}

	// 11. Screenshots
	// Desktop Screenshot (Home tab)
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(BASE_URL, { waitUntil: "networkidle" });
	await page.waitForTimeout(300);
	const desktopTarget = path.join(TEST_ARTIFACTS_DIR, "desktop.png");
	const desktopBrain = path.join(ARTIFACT_DIR, "desktop.png");
	await page.screenshot({ path: desktopTarget, fullPage: true });
	fs.copyFileSync(desktopTarget, desktopBrain);

	// Mobile Screenshot (Home tab)
	await page.setViewportSize({ width: 400, height: 840 });
	await page.waitForTimeout(300);
	const mobileTarget = path.join(TEST_ARTIFACTS_DIR, "mobile.png");
	const mobileBrain = path.join(ARTIFACT_DIR, "mobile.png");
	await page.screenshot({ path: mobileTarget, fullPage: true });
	fs.copyFileSync(mobileTarget, mobileBrain);

	results.consoleErrors = consoleErrors;

	await browser.close();

	console.log("\n================ APP-LIKE TABS TEST RESULTS ================");
	console.log(JSON.stringify(results, null, 2));
	console.log("============================================================");

	const allPass =
		results.ssrCheck &&
		results.initialHomeTabOnly &&
		results.desktopTabSwitching &&
		results.mobileTabSwitching &&
		results.browserHistoryBackForward &&
		results.directHashNavigation &&
		results.keyboardTabsNavigation &&
		results.cleanNeutralEmptyStates &&
		results.languageToggle &&
		results.consoleErrors.length === 0;

	if (!allPass) {
		console.error("Some tab verification tests did not pass!");
		process.exit(1);
	} else {
		console.log("ALL APP-LIKE TAB TESTS PASSED SUCCESSFULLY!");
	}
}

run().catch((err) => {
	console.error("Test execution failed:", err);
	process.exit(1);
});
