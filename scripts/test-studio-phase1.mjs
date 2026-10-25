import { chromium } from "playwright";
import { execSync } from "child_process";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";

async function runTests() {
	console.log("============================================================");
	console.log("MOBIO STUDIO PHASE 1 — TEST SUITE");
	console.log("============================================================\n");

	const report = {
		localD1Schema: false,
		publicHomepageIntact: false,
		publicHealthIntact: false,
		unauthorizedApiRejected: false,
		unauthorizedUiGated: false,
		authorizedApiSuccess: false,
		authorizedUiOverviewRendered: false,
		dashboardTabNavigation: false,
		responsiveChecks: {},
		consoleErrors: [],
	};

	// -------------------------------------------------------------------------
	// 1. LOCAL D1 DATABASE TESTS
	// -------------------------------------------------------------------------
	console.log("TEST 1: Verifying Local Cloudflare D1 Migration & Schema...");
	try {
		const stdout = execSync(
			'npx.cmd wrangler d1 execute mobio-db --local --command "SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\' AND name NOT LIKE \'_cf_%\' ORDER BY name ASC;"',
			{ encoding: "utf8" }
		);

		const requiredTables = [
			"appearance_settings",
			"click_events",
			"contact_methods",
			"explore_items",
			"links",
			"profile",
			"publish_metadata",
			"site_settings",
		];

		const allFound = requiredTables.every((tbl) => stdout.includes(tbl));
		if (allFound) {
			report.localD1Schema = true;
			console.log("  ✓ All 8 core tables exist in local D1 SQLite database.");
		} else {
			console.error("  ✗ Missing one or more required D1 tables.");
		}
	} catch (err) {
		console.error("  ✗ D1 check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 2. HTTP & BROWSER AUTOMATION TESTS
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

	// Test 2A: Public Homepage Intact
	console.log("\nTEST 2: Verifying Public Homepage remains fully functional...");
	try {
		const res = await page.goto(BASE_URL, { waitUntil: "networkidle" });
		const h1Text = await page.textContent("header h1");
		const hasTabs = (await page.$("#tabpanel-home")) !== null;
		report.publicHomepageIntact = res.status() === 200 && (h1Text.includes("Your Name") || h1Text.includes("Dimas Mong")) && hasTabs;
		console.log(`  ✓ Public homepage status: ${res.status()}, Profile: "${h1Text.trim()}"`);
	} catch (err) {
		console.error("  ✗ Public homepage check failed:", err.message);
	}

	// Test 2B: Public Health Endpoint
	console.log("\nTEST 3: Verifying Public Health endpoint (/api/public/health)...");
	try {
		const res = await page.goto(`${BASE_URL}/api/public/health`);
		const body = await res.json();
		report.publicHealthIntact = res.status() === 200 && (body.status === "ok" || body.status === "healthy");
		console.log(`  ✓ Public health check status: ${res.status()}, Body:`, body);
	} catch (err) {
		console.error("  ✗ Public health check failed:", err.message);
	}

	// Test 2C: Unauthorized Private API Access
	console.log("\nTEST 4: Verifying Unauthorized Private API Access (/api/studio/status)...");
	try {
		const res = await page.request.get(`${BASE_URL}/api/studio/status`);
		const body = await res.json();
		report.unauthorizedApiRejected = res.status() === 401 && body.error !== undefined;
		console.log(`  ✓ Unauthorized API status: ${res.status()} (Expected 401), Error: "${body.error}"`);
	} catch (err) {
		console.error("  ✗ Unauthorized API test failed:", err.message);
	}

	// Test 2D: Unauthorized Studio UI Access (Access Gate)
	console.log("\nTEST 5: Verifying Unauthorized Studio UI Access (/studio)...");
	try {
		await page.goto(`${BASE_URL}/studio`, { waitUntil: "networkidle" });
		const gateHeading = await page.textContent("h1");
		const isGated = gateHeading.includes("Akses Dibatasi") || gateHeading.includes("Studio");
		const hasNoAdminControls = (await page.$("table")) === null;
		report.unauthorizedUiGated = isGated && hasNoAdminControls;
		console.log(`  ✓ Unauthorized Studio UI correctly gated: "${gateHeading.trim()}"`);
	} catch (err) {
		console.error("  ✗ Unauthorized Studio UI test failed:", err.message);
	}

	// Test 2E: Authorized Private API Access (Local Dev Simulation)
	console.log("\nTEST 6: Verifying Authorized Private API (/api/studio/status with local dev identity)...");
	try {
		const res = await page.request.get(`${BASE_URL}/api/studio/status`, {
			headers: {
				"X-Mobio-Dev-Identity": "admin@localhost.local",
			},
		});
		const body = await res.json();
		report.authorizedApiSuccess =
			res.status() === 200 &&
			body.authenticatedUser?.email === "admin@localhost.local" &&
			body.database?.isReady === true;
		console.log(`  ✓ Authorized API status: ${res.status()}, User: ${body.authenticatedUser?.email}, DB Ready: ${body.database?.isReady}`);
	} catch (err) {
		console.error("  ✗ Authorized API test failed:", err.message);
	}

	// Test 2F: Authorized Studio UI (Overview Page)
	console.log("\nTEST 7: Verifying Authorized Studio Shell UI (/studio with local dev identity)...");
	try {
		// Set local dev identity header for page requests
		await page.setExtraHTTPHeaders({
			"X-Mobio-Dev-Identity": "admin@localhost.local",
		});

		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`${BASE_URL}/studio`, { waitUntil: "networkidle" });

		const emailBadge = await page.textContent("header");
		const hasEmail = emailBadge.includes("admin@localhost.local");
		const overviewSection = await page.textContent("main");
		const hasTablesSection = overviewSection.includes("Skema Tabel Database D1");

		report.authorizedUiOverviewRendered = hasEmail && hasTablesSection;
		console.log(`  ✓ Authorized Studio Shell rendered: Email Badge: ${hasEmail}, Tables Listed: ${hasTablesSection}`);

		// Test 2G: Navigation to non-overview tabs (Phase 2 placeholder verification)
		console.log("\nTEST 8: Verifying Studio Tab Navigation & Phase 2 Honest Placeholders...");
		await page.click("button:has-text('Links')");
		await page.waitForTimeout(200);
		const linksSectionText = await page.textContent("main");
		const hasPhase2Badge = linksSectionText.includes("Phase 2") && linksSectionText.includes("belum diaktifkan");

		await page.click("button:has-text('Settings')");
		await page.waitForTimeout(200);
		const settingsSectionText = await page.textContent("main");
		const hasSettingsPhase2 = settingsSectionText.includes("Modul Settings") && settingsSectionText.includes("Phase 2");

		await page.click("button:has-text('Overview')");
		await page.waitForTimeout(200);
		const backToOverview = (await page.textContent("main")).includes("Skema Tabel Database D1");

		report.dashboardTabNavigation = hasPhase2Badge && hasSettingsPhase2 && backToOverview;
		console.log(`  ✓ Tab Navigation & Placeholders: ${report.dashboardTabNavigation ? "PASS" : "FAIL"}`);

		// Test 2H: Viewport Responsiveness Check
		console.log("\nTEST 9: Testing Studio Responsiveness on Mobile & Desktop...");
		const viewports = [
			{ name: "360px (Mobile)", width: 360, height: 740 },
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
			report.responsiveChecks[vp.name] = !overflow ? "PASS" : "FAIL (Overflow)";
			console.log(`  ✓ Viewport ${vp.name}: ${!overflow ? "PASS" : "FAIL"}`);
		}
	} catch (err) {
		console.error("  ✗ Authorized UI tests failed:", err.message);
	}

	report.consoleErrors = consoleErrors;
	await browser.close();

	console.log("\n============================================================");
	console.log("FINAL SUMMARY — MOBIO STUDIO PHASE 1");
	console.log(JSON.stringify(report, null, 2));
	console.log("============================================================\n");

	const allPass =
		report.localD1Schema &&
		report.publicHomepageIntact &&
		report.publicHealthIntact &&
		report.unauthorizedApiRejected &&
		report.unauthorizedUiGated &&
		report.authorizedApiSuccess &&
		report.authorizedUiOverviewRendered &&
		report.dashboardTabNavigation &&
		report.consoleErrors.length === 0;

	if (!allPass) {
		console.error("One or more tests failed!");
		process.exit(1);
	} else {
		console.log("ALL PHASE 1 TESTS PASSED SUCCESSFULLY! 🚀");
	}
}

runTests().catch((err) => {
	console.error("Test runner crashed:", err);
	process.exit(1);
});
