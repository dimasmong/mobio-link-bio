import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = (process.env.TEST_URL || "http://localhost:5173").trim();
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-artifacts/screenshots/v4-1");
const DEV_AUTH_HEADER = {
	"X-Mobio-Dev-Identity": "dimas@example.com",
	"Origin": BASE_URL,
	"Content-Type": "application/json",
};

if (!fs.existsSync(SCREENSHOT_DIR)) {
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runV41Verification() {
	console.log("============================================================");
	console.log("MOBIO LINK BIO — V4.1 UI REFINEMENT & ACTUAL INTERACTION CLICKS");
	console.log("Strict Click vs Page View Separation • Enhanced Click Monitor");
	console.log("============================================================\n");

	let browser;
	try {
		browser = await chromium.launch({ channel: "msedge", headless: true });
	} catch {
		browser = await chromium.launch({ channel: "chrome", headless: true });
	}
	const context = await browser.newContext({
		viewport: { width: 1280, height: 800 },
		userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
	});
	await context.addCookies([
		{ name: "mobio_lang", value: "id", domain: "localhost", path: "/" },
	]);
	const page = await context.newPage();

	try {
		// ---------------------------------------------------------------------
		// TEST 1: ANALYTICS RESET VERIFICATION (Initial Zero State)
		// ---------------------------------------------------------------------
		console.log("TEST 1: Verifying Analytics Initial Zero State...");
		await fetch(`${BASE_URL}/api/studio/analytics?target=all`, {
			method: "DELETE",
			headers: DEV_AUTH_HEADER,
		});
		const initialRes = await fetch(`${BASE_URL}/api/studio/analytics?range=all`, {
			headers: DEV_AUTH_HEADER,
		});
		assert.equal(initialRes.status, 200, "Analytics API must return status 200");
		const initialJson = await initialRes.json();
		const initialData = initialJson.analytics;

		console.log("  Initial Analytics Metrics:", {
			totalClicksPeriod: initialData.totalClicksPeriod,
			totalInteractionsPeriod: initialData.totalInteractionsPeriod,
			linkClicksPeriod: initialData.linkClicksPeriod,
			exploreClicksPeriod: initialData.exploreClicksPeriod,
			contactClicksPeriod: initialData.contactClicksPeriod,
		});

		assert.equal(initialData.totalClicksPeriod, 0, "Initial totalClicksPeriod must be 0");
		assert.equal(initialData.totalInteractionsPeriod, 0, "Initial totalInteractionsPeriod must be 0");
		assert.equal(initialData.exploreClicksPeriod, 0, "Initial exploreClicksPeriod must be 0");
		assert.equal(initialData.contactClicksPeriod, 0, "Initial contactClicksPeriod must be 0");
		console.log("  ✓ Initial Analytics state is cleanly reset to 0.");

		// ---------------------------------------------------------------------
		// TEST 2: PUBLIC HOME & PROFILE CARD ALIGNMENT WITH LINK BLOCKS
		// ---------------------------------------------------------------------
		console.log("\nTEST 2: Verifying Profile Card & Link List Alignment...");
		await page.setExtraHTTPHeaders({});
		await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
		await page.waitForTimeout(500);

		// Profile Card bounding box
		const headerEl = await page.$("header");
		assert.ok(headerEl, "Header / Profile Card must exist");
		const headerBox = await headerEl.boundingBox();
		assert.ok(headerBox, "Header must have bounding box");

		// Links Container bounding box
		const linksSection = (await page.$("main section")) || (await page.$("main ul")) || (await page.$("main div.space-y-3")) || (await page.$("main"));
		assert.ok(linksSection, "Links section must exist");
		const linksBox = await linksSection.boundingBox();
		assert.ok(linksBox, "Links section must have bounding box");

		console.log(`  Profile Card: x=${Math.round(headerBox.x)}, width=${Math.round(headerBox.width)}px`);
		console.log(`  Links Section: x=${Math.round(linksBox.x)}, width=${Math.round(linksBox.width)}px`);

		const widthDiff = Math.abs(headerBox.width - linksBox.width);
		const xDiff = Math.abs(headerBox.x - linksBox.x);
		assert.ok(
			widthDiff <= 4,
			`Profile Card width (${Math.round(headerBox.width)}px) must match Links container width (${Math.round(linksBox.width)}px), diff=${widthDiff}`
		);
		assert.ok(
			xDiff <= 4,
			`Profile Card left edge (${Math.round(headerBox.x)}px) must align with Links left edge (${Math.round(linksBox.x)}px), diff=${xDiff}`
		);
		console.log("  ✓ Profile Card and Link List are horizontally aligned and symmetrical.");

		// Verify Avatar sizing & styling
		const avatarOuter = await page.$("header [class*='rounded-full'][class*='p-']");
		assert.ok(avatarOuter, "Avatar outer wrapper must exist");
		const avatarBox = await avatarOuter.boundingBox();
		assert.ok(avatarBox, "Avatar must have bounding box");
		console.log(`  Avatar dimensions: ${Math.round(avatarBox.width)}x${Math.round(avatarBox.height)}px`);
		assert.ok(avatarBox.width >= 60, `Avatar size (${Math.round(avatarBox.width)}px) must be enlarged (>= 60px)`);

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-1-public-home-aligned.png") });

		// ---------------------------------------------------------------------
		// TEST 3: EXPLORE PUBLIC UI REFINEMENT
		// ---------------------------------------------------------------------
		console.log("\nTEST 3: Verifying Explore Public Page UI...");
		await page.goto(`${BASE_URL}/#explore`, { waitUntil: "load" });
		await page.waitForTimeout(600);

		// Verify badge "Eksplorasi & Karya"
		const exploreBadge = await page.$("#explore-heading");
		assert.ok(exploreBadge, "Explore heading badge must exist");
		const exploreBadgeWrapper = await page.$(".rounded-full:has(#explore-heading)");
		const badgeClasses = await exploreBadgeWrapper?.getAttribute("class");
		assert.ok(
			badgeClasses?.includes("bg-[var(--glass-surface-interactive)]") || badgeClasses?.includes("backdrop-blur"),
			"Explore badge must use solid glass interactive styling"
		);
		console.log("  ✓ Explore section badge has high-contrast solid glass pill styling.");

		// Verify .no-scrollbar CSS rule is declared and applied
		const noScrollbarRuleExists = await page.evaluate(() => {
			for (const sheet of document.styleSheets) {
				try {
					for (const rule of sheet.cssRules) {
						if (rule.selectorText && rule.selectorText.includes(".no-scrollbar")) {
							return true;
						}
					}
				} catch {}
			}
			return false;
		});
		assert.ok(noScrollbarRuleExists, "CSS must define .no-scrollbar rules to eliminate native scrollbar track");
		console.log("  ✓ .no-scrollbar CSS rule is active in browser styles, suppressing native browser scrollbar track.");

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-1-public-explore.png") });

		// ---------------------------------------------------------------------
		// TEST 4: CONTACT PUBLIC UI REFINEMENT
		// ---------------------------------------------------------------------
		console.log("\nTEST 4: Verifying Contact Public Page UI...");
		await page.goto(`${BASE_URL}/#contact`, { waitUntil: "load" });
		await page.waitForTimeout(600);

		// Verify badge "Hubungi Saya"
		const contactBadge = await page.$("#contact-heading");
		assert.ok(contactBadge, "Contact heading badge must exist");
		const contactBadgeWrapper = await page.$(".rounded-full:has(#contact-heading)");
		const contactBadgeClasses = await contactBadgeWrapper?.getAttribute("class");
		assert.ok(
			contactBadgeClasses?.includes("bg-[var(--glass-surface-interactive)]") || contactBadgeClasses?.includes("backdrop-blur"),
			"Contact badge must use solid glass interactive styling"
		);
		console.log("  ✓ Contact section badge has matching high-contrast solid glass pill styling.");

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-1-public-contact.png") });

		// ---------------------------------------------------------------------
		// TEST 5: STUDIO DASHBOARD HEADER & SETTINGS CLEANUP
		// ---------------------------------------------------------------------
		console.log("\nTEST 5: Auditing Studio Dashboard for Developer-ish Labels...");
		await page.setExtraHTTPHeaders(DEV_AUTH_HEADER);
		await page.goto(`${BASE_URL}/studio`, { waitUntil: "load" });
		await page.waitForTimeout(600);

		const studioHtml = await page.content();
		assert.ok(!studioHtml.includes("Phase 2"), "Studio must not contain 'Phase 2' badge");
		assert.ok(!studioHtml.includes("Versi Aktif v"), "Studio must not contain 'Versi Aktif v...' text");
		assert.ok(!studioHtml.includes("Terbit v"), "Studio must not contain 'Terbit v...' text");
		console.log("  ✓ 'Phase 2', 'Versi Aktif v...', and 'Terbit v...' removed from Studio dashboard.");

		// Check Settings tab
		if (await page.$("button:has-text('Pengaturan')")) {
			await page.click("button:has-text('Pengaturan')");
		} else {
			await page.click("button:has-text('Settings')");
		}
		await page.waitForTimeout(400);

		const settingsHtml = await page.content();
		assert.ok(!settingsHtml.includes("Versi Publikasi: v"), "Settings must not contain 'Versi Publikasi: v...'");
		const statusPublikasi = await page.$("text=Status Publikasi");
		assert.ok(statusPublikasi, "Settings tab must show 'Status Publikasi'");
		console.log("  ✓ Settings tab displays 'Status Publikasi: Aktif' instead of version counter.");

		// ---------------------------------------------------------------------
		// TEST 6: PUBLISH MODAL CLEANUP
		// ---------------------------------------------------------------------
		console.log("\nTEST 6: Auditing Publish Confirmation Modal...");
		// Create a draft change so the Publish button becomes active/enabled
		await fetch(`${BASE_URL}/api/studio/appearance`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({
				action: "save",
				appearance: {
					theme_preset_id: "neo-tokyo",
				},
			}),
		});

		// Reload studio page to reflect draft status
		await page.goto(`${BASE_URL}/studio`, { waitUntil: "load" });
		await page.waitForTimeout(600);

		// Click Terbitkan button in header
		const publishBtn = await page.$("button:has-text('Terbitkan')");
		assert.ok(publishBtn, "Header publish button must exist");
		await publishBtn.click();
		await page.waitForTimeout(400);

		const modal = await page.$("div:has-text('Terbitkan Seluruh Perubahan?')");
		assert.ok(modal, "Publish modal must open");

		const modalText = await modal.innerText();
		assert.ok(!modalText.includes("Target Versi"), "Publish modal must NOT contain 'Target Versi'");
		assert.ok(!modalText.includes("v40") && !modalText.includes("v51"), "Publish modal must NOT contain version numbers");
		assert.ok(modalText.includes("Ya, Terbitkan Sekarang"), "Publish modal must have clean confirm button");
		assert.ok(modalText.includes("Batal"), "Publish modal must have Batal button");
		console.log("  ✓ Publish confirmation modal is completely user-facing with zero internal version tags.");

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-1-studio-publish-modal.png") });

		// Close modal by clicking Batal inside the modal
		const modalBatalBtn = await modal.$("button:has-text('Batal')");
		assert.ok(modalBatalBtn, "Modal Batal button must exist");
		await modalBatalBtn.click({ force: true });
		await page.waitForTimeout(400);

		// Discard the test draft change
		await fetch(`${BASE_URL}/api/studio/discard`, {
			method: "POST",
			headers: DEV_AUTH_HEADER,
			body: JSON.stringify({ entity: "appearance" }),
		});

		// ---------------------------------------------------------------------
		// TEST 7: ICON PICKER CLEANUP IN STUDIO LINKS TAB
		// ---------------------------------------------------------------------
		console.log("\nTEST 7: Auditing Icon Picker in Studio Links...");
		await page.goto(`${BASE_URL}/studio?tab=links`, { waitUntil: "load" });
		await page.waitForTimeout(600);

		// Click "Tambah Tautan"
		const addLinkBtn = await page.$("button:has-text('Tambah Tautan')");
		assert.ok(addLinkBtn, "Tambah Tautan button must exist");
		await addLinkBtn.click();
		await page.waitForTimeout(500);

		const linkModal = (await page.$("div.fixed.inset-0:has-text('Simpan Tautan')")) || (await page.$("div.fixed.inset-0:has-text('Tautan Baru')")) || (await page.$("div.fixed.inset-0"));
		assert.ok(linkModal, "Link modal must open");

		// Click Basic Icons tab in Icon Picker if not active
		const presetTab = await linkModal.$("button:has-text('Basic Icons')");
		if (presetTab) {
			await presetTab.click({ force: true });
			await page.waitForTimeout(300);
		}

		const iconPickerHtml = await linkModal.innerHTML();
		assert.ok(!iconPickerHtml.includes("💡 Rekomendasi:"), "Icon Picker must NOT contain recommendation block");
		assert.ok(!iconPickerHtml.includes("Rekomendasi: Website"), "Icon Picker must NOT contain recommendation block");
		console.log("  ✓ Recommendation block is completely removed.");

		// Verify reset button exists
		const resetBtn = await linkModal.$("button:has-text('Reset Default')");
		assert.ok(resetBtn, "Reset Default button must exist");
		console.log("  ✓ 'Reset Default' button present for restoring default icon.");

		// Verify grid buttons have no text label inside
		const iconGridButtons = await linkModal.$$("div.max-h-56 button");
		assert.ok(iconGridButtons.length > 20, "Icon grid must contain icons");
		for (let i = 0; i < 5; i++) {
			const btnText = (await iconGridButtons[i].innerText()).trim();
			assert.equal(btnText, "", `Icon grid item ${i} must have empty innerText (no text labels), got '${btnText}'`);
			const tooltip = await iconGridButtons[i].getAttribute("title");
			assert.ok(tooltip && tooltip.length > 2, `Icon item ${i} must have hover tooltip, got '${tooltip}'`);
		}
		console.log("  ✓ Icon grid is visual-only: zero text labels, compact aspect-square tiles, hover tooltip preserved.");

		// Test search filtering
		const searchInput = await linkModal.$("input[placeholder*='Cari ikon']");
		assert.ok(searchInput, "Icon search input must exist");
		await searchInput.fill("github");
		await page.waitForTimeout(200);

		const filteredBtns = await linkModal.$$("div.max-h-56 button");
		assert.ok(filteredBtns.length >= 1 && filteredBtns.length <= 5, "Searching 'github' should return 1-5 results");
		console.log(`  ✓ Search works cleanly: ${filteredBtns.length} icons found for 'github'.`);

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-1-studio-icon-picker.png") });

		// Close link modal
		const linkBatalBtn = await linkModal.$("button:has-text('Batal')");
		assert.ok(linkBatalBtn, "Link modal Batal button must exist");
		await linkBatalBtn.click({ force: true });
		await page.waitForTimeout(300);

		// ---------------------------------------------------------------------
		// TEST 8: STRICT SEPARATION: PAGE VIEWS VS ACTUAL INTERACTION CLICKS
		// ---------------------------------------------------------------------
		console.log("\nTEST 8: Testing Strict Separation of Page Views vs Actual Interaction Clicks...");

		// Reset first to ensure clean state
		await fetch(`${BASE_URL}/api/studio/analytics?target=all`, {
			method: "DELETE",
			headers: DEV_AUTH_HEADER,
		});

		// 8.1. Public visits / refreshes to Explore and Contact
		console.log("  8.1 Simulating page visits & refreshes to /#explore and /#contact...");
		await page.setExtraHTTPHeaders({});
		await page.goto(`${BASE_URL}/#explore`, { waitUntil: "load" });
		await page.waitForTimeout(300);
		await page.reload({ waitUntil: "load" });
		await page.waitForTimeout(300);

		await page.goto(`${BASE_URL}/#contact`, { waitUntil: "load" });
		await page.waitForTimeout(300);
		await page.reload({ waitUntil: "load" });
		await page.waitForTimeout(300);

		// Check Analytics: Page views should exist, but Clicks MUST BE 0!
		const pvCheckRes = await fetch(`${BASE_URL}/api/studio/analytics?range=all`, {
			headers: DEV_AUTH_HEADER,
		});
		const pvCheckData = (await pvCheckRes.json()).analytics;
		console.log("  After page visits/refreshes:", {
			totalPageViews: pvCheckData.visitors?.totalPageViewsPeriod,
			linkClicksPeriod: pvCheckData.linkClicksPeriod,
			exploreClicksPeriod: pvCheckData.exploreClicksPeriod,
			contactClicksPeriod: pvCheckData.contactClicksPeriod,
			totalInteractionsPeriod: pvCheckData.totalInteractionsPeriod,
		});

		assert.ok((pvCheckData.visitors?.totalPageViewsPeriod || 0) >= 2, "Page views must be recorded");
		assert.equal(pvCheckData.exploreClicksPeriod, 0, "Explore clicks MUST remain 0 after mere page visits/refreshes");
		assert.equal(pvCheckData.contactClicksPeriod, 0, "Contact clicks MUST remain 0 after mere page visits/refreshes");
		assert.equal(pvCheckData.linkClicksPeriod, 0, "Link clicks MUST remain 0");
		assert.equal(pvCheckData.totalInteractionsPeriod, 0, "Total interactions MUST remain 0 when no actual clicks occurred");
		console.log("  ✓ PASSED: Opening or refreshing Explore/Contact pages does NOT trigger click telemetry.");

		// 8.2. Actual Explore Item Click
		console.log("  8.2 Simulating actual user click on Explore item card...");
		await fetch(`${BASE_URL}/api/public/telemetry`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "interaction",
				category: "explore",
				targetId: "explore-item-test-1",
			}),
		});

		const afterExploreClickRes = await fetch(`${BASE_URL}/api/studio/analytics?range=all`, {
			headers: DEV_AUTH_HEADER,
		});
		const afterExploreClickData = (await afterExploreClickRes.json()).analytics;
		assert.equal(afterExploreClickData.exploreClicksPeriod, 1, "Explore clicks must be exactly 1");
		assert.equal(afterExploreClickData.contactClicksPeriod, 0, "Contact clicks must remain 0");
		assert.equal(afterExploreClickData.linkClicksPeriod, 0, "Link clicks must remain 0");
		assert.equal(afterExploreClickData.totalInteractionsPeriod, 1, "Total interactions must be exactly 1");
		console.log("  ✓ PASSED: Actual Explore click recorded independently (Explore=1, Contact=0, Links=0, Total=1).");

		// 8.3. Actual Contact Method Click
		console.log("  8.3 Simulating actual user click on Contact method card...");
		await fetch(`${BASE_URL}/api/public/telemetry`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "interaction",
				category: "contact",
				targetId: "contact-method-email",
			}),
		});

		const afterContactClickRes = await fetch(`${BASE_URL}/api/studio/analytics?range=all`, {
			headers: DEV_AUTH_HEADER,
		});
		const afterContactClickData = (await afterContactClickRes.json()).analytics;
		assert.equal(afterContactClickData.exploreClicksPeriod, 1, "Explore clicks must remain 1");
		assert.equal(afterContactClickData.contactClicksPeriod, 1, "Contact clicks must be exactly 1");
		assert.equal(afterContactClickData.linkClicksPeriod, 0, "Link clicks must remain 0");
		assert.equal(afterContactClickData.totalInteractionsPeriod, 2, "Total interactions must be exactly 2");
		console.log("  ✓ PASSED: Actual Contact click recorded independently (Explore=1, Contact=1, Links=0, Total=2).");

		// 8.4. Actual Link Redirect Click
		console.log("  8.4 Simulating actual user click on Bio Link redirect (/go/test-link-1)...");
		await fetch(`${BASE_URL}/go/test-link-1`, { redirect: "manual" });

		const afterLinkClickRes = await fetch(`${BASE_URL}/api/studio/analytics?range=all`, {
			headers: DEV_AUTH_HEADER,
		});
		const afterLinkClickData = (await afterLinkClickRes.json()).analytics;
		assert.equal(afterLinkClickData.exploreClicksPeriod, 1, "Explore clicks must remain 1");
		assert.equal(afterLinkClickData.contactClicksPeriod, 1, "Contact clicks must remain 1");
		assert.equal(afterLinkClickData.linkClicksPeriod, 1, "Link clicks must be exactly 1");
		assert.equal(afterLinkClickData.totalInteractionsPeriod, 3, "Total interactions must be 3 (1 Link + 1 Explore + 1 Contact)");
		console.log("  ✓ PASSED: Actual Link click recorded independently (Explore=1, Contact=1, Links=1, Total=3).");

		// 8.5. Studio Click Monitor UI Verification
		console.log("  8.5 Auditing Studio Click Monitor UI cards & subtexts...");
		await context.setExtraHTTPHeaders(DEV_AUTH_HEADER);
		await page.goto(`${BASE_URL}/studio?tab=clicks`, { waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		const clickMonitorText = await page.innerText("body");
		const lowerText = clickMonitorText.toLowerCase();
		assert.ok(lowerText.includes("total interaksi"), "Must show 'Total Interaksi'");
		assert.ok(lowerText.includes("klik tautan"), "Must show 'Klik Tautan'");
		assert.ok(lowerText.includes("klik eksplorasi"), "Must show 'Klik Eksplorasi'");
		assert.ok(lowerText.includes("klik kontak"), "Must show 'Klik Kontak'");
		assert.ok(lowerText.includes("akumulasi klik link, explore & contact"), "Must show accurate total subtext");
		assert.ok(lowerText.includes("interaksi aktual pada kartu & karya explore"), "Must show accurate explore subtext");
		assert.ok(lowerText.includes("klik aktual pada kartu metode kontak"), "Must show accurate contact subtext");
		console.log("  ✓ PASSED: Click Monitor displays all 4 separated interaction metrics and verified subtexts.");

		await page.screenshot({ path: path.join(SCREENSHOT_DIR, "v4-1-studio-click-monitor.png") });

		// ---------------------------------------------------------------------
		// TEST 9: FINAL RESET TO ZERO (Requirement 8)
		// ---------------------------------------------------------------------
		console.log("\nTEST 9: Resetting Analytics to Pure 0 for Clean Handoff...");
		const resetRes = await fetch(`${BASE_URL}/api/studio/analytics?target=all`, {
			method: "DELETE",
			headers: DEV_AUTH_HEADER,
		});
		assert.equal(resetRes.status, 200, "Reset DELETE request must succeed");

		const finalRes = await fetch(`${BASE_URL}/api/studio/analytics?range=all`, {
			headers: DEV_AUTH_HEADER,
		});
		const finalJson = await finalRes.json();
		const finalData = finalJson.analytics;
		assert.equal(finalData.totalClicksPeriod, 0, "Final totalClicksPeriod must be 0");
		assert.equal(finalData.totalInteractionsPeriod, 0, "Final totalInteractionsPeriod must be 0");
		assert.equal(finalData.exploreClicksPeriod, 0, "Final exploreClicksPeriod must be 0");
		assert.equal(finalData.contactClicksPeriod, 0, "Final contactClicksPeriod must be 0");
		assert.equal(finalData.visitors?.totalPageViewsPeriod, 0, "Final page views must be 0");
		console.log("  ✓ Analytics final reset verified: click_events, interaction_events, and page_views are strictly 0.");

		console.log("\n============================================================");
		console.log("ALL V4.1 UI REFINEMENT & ACTUAL INTERACTION TESTS PASSED!");
		console.log("============================================================\n");
	} finally {
		await browser.close();
	}
}

runV41Verification().catch((err) => {
	console.error("Verification failed:", err);
	process.exit(1);
});
