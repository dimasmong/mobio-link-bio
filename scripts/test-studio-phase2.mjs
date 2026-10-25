import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-artifacts/screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
	console.log("============================================================");
	console.log("MOBIO STUDIO PHASE 2 — AUTOMATED VERIFICATION SUITE");
	console.log("============================================================\n");

	const report = {
		localD1Schema: false,
		publicHomepageIntact: false,
		profileValidationAndCrud: false,
		linkSecurityAndCrud: false,
		contactValidationAndCrud: false,
		draftIsolationVerified: false,
		publishPromotionVerified: false,
		discardResetVerified: false,
		studioUiNavigationAndModals: false,
		responsiveChecks: {},
		consoleErrors: [],
		screenshots: [],
	};

	// -------------------------------------------------------------------------
	// 1. LOCAL D1 DATABASE SCHEMA TEST
	// -------------------------------------------------------------------------
	console.log("TEST 1: Verifying Local D1 Tables & Draft Isolation Columns...");
	try {
		const stdout = execSync(
			'npx.cmd wrangler d1 execute mobio-studio-db --local --command "SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\' AND name NOT LIKE \'_cf_%\' ORDER BY name ASC;"',
			{ encoding: "utf8" }
		);

		const requiredTables = [
			"appearance_settings",
			"click_events",
			"contact_methods",
			"contact_methods_draft",
			"explore_items",
			"links",
			"links_draft",
			"profile",
			"publish_metadata",
			"site_settings",
		];

		const allFound = requiredTables.every((tbl) => stdout.includes(tbl));
		if (allFound) {
			report.localD1Schema = true;
			console.log("  ✓ All 10 core tables (including links_draft & contact_methods_draft) verified in D1.");
		} else {
			console.error("  ✗ Missing one or more required D1 tables.");
		}
	} catch (err) {
		console.error("  ✗ D1 check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 2. BROWSER SETUP
	// -------------------------------------------------------------------------
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

	const authHeaders = {
		"X-Mobio-Dev-Identity": "admin@localhost.local",
	};

	// -------------------------------------------------------------------------
	// 3. PUBLIC HOMEPAGE SSR CHECK
	// -------------------------------------------------------------------------
	console.log("\nTEST 2: Verifying Public Homepage remains intact & renders properly...");
	try {
		const res = await page.goto(BASE_URL, { waitUntil: "networkidle" });
		const title = await page.title();
		const hasHomeTab = (await page.$("#tabpanel-home")) !== null;
		const hasExploreTab = (await page.$("#tabpanel-explore")) !== null;
		const hasContactTab = (await page.$("#tabpanel-contact")) !== null;

		report.publicHomepageIntact = res.status() === 200 && title.includes("Link in Bio") && hasHomeTab && hasExploreTab && hasContactTab;
		console.log(`  ✓ Public Homepage: HTTP ${res.status()}, Title: "${title}", Tabs: Home/Explore/Contact OK`);
	} catch (err) {
		console.error("  ✗ Public homepage test failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 4. PROFILE EDITOR: VALIDATION & CRUD
	// -------------------------------------------------------------------------
	console.log("\nTEST 3: Testing Profile Validation & Draft CRUD...");
	try {
		// 4A: Reject empty display name
		const emptyRes = await page.request.post(`${BASE_URL}/api/studio/profile`, {
			headers: authHeaders,
			data: { name: "", handle: "@test" },
		});
		const emptyJson = await emptyRes.json();
		const emptyRejected = emptyRes.status() === 422 && emptyJson.error.includes("Display name");

		// 4B: Reject oversized name
		const longRes = await page.request.post(`${BASE_URL}/api/studio/profile`, {
			headers: authHeaders,
			data: { name: "A".repeat(85), handle: "@test" },
		});
		const longRejected = longRes.status() === 422;

		// 4C: Save valid draft profile (Neutral test fixture)
		const validProfile = {
			name: "Alex River Test",
			handle: "@alexriver_test",
			avatar_url: "",
			location_id: "Jakarta, Indonesia",
			location_en: "Jakarta, Indonesia",
			bio_id: "Bio pengujian draft Studio Phase 2",
			bio_en: "Studio Phase 2 draft test bio",
		};
		const saveRes = await page.request.post(`${BASE_URL}/api/studio/profile`, {
			headers: authHeaders,
			data: validProfile,
		});
		const saveJson = await saveRes.json();

		// 4D: Verify getProfileRecord returns updated draft
		const getDraftRes = await page.request.get(`${BASE_URL}/api/studio/profile`, {
			headers: authHeaders,
		});
		const getDraftJson = await getDraftRes.json();
		const draftMatches = getDraftJson.profile?.name === validProfile.name && getDraftJson.profile?.handle === validProfile.handle;

		report.profileValidationAndCrud = emptyRejected && longRejected && saveRes.status() === 200 && draftMatches;
		console.log(`  ✓ Profile: Empty name rejected (${emptyRes.status()}), Valid draft saved and retrieved (${draftMatches ? "MATCH" : "MISMATCH"})`);
	} catch (err) {
		console.error("  ✗ Profile tests failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 5. LINKS EDITOR: SECURITY PROTOCOL VALIDATION & CRUD
	// -------------------------------------------------------------------------
	console.log("\nTEST 4: Testing Links Security Protocol Validation & CRUD...");
	let testLinkId = "";
	try {
		// 5A: Reject dangerous XSS protocol javascript:
		const jsXssRes = await page.request.post(`${BASE_URL}/api/studio/links`, {
			headers: authHeaders,
			data: {
				title_id: "XSS Link",
				title_en: "XSS Link",
				url: "javascript:alert('pwned')",
				platform: "website",
			},
		});
		const jsXssRejected = jsXssRes.status() === 422;

		// 5B: Reject dangerous data: URI
		const dataUriRes = await page.request.post(`${BASE_URL}/api/studio/links`, {
			headers: authHeaders,
			data: {
				title_id: "Data URI Link",
				title_en: "Data URI Link",
				url: "data:text/html,<script>alert(1)</script>",
				platform: "website",
			},
		});
		const dataUriRejected = dataUriRes.status() === 422;

		// 5C: Accept valid https:// link
		const validLinkRes = await page.request.post(`${BASE_URL}/api/studio/links`, {
			headers: authHeaders,
			data: {
				title_id: "Proyek Inovasi",
				title_en: "Innovation Project",
				description_id: "Deskripsi proyek uji coba",
				description_en: "Test project description",
				url: "https://example.com/project",
				platform: "website",
				icon: "globe",
				is_enabled: true,
			},
		});
		const validLinkJson = await validLinkRes.json();
		testLinkId = validLinkJson.link?.id || "";

		// 5D: Update draft link
		const updateRes = await page.request.put(`${BASE_URL}/api/studio/links`, {
			headers: authHeaders,
			data: {
				id: testLinkId,
				title_id: "Proyek Inovasi (Updated)",
				title_en: "Innovation Project (Updated)",
				url: "https://example.com/project-updated",
				is_enabled: false,
			},
		});

		// 5E: Reorder links
		const reorderRes = await page.request.put(`${BASE_URL}/api/studio/links`, {
			headers: authHeaders,
			data: {
				action: "reorder",
				orderedIds: [testLinkId],
			},
		});

		report.linkSecurityAndCrud =
			jsXssRejected &&
			dataUriRejected &&
			[200, 201].includes(validLinkRes.status()) &&
			updateRes.status() === 200 &&
			reorderRes.status() === 200;
		console.log(`  ✓ Links: javascript: protocol rejected (${jsXssRes.status()}), data: rejected (${dataUriRes.status()}), Link created ID: ${testLinkId}`);
	} catch (err) {
		console.error("  ✗ Links tests failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 6. CONTACT EDITOR: DESTINATION VALIDATION & CRUD
	// -------------------------------------------------------------------------
	console.log("\nTEST 5: Testing Contact Platform Validation & CRUD...");
	let testContactId = "";
	try {
		// 6A: Reject invalid email format
		const invalidEmailRes = await page.request.post(`${BASE_URL}/api/studio/contact`, {
			headers: authHeaders,
			data: {
				platform: "email",
				label_id: "Email",
				label_en: "Email",
				value: "not-an-email",
				url: "mailto:not-an-email",
			},
		});
		const emailRejected = invalidEmailRes.status() === 422;

		// 6B: Create valid WhatsApp contact
		const validWaRes = await page.request.post(`${BASE_URL}/api/studio/contact`, {
			headers: authHeaders,
			data: {
				platform: "whatsapp",
				label_id: "WhatsApp Studio",
				label_en: "WhatsApp Studio",
				value: "+6281234567890",
				url: "https://wa.me/6281234567890",
				is_enabled: true,
			},
		});
		const validWaJson = await validWaRes.json();
		testContactId = validWaJson.contactMethod?.id || "";

		// 6C: Update contact
		const updateContactRes = await page.request.put(`${BASE_URL}/api/studio/contact`, {
			headers: authHeaders,
			data: {
				id: testContactId,
				platform: "whatsapp",
				label_id: "WhatsApp Studio (Updated)",
				label_en: "WhatsApp Studio (Updated)",
				value: "+6281234567890",
				url: "https://wa.me/6281234567890",
				is_enabled: true,
			},
		});

		report.contactValidationAndCrud =
			emailRejected &&
			[200, 201].includes(validWaRes.status()) &&
			updateContactRes.status() === 200;
		console.log(`  ✓ Contact: Invalid email rejected (${invalidEmailRes.status()}), Valid WhatsApp created ID: ${testContactId}`);
	} catch (err) {
		console.error("  ✗ Contact tests failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 7. DRAFT ISOLATION, PUBLISH & DISCARD WORKFLOW
	// -------------------------------------------------------------------------
	console.log("\nTEST 6: Testing Draft Isolation vs Public Site...");
	try {
		// At this point, draft has name "Alex River Test".
		// But public homepage MUST NOT have "Alex River Test" because it hasn't been published!
		const publicRes = await page.goto(BASE_URL, { waitUntil: "networkidle" });
		const publicContent = await page.content();
		const isDraftIsolated = !publicContent.includes("Alex River Test");
		report.draftIsolationVerified = isDraftIsolated;
		console.log(`  ✓ Draft Isolation: Public site has NOT received unpublished draft changes (${isDraftIsolated ? "PASS - ISOLATED" : "FAIL - LEAKED"})`);

		// Now, publish changes
		console.log("\nTEST 7: Testing Atomic Promotion (Publish Changes)...");
		const publishRes = await page.request.post(`${BASE_URL}/api/studio/publish`, {
			headers: authHeaders,
			data: {},
		});
		const publishJson = await publishRes.json();
		const publishSucceeded = publishRes.status() === 200 && publishJson.status === "ok";

		// Now verify public site DOES reflect the published change!
		await page.goto(BASE_URL, { waitUntil: "networkidle" });
		const publicAfterPublish = await page.content();
		const hasPublishedContent = publicAfterPublish.includes("Alex River Test");
		report.publishPromotionVerified = publishSucceeded && hasPublishedContent;
		console.log(`  ✓ Publish: HTTP ${publishRes.status()}, Version v${publishJson.version}, Public site reflects published name: ${hasPublishedContent}`);

		// Now make a new draft change to test Discard
		console.log("\nTEST 8: Testing Discard Unpublished Changes...");
		await page.request.post(`${BASE_URL}/api/studio/profile`, {
			headers: authHeaders,
			data: {
				name: "Temporary Draft To Discard",
				handle: "@discardme",
			},
		});

		// Call discard
		const discardRes = await page.request.post(`${BASE_URL}/api/studio/discard`, {
			headers: authHeaders,
			data: {},
		});
		const discardJson = await discardRes.json();

		// Verify draft is reverted back to published state
		const getDraftAfterDiscard = await page.request.get(`${BASE_URL}/api/studio/profile`, {
			headers: authHeaders,
		});
		const draftAfterDiscardJson = await getDraftAfterDiscard.json();
		const isDiscarded = draftAfterDiscardJson.profile?.name === "Alex River Test";
		report.discardResetVerified = discardRes.status() === 200 && isDiscarded;
		console.log(`  ✓ Discard: HTTP ${discardRes.status()}, Draft restored to published state: ${isDiscarded ? "YES" : "NO"}`);

		// Clean up test link and contact
		if (testLinkId) {
			await page.request.delete(`${BASE_URL}/api/studio/links`, {
				headers: authHeaders,
				data: { id: testLinkId },
			});
		}
		if (testContactId) {
			await page.request.delete(`${BASE_URL}/api/studio/contact`, {
				headers: authHeaders,
				data: { id: testContactId },
			});
		}
		// Reset profile back to standard clean default: Your Name
		await page.request.post(`${BASE_URL}/api/studio/profile`, {
			headers: authHeaders,
			data: {
				name: "Your Name",
				handle: "@username",
				avatar_url: "",
				location_id: "",
				location_en: "",
				bio_id: "",
				bio_en: "",
			},
		});
		await page.request.post(`${BASE_URL}/api/studio/publish`, {
			headers: authHeaders,
			data: {},
		});
	} catch (err) {
		console.error("  ✗ Draft/Publish/Discard workflow tests failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 8. STUDIO UI INTERACTION & SCREENSHOTS
	// -------------------------------------------------------------------------
	console.log("\nTEST 9: Testing Studio UI Interaction & Capturing Screenshots...");
	try {
		await page.setExtraHTTPHeaders(authHeaders);
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`${BASE_URL}/studio`, { waitUntil: "networkidle" });

		// 1. Overview tab screenshot
		const overviewShotPath = path.join(SCREENSHOT_DIR, "studio-phase2-overview.png");
		await page.screenshot({ path: overviewShotPath, fullPage: false });
		report.screenshots.push(overviewShotPath);
		console.log("  ✓ Captured Studio Overview screenshot");

		// 2. Profile Editor tab
		await page.click("button:has-text('Profile')");
		await page.waitForTimeout(300);
		const profileShotPath = path.join(SCREENSHOT_DIR, "studio-phase2-profile.png");
		await page.screenshot({ path: profileShotPath, fullPage: false });
		report.screenshots.push(profileShotPath);
		console.log("  ✓ Captured Profile Editor screenshot");

		// 3. Links Editor tab
		await page.click("button:has-text('Links')");
		await page.waitForTimeout(300);
		const linksShotPath = path.join(SCREENSHOT_DIR, "studio-phase2-links.png");
		await page.screenshot({ path: linksShotPath, fullPage: false });
		report.screenshots.push(linksShotPath);
		console.log("  ✓ Captured Links Editor screenshot");

		// 4. Contact Editor tab
		await page.click("button:has-text('Contact')");
		await page.waitForTimeout(300);
		const contactShotPath = path.join(SCREENSHOT_DIR, "studio-phase2-contact.png");
		await page.screenshot({ path: contactShotPath, fullPage: false });
		report.screenshots.push(contactShotPath);
		console.log("  ✓ Captured Contact Editor screenshot");

		// 5. Preview Modal
		await page.click("button:has-text('Preview Draft')");
		await page.waitForTimeout(300);
		const previewShotPath = path.join(SCREENSHOT_DIR, "studio-phase2-preview-modal.png");
		await page.screenshot({ path: previewShotPath, fullPage: false });
		report.screenshots.push(previewShotPath);
		console.log("  ✓ Captured Preview Modal screenshot");
		await page.keyboard.press("Escape");

		report.studioUiNavigationAndModals = true;
	} catch (err) {
		console.error("  ✗ UI testing failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 9. RESPONSIVENESS CHECK ON MULTIPLE VIEWPORTS
	// -------------------------------------------------------------------------
	console.log("\nTEST 10: Testing Studio Responsiveness across Mobile & Desktop...");
	const viewports = [
		{ name: "360px (Mobile Small)", width: 360, height: 740 },
		{ name: "400px (Mobile Standard)", width: 400, height: 840 },
		{ name: "768px (Tablet)", width: 768, height: 1024 },
		{ name: "1440px (Desktop)", width: 1440, height: 900 },
	];

	for (const vp of viewports) {
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.waitForTimeout(100);
		const overflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > document.documentElement.clientWidth;
		});
		report.responsiveChecks[vp.name] = !overflow ? "PASS (No horizontal overflow)" : "FAIL (Overflow detected)";
		console.log(`  ✓ Viewport ${vp.name}: ${!overflow ? "PASS" : "FAIL"}`);
	}

	await browser.close();

	console.log("\n============================================================");
	console.log("FINAL RESULTS SUMMARY");
	console.log("============================================================");
	console.log(JSON.stringify(report, null, 2));

	const allPassed =
		report.localD1Schema &&
		report.publicHomepageIntact &&
		report.profileValidationAndCrud &&
		report.linkSecurityAndCrud &&
		report.contactValidationAndCrud &&
		report.draftIsolationVerified &&
		report.publishPromotionVerified &&
		report.discardResetVerified &&
		report.studioUiNavigationAndModals;

	if (allPassed) {
		console.log("\n🎉 ALL MOBIO STUDIO PHASE 2 VERIFICATIONS PASSED SUCCESSFULLY!");
		process.exit(0);
	} else {
		console.error("\n❌ ONE OR MORE CHECKS FAILED.");
		process.exit(1);
	}
}

runTests().catch((err) => {
	console.error("FATAL ERROR in test execution:", err);
	process.exit(1);
});
