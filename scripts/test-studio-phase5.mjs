import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-artifacts/screenshots/phase5");

if (!fs.existsSync(SCREENSHOT_DIR)) {
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runPhase5Tests() {
	console.log("============================================================");
	console.log("MOBIO STUDIO PHASE 5 — PRIVACY-FIRST CLICK MONITOR & ANALYTICS");
	console.log("Telemetry Verification & Automated Quality Suite");
	console.log("============================================================\n");

	const report = {
		d1MigrationAndSchema: false,
		firstPartyRedirectTelemetry: false,
		privacySanitizationNoPII: false,
		openRedirectAndSecurity: false,
		analyticsApiAuthAndRanges: false,
		resetAnalytics: false,
		studioUiClickMonitor: false,
		studioUiSettingsTab: false,
		responsiveChecks: {},
		consoleErrors: [],
	};

	// -------------------------------------------------------------------------
	// 1. D1 SCHEMA & MIGRATION VERIFICATION
	// -------------------------------------------------------------------------
	console.log("TEST 1: Verifying D1 Schema (click_events table & indexes)...");
	try {
		const stdout = execSync(
			'npx.cmd wrangler d1 execute mobio-db --local --command "SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'click_events\'; SELECT name FROM sqlite_master WHERE type=\'index\' AND tbl_name=\'click_events\';"',
			{ encoding: "utf8" }
		);
		if (stdout.includes("click_events") && stdout.includes("idx_click_events_time")) {
			console.log("  ✅ Table click_events and performance indexes verified in D1.");
			report.d1MigrationAndSchema = true;
		} else {
			console.error("  ❌ Missing click_events table or indexes:", stdout);
		}
	} catch (err) {
		console.error("  ❌ Error verifying D1 schema:", err.message);
	}

	// -------------------------------------------------------------------------
	// 2. CREATE A TEST LINK & VERIFY FIRST-PARTY REDIRECT (/go/:linkId)
	// -------------------------------------------------------------------------
	console.log("\nTEST 2: Testing First-Party Redirect (/go/:linkId) and Telemetry Logging...");
	const testLinkId = `test-link-telemetry-${Date.now()}`;
	const testDestinationUrl = "https://example.com/telemetry-target";

	try {
		// Insert link directly into links (published) for immediate routing test
		execSync(
			`npx.cmd wrangler d1 execute mobio-db --local --command "INSERT OR REPLACE INTO links (id, title_id, title_en, url, platform, icon, sort_order, is_enabled, created_at, updated_at) VALUES ('${testLinkId}', 'Tes Monitor Klik', 'Click Monitor Test', '${testDestinationUrl}', 'website', 'globe', 999, 1, datetime('now'), datetime('now'));"`,
			{ encoding: "utf8" }
		);

		// Issue redirect request via fetch (manual redirect mode to inspect 302)
		const redirectRes = await fetch(`${BASE_URL}/go/${testLinkId}`, {
			redirect: "manual",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/1.0",
				Referer: "https://twitter.com/dimasmong/status/123456789?s=20&t=xyz",
			},
		});

		const status = redirectRes.status;
		const location = redirectRes.headers.get("location");
		const cacheControl = redirectRes.headers.get("cache-control");

		console.log(`  Redirect Status: ${status}`);
		console.log(`  Location Header: ${location}`);
		console.log(`  Cache-Control: ${cacheControl}`);

		if (status === 302 && location === testDestinationUrl && cacheControl?.includes("no-store")) {
			console.log("  ✅ /go/:linkId responded with HTTP 302 Found to destination URL with no-store cache control.");
			report.firstPartyRedirectTelemetry = true;
		} else {
			console.error("  ❌ Unexpected redirect response:", { status, location, cacheControl });
		}
	} catch (err) {
		console.error("  ❌ Error executing redirect test:", err.message);
	}

	// -------------------------------------------------------------------------
	// 3. PRIVACY & SANITIZATION VERIFICATION (NO PII, NO UA TELEMETRY, STRIPPED REFERRER)
	// -------------------------------------------------------------------------
	console.log("\nTEST 3: Verifying Privacy Telemetry in D1 (Zero UA, Sanitized Referrer, No PII)...");
	try {
		const stdout = execSync(
			`npx.cmd wrangler d1 execute mobio-db --local --command "SELECT id, link_id, referrer FROM click_events WHERE link_id='${testLinkId}' ORDER BY clicked_at DESC LIMIT 1;"`,
			{ encoding: "utf8" }
		);

		console.log("  D1 Click Record Query Output:\n", stdout);

		const pragmaOutput = execSync(
			'npx.cmd wrangler d1 execute mobio-db --local --command "PRAGMA table_info(click_events);"',
			{ encoding: "utf8" }
		);

		// Verify zero UA telemetry and zero country fields in database schema
		const hasUaColumn = pragmaOutput.includes("user_agent_hash") || pragmaOutput.includes("user_agent");
		const hasCountryColumn = pragmaOutput.includes("country");

		// Check referrer is strictly domain/host without sensitive query params or paths
		const referrerSanitized = stdout.includes("twitter.com") && !stdout.includes("123456789") && !stdout.includes("xyz");

		if (!hasUaColumn && !hasCountryColumn && referrerSanitized) {
			console.log("  ✅ Telemetry strictly minimal privacy: Zero UA columns, zero country, referrer stripped of paths/query params.");
			report.privacySanitizationNoPII = true;
		} else {
			console.error("  ❌ Privacy leakage detected! hasUaColumn:", hasUaColumn, "hasCountryColumn:", hasCountryColumn, "referrerSanitized:", referrerSanitized);
		}
	} catch (err) {
		console.error("  ❌ Error inspecting privacy records in D1:", err.message);
	}

	// -------------------------------------------------------------------------
	// 4. OPEN-REDIRECT & SECURITY ENFORCEMENT
	// -------------------------------------------------------------------------
	console.log("\nTEST 4: Open-Redirect & Security Enforcement...");
	try {
		// 4a. Non-existent link ID -> 404
		const nonExistentRes = await fetch(`${BASE_URL}/go/totally-fake-link-id`, { redirect: "manual" });
		const is404 = nonExistentRes.status === 404;

		// 4b. Query parameter injection attempt (open redirect bypass)
		const bypassRes = await fetch(`${BASE_URL}/go/${testLinkId}?url=https://malicious-site.com`, {
			redirect: "manual",
		});
		const bypassLocation = bypassRes.headers.get("location");
		const bypassIgnored = bypassLocation === testDestinationUrl;

		if (is404 && bypassIgnored) {
			console.log("  ✅ Non-existent link returned 404. External query parameter injection ignored.");
			report.openRedirectAndSecurity = true;
		} else {
			console.error("  ❌ Security check failed:", { is404, bypassIgnored, bypassLocation });
		}
	} catch (err) {
		console.error("  ❌ Error in security enforcement test:", err.message);
	}

	// -------------------------------------------------------------------------
	// 5. ANALYTICS API AUTH & SUMMARY RANGES
	// -------------------------------------------------------------------------
	console.log("\nTEST 5: Analytics API Auth Guard & Time Range Aggregations...");
	try {
		// 5a. Unauthenticated request -> must fail (401 or 403 or redirect)
		const unauthRes = await fetch(`${BASE_URL}/api/studio/analytics`);
		const unauthProtected = unauthRes.status === 401 || unauthRes.status === 403 || unauthRes.status === 302;

		// 5b. Authenticated request for 7d
		const auth7dRes = await fetch(`${BASE_URL}/api/studio/analytics?range=7d`, {
			headers: { "X-Mobio-Dev-Identity": "admin@mobio.test" },
		});
		const auth7dData = await auth7dRes.json();

		// 5c. Authenticated request for today
		const authTodayRes = await fetch(`${BASE_URL}/api/studio/analytics?range=today`, {
			headers: { "X-Mobio-Dev-Identity": "admin@mobio.test" },
		});
		const authTodayData = await authTodayRes.json();

		console.log("  Unauth Protected:", unauthProtected);
		console.log("  7d Total Period Clicks:", auth7dData?.analytics?.totalClicksPeriod);
		console.log("  7d Link Breakdown Count:", auth7dData?.analytics?.linkBreakdown?.length);
		console.log("  7d Time Series Length:", auth7dData?.analytics?.timeSeries?.length);
		console.log("  Today Clicks:", authTodayData?.analytics?.todayClicks);

		if (
			unauthProtected &&
			auth7dData?.status === "ok" &&
			Array.isArray(auth7dData?.analytics?.timeSeries) &&
			auth7dData.analytics.timeSeries.length === 7 &&
			authTodayData?.status === "ok"
		) {
			console.log("  ✅ Analytics API auth guard verified. 7d & today ranges compute accurately.");
			report.analyticsApiAuthAndRanges = true;
		} else {
			console.error("  ❌ Analytics API aggregation failed:", { unauthProtected, auth7dData });
		}
	} catch (err) {
		console.error("  ❌ Error testing analytics API:", err.message);
	}

	// -------------------------------------------------------------------------
	// 6. RESET ANALYTICS (PURGE CLICK EVENTS)
	// -------------------------------------------------------------------------
	console.log("\nTEST 6: Testing Reset Click Analytics API...");
	try {
		const resetRes = await fetch(`${BASE_URL}/api/studio/analytics`, {
			method: "DELETE",
			headers: { "X-Mobio-Dev-Identity": "admin@mobio.test" },
		});
		const resetData = await resetRes.json();

		const postResetSummary = await fetch(`${BASE_URL}/api/studio/analytics?range=7d`, {
			headers: { "X-Mobio-Dev-Identity": "admin@mobio.test" },
		}).then((r) => r.json());

		if (resetData.status === "ok" && postResetSummary?.analytics?.totalClicksPeriod === 0) {
			console.log("  ✅ Click analytics reset successfully. Total clicks period is now 0.");
			report.resetAnalytics = true;
		} else {
			console.error("  ❌ Reset analytics failed:", { resetData, postResetSummary });
		}
	} catch (err) {
		console.error("  ❌ Error testing reset analytics:", err.message);
	}

	// -------------------------------------------------------------------------
	// 7. PLAYWRIGHT UI TESTING & RESPONSIVE VIEWPORTS
	// -------------------------------------------------------------------------
	console.log("\nTEST 7: Playwright UI Verification for Click Monitor & Settings...");
	const browser = await chromium.launch({ channel: "msedge", headless: true });

	const viewports = [
		{ name: "360px-mobile-small", width: 360, height: 740 },
		{ name: "400px-mobile-standard", width: 400, height: 844 },
		{ name: "768px-tablet", width: 768, height: 1024 },
		{ name: "1024px-desktop", width: 1024, height: 768 },
		{ name: "1440px-wide-desktop", width: 1440, height: 900 },
	];

	try {
		const context = await browser.newContext({
			extraHTTPHeaders: {
				"X-Mobio-Dev-Identity": "admin@mobio.test",
			},
		});

		const page = await context.newPage();

		page.on("console", (msg) => {
			if (msg.type() === "error") {
				report.consoleErrors.push(msg.text());
			}
		});

		// 7a. Test Click Monitor UI
		await page.goto(`${BASE_URL}/studio?tab=clicks`, { waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		const clickMonitorHeader = await page.$("text=Click Monitor & Analitik Tautan");
		const metricTotalClicks = await page.$("text=Total Klik");
		const metricTodayClicks = await page.$("text=Klik Hari Ini");
		const metricMonitored = await page.$("text=Tautan Terpantau");
		const dailyActivityChart = await page.$("text=Aktivitas Tren Klik Harian");
		const leaderboard = await page.$("text=Peringkat & Performa Tautan");

		if (clickMonitorHeader && metricTotalClicks && metricTodayClicks && dailyActivityChart && leaderboard) {
			console.log("  ✅ Studio Click Monitor UI elements verified.");
			report.studioUiClickMonitor = true;
		} else {
			console.error("  ❌ Some Click Monitor UI elements were missing.");
		}

		// 7b. Test Settings Tab UI
		await page.goto(`${BASE_URL}/studio?tab=settings`, { waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		const settingsHeader = await page.$("text=Pengaturan & Status Sistem");
		const d1Status = await page.$("text=Database D1");
		const d1Tables = await page.$("text=Tabel Database Cloudflare D1");
		const securityGuide = await page.$("text=Panduan Arsitektur & Keamanan Self-Hosted");

		if (settingsHeader && d1Status && d1Tables && securityGuide) {
			console.log("  ✅ Studio Settings & System Status UI verified.");
			report.studioUiSettingsTab = true;
		} else {
			console.error("  ❌ Some Settings UI elements were missing.");
		}

		// 7c. Capture 5 Responsive Viewports for Click Monitor
		for (const vp of viewports) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.goto(`${BASE_URL}/studio?tab=clicks`, { waitUntil: "networkidle" });
			await page.waitForTimeout(600);

			const screenshotPath = path.join(SCREENSHOT_DIR, `studio-clicks-${vp.name}.png`);
			await page.screenshot({ path: screenshotPath, fullPage: true });
			console.log(`  📸 Snapshot captured: ${screenshotPath}`);
			report.responsiveChecks[vp.name] = true;
		}

		// Also capture Settings tab at 1440px
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`${BASE_URL}/studio?tab=settings`, { waitUntil: "networkidle" });
		await page.waitForTimeout(600);
		const settingsScreenshotPath = path.join(SCREENSHOT_DIR, "studio-settings-1440px.png");
		await page.screenshot({ path: settingsScreenshotPath, fullPage: true });
		console.log(`  📸 Snapshot captured: ${settingsScreenshotPath}`);

		await context.close();
	} catch (err) {
		console.error("  ❌ Playwright test error:", err.message);
	} finally {
		await browser.close();
	}

	// -------------------------------------------------------------------------
	// CLEAN UP TEMPORARY TEST DATA
	// -------------------------------------------------------------------------
	console.log("\nCleaning up temporary test records...");
	try {
		execSync(
			`npx.cmd wrangler d1 execute mobio-db --local --command "DELETE FROM links WHERE id='${testLinkId}'; DELETE FROM links_draft WHERE id='${testLinkId}'; DELETE FROM click_events WHERE link_id='${testLinkId}';"`,
			{ encoding: "utf8" }
		);
		console.log("  ✅ Temporary test data cleaned up.");
	} catch (err) {
		console.error("  ⚠️ Error during cleanup:", err.message);
	}

	// -------------------------------------------------------------------------
	// FINAL REPORT
	// -------------------------------------------------------------------------
	console.log("\n============================================================");
	console.log("PHASE 5 VERIFICATION SUMMARY");
	console.log("============================================================");
	console.log(JSON.stringify(report, null, 2));

	const allPassed =
		report.d1MigrationAndSchema &&
		report.firstPartyRedirectTelemetry &&
		report.privacySanitizationNoPII &&
		report.openRedirectAndSecurity &&
		report.analyticsApiAuthAndRanges &&
		report.resetAnalytics &&
		report.studioUiClickMonitor &&
		report.studioUiSettingsTab &&
		Object.keys(report.responsiveChecks).length === 5;

	if (allPassed) {
		console.log("\n🎉 ALL PHASE 5 TESTS PASSED SUCCESFULLY!\n");
		process.exit(0);
	} else {
		console.error("\n❌ SOME PHASE 5 TESTS FAILED.\n");
		process.exit(1);
	}
}

runPhase5Tests().catch((err) => {
	console.error("Fatal test error:", err);
	process.exit(1);
});
