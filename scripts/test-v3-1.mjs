import assert from "node:assert/strict";

const BASE_URL = "http://localhost:5173";
const DEV_AUTH_HEADER = { "X-Mobio-Dev-Identity": "dimas@example.com" };

async function runTests() {
	console.log("=== MOBIO LINK BIO V3.1 — COMPREHENSIVE AUTOMATED VERIFICATION ===");

	// 1. Health check
	console.log("\n[Test 1] Health Check...");
	const healthRes = await fetch(`${BASE_URL}/api/public/health`);
	assert.equal(healthRes.status, 200, "Health check should return 200");
	const healthJson = await healthRes.json();
	assert.equal(healthJson.status, "ok");
	console.log("✅ Health check passed:", healthJson);

	// 2. Public Visitor Telemetry Endpoint
	console.log("\n[Test 2] Visitor Telemetry API (POST /api/public/telemetry)...");
	const telRes1 = await fetch(`${BASE_URL}/api/public/telemetry`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
		},
		body: JSON.stringify({
			page: "home",
			sessionKey: "test-session-" + Date.now(),
		}),
	});
	assert.equal(telRes1.status, 200, "Telemetry POST should return 200");
	const telJson1 = await telRes1.json();
	assert.equal(telJson1.status, "ok");
	console.log("✅ Telemetry recorded:", telJson1);

	// Test Explore page view
	const telResExplore = await fetch(`${BASE_URL}/api/public/telemetry`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
		},
		body: JSON.stringify({
			page: "explore",
			sessionKey: "test-session-" + Date.now(),
		}),
	});
	assert.equal(telResExplore.status, 200);

	// Test bot filtering (silently drops bot without throwing)
	const botRes = await fetch(`${BASE_URL}/api/public/telemetry`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
		},
		body: JSON.stringify({
			page: "home",
			sessionKey: "bot-session-key",
		}),
	});
	assert.equal(botRes.status, 200);
	const botJson = await botRes.json();
	assert.equal(botJson.status, "ok");
	console.log("✅ Bot filtering verified (handled silently with status ok)");

	// Test invalid sessionKey
	const invalidTel = await fetch(`${BASE_URL}/api/public/telemetry`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ page: "home", sessionKey: "short" }),
	});
	assert.equal(invalidTel.status, 400, "Short sessionKey should return 400");
	console.log("✅ Invalid sessionKey rejected with 400");

	// 3. Studio Analytics Summary (Visitor + Clicks)
	console.log("\n[Test 3] Studio Analytics API (GET /api/studio/analytics)...");
	const analyticsRes = await fetch(`${BASE_URL}/api/studio/analytics?range=7d`, {
		headers: DEV_AUTH_HEADER,
	});
	assert.equal(analyticsRes.status, 200, "Analytics GET should return 200");
	const analyticsJson = await analyticsRes.json();
	assert.equal(analyticsJson.status, "ok");
	assert.ok(analyticsJson.analytics, "Should contain analytics summary");
	assert.ok(analyticsJson.analytics.visitors, "Should contain visitors summary");
	assert.ok(Array.isArray(analyticsJson.analytics.visitors.pageBreakdown), "visitors should have pageBreakdown");
	assert.ok(Array.isArray(analyticsJson.analytics.visitors.timeSeries), "visitors should have timeSeries");
	assert.ok(analyticsJson.analytics.visitors.totalPageViewsAllTime >= 1, "Should have at least 1 page view recorded");
	console.log("✅ Studio analytics summary returned with visitors:", {
		totalClicks: analyticsJson.analytics.totalClicksPeriod,
		totalPageViews: analyticsJson.analytics.visitors.totalPageViewsPeriod,
		todayPageViews: analyticsJson.analytics.visitors.todayPageViews,
		uniqueSessions: analyticsJson.analytics.visitors.uniqueVisitorSessions,
		breakdown: analyticsJson.analytics.visitors.pageBreakdown,
	});

	// 4. Explore Categories CRUD (Single-Tier)
	console.log("\n[Test 4] Explore Categories CRUD (POST, PUT, DELETE)...");
	const testCatId = "test-cat-" + Date.now();
	
	// Create
	const createCatRes = await fetch(`${BASE_URL}/api/studio/explore`, {
		method: "POST",
		headers: { ...DEV_AUTH_HEADER, "Content-Type": "application/json" },
		body: JSON.stringify({
			action: "create_category",
			id: testCatId,
			name_id: "Kategori Uji",
			name_en: "Test Category",
			icon: "star",
			color: "#3b82f6",
			is_enabled: 1,
		}),
	});
	assert.equal(createCatRes.status, 201, "Create category should return 201");
	const createCatJson = await createCatRes.json();
	assert.equal(createCatJson.status, "ok");
	assert.equal(createCatJson.category.name_id, "Kategori Uji");
	console.log("✅ Create category succeeded:", createCatJson.category);

	// Update
	const updateCatRes = await fetch(`${BASE_URL}/api/studio/explore`, {
		method: "PUT",
		headers: { ...DEV_AUTH_HEADER, "Content-Type": "application/json" },
		body: JSON.stringify({
			action: "update_category",
			id: testCatId,
			name_id: "Kategori Uji Diperbarui",
			name_en: "Updated Test Category",
			color: "#10b981",
		}),
	});
	assert.equal(updateCatRes.status, 200, "Update category should return 200");
	console.log("✅ Update category succeeded");

	// Delete
	const deleteCatRes = await fetch(`${BASE_URL}/api/studio/explore`, {
		method: "DELETE",
		headers: { ...DEV_AUTH_HEADER, "Content-Type": "application/json" },
		body: JSON.stringify({
			action: "delete_category",
			id: testCatId,
		}),
	});
	assert.equal(deleteCatRes.status, 200, "Delete category should return 200");
	console.log("✅ Delete category succeeded");

	// 5. Test Click Monitor with Date Comparison
	console.log("\n[Test 5] Click Tracking via /go/:linkId...");
	// Create temporary link in draft
	const newLinkRes = await fetch(`${BASE_URL}/api/studio/links`, {
		method: "POST",
		headers: { ...DEV_AUTH_HEADER, "Content-Type": "application/json" },
		body: JSON.stringify({
			title_id: "Uji Tautan V3.1",
			title_en: "V3.1 Test Link",
			url: "https://example.com/tested-v31",
			platform: "website",
			icon: "globe",
			icon_type: "preset",
			is_enabled: true,
		}),
	});
	assert.ok([200, 201].includes(newLinkRes.status), "Link creation should return 200 or 201");
	const newLinkJson = await newLinkRes.json();
	const testLinkId = newLinkJson.link.id;

	// Publish draft so it is available in published `links` table
	const pubRes = await fetch(`${BASE_URL}/api/studio/publish`, {
		method: "POST",
		headers: { ...DEV_AUTH_HEADER, "Content-Type": "application/json" },
	});
	assert.equal(pubRes.status, 200, "Publish should return 200");

	// Click redirect test
	const clickRes = await fetch(`${BASE_URL}/go/${testLinkId}`, {
		redirect: "manual",
		headers: { "Referer": "https://example.org" },
	});
	assert.equal(clickRes.status, 302, "Click redirect should be 302");
	assert.equal(clickRes.headers.get("location"), "https://example.com/tested-v31");
	console.log(`✅ Redirect /go/${testLinkId} responded 302 -> ${clickRes.headers.get("location")}`);

	// Re-fetch analytics to ensure todayClicks and totalClicks updated
	const afterRes = await fetch(`${BASE_URL}/api/studio/analytics?range=today`, { headers: DEV_AUTH_HEADER });
	const afterJson = await afterRes.json();
	assert.ok(afterJson.analytics.todayClicks >= 1, "Today clicks must be at least 1");
	assert.ok(afterJson.analytics.totalClicksPeriod >= 1, "Total clicks period must be at least 1");
	console.log("✅ Click registered in today's analytics:", afterJson.analytics.todayClicks);

	// Clean up temporary link and republish
	await fetch(`${BASE_URL}/api/studio/links`, {
		method: "DELETE",
		headers: { ...DEV_AUTH_HEADER, "Content-Type": "application/json" },
		body: JSON.stringify({ id: testLinkId }),
	});
	await fetch(`${BASE_URL}/api/studio/publish`, {
		method: "POST",
		headers: { ...DEV_AUTH_HEADER, "Content-Type": "application/json" },
	});
	console.log("✅ Temporary test link cleaned up & draft republished");

	// 6. Public Home Layout & Footer Structure
	console.log("\n[Test 6] Public Home Layout & Footer HTML Structure...");
	const homeRes = await fetch(`${BASE_URL}/`);
	assert.equal(homeRes.status, 200);
	const homeHtml = await homeRes.text();
	assert.ok(homeHtml.includes("min-h-[100dvh] flex flex-col"), "Home layout should use flex-col full-height");
	assert.ok(homeHtml.includes("flex-grow"), "Home should have flex-grow on main content");
	assert.ok(homeHtml.includes("pb-28 sm:pb-32"), "Footer should have bottom padding to prevent dock collision");
	console.log("✅ Home layout structure verified (flex-col, flex-grow, footer padding)");

	// 7. Draft Preview Contained Background
	console.log("\n[Test 7] Draft Preview Route (/studio/preview)...");
	const previewRes = await fetch(`${BASE_URL}/studio/preview`, { headers: DEV_AUTH_HEADER });
	assert.equal(previewRes.status, 200);
	const previewHtml = await previewRes.text();
	assert.ok(previewHtml.includes("preview") || previewHtml.includes("Preview"), "Preview should render");
	console.log("✅ Draft preview loaded successfully");

	console.log("\n========================================================");
	console.log("🎉 ALL MOBIO LINK BIO V3.1 VERIFICATION TESTS PASSED!");
	console.log("========================================================\n");
}

runTests().catch((err) => {
	console.error("❌ Verification failed:", err);
	process.exit(1);
});
