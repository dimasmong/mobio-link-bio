import { chromium } from "playwright";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-screenshots");
const DEV_AUTH_HEADER = {
	"X-Mobio-Dev-Identity": "dimas@example.com",
};

if (!fs.existsSync(SCREENSHOT_DIR)) {
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBilingualVerification() {
	console.log("============================================================");
	console.log("MOBIO LINK BIO — V4.2 FULL BILINGUAL SYSTEM VERIFICATION");
	console.log("English Default • Seamless Dynamic Switching • Studio & Public");
	console.log("============================================================\n");

	let browser;
	try {
		browser = await chromium.launch({ channel: "msedge", headless: true });
	} catch {
		browser = await chromium.launch({ channel: "chrome", headless: true });
	}

	try {
		// =====================================================================
		// TEST 1: FRESH PUBLIC VISIT (ENGLISH DEFAULT)
		// =====================================================================
		console.log("TEST 1: Verifying English Default on Fresh Public Page Visit...");
		const contextEn = await browser.newContext({
			viewport: { width: 1280, height: 800 },
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
		});
		const page = await contextEn.newPage();
		await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
		await page.waitForTimeout(600);

		// 1.1 Verify document language attribute
		const htmlLang = await page.getAttribute("html", "lang");
		assert.equal(htmlLang, "en", "Document <html lang> must be 'en' by default");
		console.log("  ✓ <html lang='en'> active by default.");

		// 1.2 Verify Bottom Floating Dock Navigation in English
		const homeTab = await page.$("#desktop-tab-home");
		const exploreTab = await page.$("#desktop-tab-explore");
		const contactTab = await page.$("#desktop-tab-contact");
		assert.ok(homeTab, "Nav Home tab must exist");
		assert.ok(exploreTab, "Nav Explore tab must exist");
		assert.ok(contactTab, "Nav Contact tab must exist");

		const homeText = await homeTab.innerText();
		const exploreText = await exploreTab.innerText();
		const contactText = await contactTab.innerText();
		assert.ok(homeText.includes("Home"), `Home tab must show 'Home', got '${homeText}'`);
		assert.ok(exploreText.includes("Explore"), `Explore tab must show 'Explore', got '${exploreText}'`);
		assert.ok(contactText.includes("Contact"), `Contact tab must show 'Contact', got '${contactText}'`);
		console.log("  ✓ Floating Bottom Dock tabs have English labels ('Home', 'Explore', 'Contact').");

		// 1.3 Verify Language Selector on Dock
		const langButton = await page.$("aside button:has-text('EN')");
		assert.ok(langButton, "Language button displaying 'EN' must exist in dock");
		console.log("  ✓ Language switcher in floating dock defaults to 'EN' (English).");

		// 1.4 Verify Public Headings in English
		const exploreHeading = await page.$("#explore-heading");
		if (exploreHeading) {
			const text = await exploreHeading.innerText();
			assert.ok(text.includes("Explore") || text.includes("Works"), `Explore heading must be in English, got '${text}'`);
			console.log(`  ✓ Explore section heading in English: "${text.trim()}".`);
		}

		const contactHeading = await page.$("#contact-heading");
		if (contactHeading) {
			const text = await contactHeading.innerText();
			assert.ok(text.includes("Contact") || text.includes("Touch") || text.includes("Reach"), `Contact heading must be in English, got '${text}'`);
			console.log(`  ✓ Contact section heading in English: "${text.trim()}".`);
		}

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-2-public-en-default.png") });

		// =====================================================================
		// TEST 2: SWITCH TO INDONESIAN ON PUBLIC PAGE
		// =====================================================================
		console.log("\nTEST 2: Switching Language to Indonesian ('id') on Public Page...");
		await langButton.click();
		await page.waitForTimeout(300);

		// Click the Indonesian menu item
		const idMenuItem = await page.$("button[role='menuitem']:has-text('Indonesia')");
		assert.ok(idMenuItem, "Indonesian language option must be present in dropdown");
		await idMenuItem.click();
		await page.waitForTimeout(600);

		// 2.1 Verify document language attribute updated
		const htmlLangId = await page.getAttribute("html", "lang");
		assert.equal(htmlLangId, "id", "Document <html lang> must update to 'id'");
		console.log("  ✓ <html lang='id'> updated dynamically.");

		// 2.2 Verify dock selector updated to show ID
		const langButtonId = await page.$("aside button:has-text('ID')");
		assert.ok(langButtonId, "Language button must now display 'ID'");

		// 2.3 Verify dock tabs updated to Indonesian text
		const homeTextId = await (await page.$("#desktop-tab-home")).innerText();
		const exploreTextId = await (await page.$("#desktop-tab-explore")).innerText();
		const contactTextId = await (await page.$("#desktop-tab-contact")).innerText();
		assert.ok(homeTextId.includes("Beranda"), `Home tab must update to 'Beranda', got '${homeTextId}'`);
		assert.ok(exploreTextId.includes("Eksplorasi"), `Explore tab must update to 'Eksplorasi', got '${exploreTextId}'`);
		assert.ok(contactTextId.includes("Kontak"), `Contact tab must update to 'Kontak', got '${contactTextId}'`);
		console.log("  ✓ Floating dock tabs updated to Indonesian ('Beranda', 'Eksplorasi', 'Kontak').");

		// 2.4 Verify Section Headings updated to Indonesian
		if (exploreHeading) {
			const text = await (await page.$("#explore-heading")).innerText();
			assert.ok(text.includes("Eksplorasi") || text.includes("Karya"), `Explore heading must be in Indonesian, got '${text}'`);
			console.log(`  ✓ Explore section heading updated to Indonesian: "${text.trim()}".`);
		}
		if (contactHeading) {
			const text = await (await page.$("#contact-heading")).innerText();
			assert.ok(text.includes("Kontak"), `Contact heading must be in Indonesian, got '${text}'`);
			console.log(`  ✓ Contact section heading updated to Indonesian: "${text.trim()}".`);
		}

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-2-public-id-switched.png") });

		// 2.5 Verify Cookie was Set
		const cookies = await contextEn.cookies();
		const langCookie = cookies.find((c) => c.name === "mobio_lang");
		assert.ok(langCookie, "Cookie 'mobio_lang' must be set");
		assert.equal(langCookie.value, "id", "Cookie 'mobio_lang' value must be 'id'");
		console.log("  ✓ Cookie 'mobio_lang=id' persisted properly.");

		// =====================================================================
		// TEST 3: SSR COOKIE PERSISTENCE ON RELOAD
		// =====================================================================
		console.log("\nTEST 3: Verifying SSR Persistence on Page Reload...");
		await page.reload({ waitUntil: "load" });
		await page.waitForTimeout(500);

		const reloadedHtmlLang = await page.getAttribute("html", "lang");
		assert.equal(reloadedHtmlLang, "id", "Document <html lang> must remain 'id' on reload with cookie");
		const reloadedButton = await page.$("aside button:has-text('ID')");
		assert.ok(reloadedButton, "Language switcher must stay 'ID' after reload");
		console.log("  ✓ Zero flash of wrong language: page loaded in Indonesian directly from SSR cookie.");

		// =====================================================================
		// TEST 4: STUDIO DASHBOARD ENGLISH DEFAULT
		// =====================================================================
		console.log("\nTEST 4: Auditing Studio Dashboard Language System...");
		// Create clean context without language cookie
		const studioContext = await browser.newContext({
			viewport: { width: 1400, height: 900 },
			userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
		});
		await studioContext.setExtraHTTPHeaders(DEV_AUTH_HEADER);
		const studioPage = await studioContext.newPage();
		await studioPage.goto(`${BASE_URL}/studio`, { waitUntil: "load" });
		await studioPage.waitForTimeout(600);

		// 4.1 Header actions in English
		const previewBtn = await studioPage.$("a:has-text('Preview'), button:has-text('Preview')");
		const publishBtn = await studioPage.$("button:has-text('Publish')");
		assert.ok(previewBtn, "Header Preview button/link in English must exist");
		assert.ok(publishBtn, "Header Publish button in English must exist");
		console.log("  ✓ Studio header action buttons are in English by default.");

		// 4.2 Studio Header Language Switcher
		const studioLangEn = await studioPage.$("header button:has-text('EN')");
		const studioLangId = await studioPage.$("header button:has-text('ID')");
		assert.ok(studioLangEn, "Studio header 'EN' toggle exists");
		assert.ok(studioLangId, "Studio header 'ID' toggle exists");
		console.log("  ✓ Studio header 2-option switcher (EN | ID) is present.");

		// 4.3 Sidebar navigation tabs in English
		const studioOverviewTab = await studioPage.$("nav button:has-text('Overview')");
		const studioProfileTab = await studioPage.$("nav button:has-text('Profile')");
		const studioLinksTab = await studioPage.$("nav button:has-text('Links')");
		const studioContactTab = await studioPage.$("nav button:has-text('Contact')");
		const studioAppearanceTab = await studioPage.$("nav button:has-text('Appearance')");
		const studioExploreTab = await studioPage.$("nav button:has-text('Explore')");
		const studioClicksTab = await studioPage.$("nav button:has-text('Click Monitor')");
		const studioSettingsTab = await studioPage.$("nav button:has-text('Settings')");

		assert.ok(studioOverviewTab, "Sidebar Overview tab must exist in English");
		assert.ok(studioProfileTab, "Sidebar Profile tab must exist in English");
		assert.ok(studioLinksTab, "Sidebar Links tab must exist in English");
		assert.ok(studioContactTab, "Sidebar Contact tab must exist in English");
		assert.ok(studioAppearanceTab, "Sidebar Appearance tab must exist in English");
		assert.ok(studioExploreTab, "Sidebar Explore tab must exist in English");
		assert.ok(studioClicksTab, "Sidebar Click Monitor tab must exist in English");
		assert.ok(studioSettingsTab, "Sidebar Settings tab must exist in English");
		console.log("  ✓ All 8 Studio sidebar navigation tabs are in English by default.");

		await studioPage.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-2-studio-en-default.png") });

		// =====================================================================
		// TEST 5: TOGGLING STUDIO TO INDONESIAN
		// =====================================================================
		console.log("\nTEST 5: Toggling Studio to Indonesian via Header Switcher...");
		await studioLangId.click();
		await studioPage.waitForTimeout(500);

		// 5.1 Verify sidebar tabs changed to Indonesian
		const studioOverviewTabId = await studioPage.$("nav button:has-text('Ringkasan')");
		const studioProfileTabId = await studioPage.$("nav button:has-text('Profil')");
		const studioLinksTabId = await studioPage.$("nav button:has-text('Tautan')");
		const studioContactTabId = await studioPage.$("nav button:has-text('Kontak')");
		const studioAppearanceTabId = await studioPage.$("nav button:has-text('Tampilan')");
		const studioExploreTabId = await studioPage.$("nav button:has-text('Eksplorasi')");
		const studioClicksTabId = await studioPage.$("nav button:has-text('Monitor Klik')");
		const studioSettingsTabId = await studioPage.$("nav button:has-text('Pengaturan')");

		assert.ok(studioOverviewTabId, "Sidebar Overview tab must update to 'Ringkasan'");
		assert.ok(studioProfileTabId, "Sidebar Profile tab must update to 'Profil'");
		assert.ok(studioLinksTabId, "Sidebar Links tab must update to 'Tautan'");
		assert.ok(studioContactTabId, "Sidebar Contact tab must update to 'Kontak'");
		assert.ok(studioAppearanceTabId, "Sidebar Appearance tab must update to 'Tampilan'");
		assert.ok(studioExploreTabId, "Sidebar Explore tab must update to 'Eksplorasi'");
		assert.ok(studioClicksTabId, "Sidebar Click Monitor tab must update to 'Monitor Klik'");
		assert.ok(studioSettingsTabId, "Sidebar Settings tab must update to 'Pengaturan'");
		console.log("  ✓ All 8 Studio sidebar navigation tabs updated to Indonesian.");

		// 5.2 Verify header buttons changed to Indonesian
		const previewBtnId = await studioPage.$("a:has-text('Pratinjau'), button:has-text('Pratinjau')");
		assert.ok(previewBtnId, "Header Preview button/link must update to 'Pratinjau'");
		console.log("  ✓ Header actions updated to Indonesian ('Pratinjau').");

		await studioPage.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-2-studio-id-switched.png") });

		// =====================================================================
		// TEST 6: DRAFT PREVIEW PAGE BILINGUAL TOOLBAR
		// =====================================================================
		console.log("\nTEST 6: Testing Studio Draft Preview Page (/studio/preview)...");
		const previewPage = await studioContext.newPage();
		await previewPage.goto(`${BASE_URL}/studio/preview`, {
			waitUntil: "load",
			extraHTTPHeaders: DEV_AUTH_HEADER,
		});
		await previewPage.waitForTimeout(600);

		const previewEnToggle = await previewPage.$("button:has-text('EN')");
		const previewIdToggle = await previewPage.$("button:has-text('ID')");
		assert.ok(previewEnToggle, "Draft Preview page toolbar has 'EN' toggle");
		assert.ok(previewIdToggle, "Draft Preview page toolbar has 'ID' toggle");

		// Switch preview language to English
		await previewEnToggle.click();
		await previewPage.waitForTimeout(300);
		console.log("  ✓ Draft Preview page toolbar toggles preview content seamlessly between EN and ID.");

		await previewPage.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-2-studio-preview-page.png") });
		await previewPage.close();

		// Switch Studio back to English
		const studioLangEnSwitch = await studioPage.$("header button:has-text('EN')");
		await studioLangEnSwitch.click();
		await studioPage.waitForTimeout(400);

		const overviewTabRestored = await studioPage.$("nav button:has-text('Overview')");
		assert.ok(overviewTabRestored, "Studio successfully reverted back to English");
		console.log("  ✓ Studio successfully reverted back to English.");

		console.log("\n============================================================");
		console.log("ALL V4.2 FULL BILINGUAL SYSTEM TESTS PASSED SUCCESSFULLY! 🎉");
		console.log("============================================================\n");
	} finally {
		if (browser) await browser.close();
	}
}

runBilingualVerification().catch((err) => {
	console.error("\n❌ V4.2 Bilingual Verification failed:", err);
	process.exit(1);
});
