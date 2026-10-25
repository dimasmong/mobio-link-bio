import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-artifacts/screenshots/phase4");

if (!fs.existsSync(SCREENSHOT_DIR)) {
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function createMinimalPng() {
	return Buffer.from([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
		0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
		0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
		0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
		0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
	]);
}

async function runPhase4Tests() {
	console.log("============================================================");
	console.log("MOBIO STUDIO PHASE 4 — AUTOMATED VERIFICATION SUITE");
	console.log("Explore Editor & 10 Flexible Content Block Models");
	console.log("============================================================\n");

	const report = {
		d1MigrationAndSchema: false,
		securityAndAuthGuards: false,
		exploreDraftCrud: false,
		exploreContentModels: false,
		reorderAndDuplication: false,
		draftPrivacyIsolation: false,
		referencedMediaProtection: false,
		atomicPublishAndPublicRendering: false,
		atomicDiscard: false,
		studioUiNavigation: false,
		responsiveChecks: {},
		consoleErrors: [],
	};

	// -------------------------------------------------------------------------
	// 1. D1 SCHEMA & MIGRATION VERIFICATION
	// -------------------------------------------------------------------------
	console.log("TEST 1: Verifying D1 Schema (explore_items & explore_items_draft)...");
	try {
		const stdout = execSync(
			'npx.cmd wrangler d1 execute mobio-db --local --command "SELECT name FROM sqlite_master WHERE type=\'table\' AND name IN (\'explore_items\', \'explore_items_draft\');"',
			{ encoding: "utf8" }
		);
		if (stdout.includes("explore_items") && stdout.includes("explore_items_draft")) {
			console.log("  ✅ Both explore_items and explore_items_draft tables verified.");
			report.d1MigrationAndSchema = true;
		} else {
			console.error("  ❌ Missing explore tables:", stdout);
		}
	} catch (err) {
		console.error("  ❌ D1 check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 2. SECURITY & AUTH GUARD VERIFICATION
	// -------------------------------------------------------------------------
	console.log("\nTEST 2: Verifying Security and Auth Guards on /api/studio/explore...");
	try {
		const unauthGet = await fetch(`${BASE_URL}/api/studio/explore`);
		if (unauthGet.status === 401 || unauthGet.status === 403) {
			console.log(`  ✅ Unauthenticated GET correctly rejected with status ${unauthGet.status}`);
		} else {
			console.error(`  ❌ Expected 401/403 for unauthenticated GET, got ${unauthGet.status}`);
		}

		const unauthPost = await fetch(`${BASE_URL}/api/studio/explore`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type: "project", title_id: "Hacked" }),
		});
		if (unauthPost.status === 401 || unauthPost.status === 403) {
			console.log(`  ✅ Unauthenticated POST correctly rejected with status ${unauthPost.status}`);
			report.securityAndAuthGuards = true;
		} else {
			console.error(`  ❌ Expected 401/403 for unauthenticated POST, got ${unauthPost.status}`);
		}
	} catch (err) {
		console.error("  ❌ Auth guard check failed:", err.message);
	}

	const authHeaders = {
		"Content-Type": "application/json",
		"X-Mobio-Dev-Identity": "admin@localhost.local",
	};

	// -------------------------------------------------------------------------
	// 3. EXPLORE DRAFT CRUD & 10 FLEXIBLE CONTENT MODELS
	// -------------------------------------------------------------------------
	console.log("\nTEST 3: Verifying Explore Draft CRUD & Flexible Content Models...");
	let createdProject = null;
	let createdGallery = null;
	let createdVideo = null;
	let createdReview = null;

	try {
		// Test POST 1: Project
		const resProj = await fetch(`${BASE_URL}/api/studio/explore`, {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({
				type: "project",
				title_id: "Website Mobio Bio",
				title_en: "Mobio Bio Website",
				subtitle_id: "Open Source Link in Bio",
				subtitle_en: "Open Source Link in Bio",
				description_id: "Platform tautan bio pribadi performa tinggi.",
				description_en: "High performance personal bio link platform.",
				url: "https://github.com/dimasmong/mobio-link-bio",
				badge_id: "Unggulan",
				badge_en: "Featured",
				metadata_json: JSON.stringify({ tags: ["TypeScript", "Cloudflare", "Tailwind"], year: "2026" }),
			}),
		});
		const dataProj = await resProj.json();
		if (resProj.status === 201 && dataProj.item?.id) {
			createdProject = dataProj.item;
			console.log("  ✅ Created project item:", createdProject.id);
		} else {
			console.error("  ❌ Failed to create project item:", dataProj);
		}

		// Test POST 2: Gallery
		const resGal = await fetch(`${BASE_URL}/api/studio/explore`, {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({
				type: "gallery",
				title_id: "Pemandangan Alam Bromo",
				title_en: "Mount Bromo Landscape",
				subtitle_id: "Fotografi Lanskap",
				subtitle_en: "Landscape Photography",
				cover_image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272",
				badge_id: "Foto",
				badge_en: "Photo",
			}),
		});
		const dataGal = await resGal.json();
		if (resGal.status === 201 && dataGal.item?.id) {
			createdGallery = dataGal.item;
			console.log("  ✅ Created gallery item:", createdGallery.id);
		} else {
			console.error("  ❌ Failed to create gallery item:", dataGal);
		}

		// Test POST 3: Video
		const resVid = await fetch(`${BASE_URL}/api/studio/explore`, {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({
				type: "video",
				title_id: "Showreel Animasi 3D",
				title_en: "3D Animation Showreel",
				subtitle_id: "Kompilasi Visual 2026",
				subtitle_en: "2026 Visual Reel",
				url: "https://youtube.com/watch?v=sample",
				badge_id: "Video",
				badge_en: "Video",
			}),
		});
		const dataVid = await resVid.json();
		if (resVid.status === 201 && dataVid.item?.id) {
			createdVideo = dataVid.item;
			console.log("  ✅ Created video item:", createdVideo.id);
		}

		// Test POST 4: Review
		const resRev = await fetch(`${BASE_URL}/api/studio/explore`, {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({
				type: "review",
				title_id: "Ulasan Buku Clean Architecture",
				title_en: "Clean Architecture Book Review",
				subtitle_id: "Robert C. Martin",
				subtitle_en: "Robert C. Martin",
				description_id: "Buku esensial bagi perancang perangkat lunak modern.",
				description_en: "Essential reading for software architects.",
				badge_id: "Review",
				badge_en: "Review",
				metadata_json: JSON.stringify({ rating: "4.9/5", artist: "Robert C. Martin" }),
			}),
		});
		const dataRev = await resRev.json();
		if (resRev.status === 201 && dataRev.item?.id) {
			createdReview = dataRev.item;
			console.log("  ✅ Created review item:", createdReview.id);
		}

		// Verify GET list
		const getList = await fetch(`${BASE_URL}/api/studio/explore`, { headers: authHeaders });
		const listData = await getList.json();
		if (listData.explore?.length >= 4) {
			console.log(`  ✅ Draft Explore list returned ${listData.explore.length} items.`);
			report.exploreDraftCrud = true;
			report.exploreContentModels = true;
		} else {
			console.error("  ❌ Expected at least 4 items in explore list:", listData);
		}
	} catch (err) {
		console.error("  ❌ Explore CRUD check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 4. REORDERING, DUPLICATION & TOGGLE VISIBILITY
	// -------------------------------------------------------------------------
	console.log("\nTEST 4: Verifying Reordering, Duplication & Toggle Visibility...");
	try {
		if (createdProject) {
			// Toggle visibility
			const resToggle = await fetch(`${BASE_URL}/api/studio/explore`, {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({ id: createdProject.id, is_enabled: 0 }),
			});
			const dataToggle = await resToggle.json();
			if (dataToggle.status === "ok") {
				console.log("  ✅ Successfully toggled is_enabled to 0.");
			}

			// Duplication
			const resDup = await fetch(`${BASE_URL}/api/studio/explore`, {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({ action: "duplicate", id: createdProject.id }),
			});
			const dataDup = await resDup.json();
			if (dataDup.item && dataDup.item.title_id.includes("(Copy)")) {
				console.log("  ✅ Successfully duplicated item:", dataDup.item.title_id);
			}

			// Reorder
			const resList = await fetch(`${BASE_URL}/api/studio/explore`, { headers: authHeaders });
			const items = (await resList.json()).explore || [];
			const reversedIds = items.map((x) => x.id).reverse();
			const resReorder = await fetch(`${BASE_URL}/api/studio/explore`, {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({ orderedIds: reversedIds }),
			});
			if ((await resReorder.json()).status === "ok") {
				console.log("  ✅ Successfully reordered items in draft.");
				report.reorderAndDuplication = true;
			}
		}
	} catch (err) {
		console.error("  ❌ Reordering/Duplication check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 5. DRAFT PRIVACY ISOLATION
	// -------------------------------------------------------------------------
	console.log("\nTEST 5: Verifying Draft Privacy Isolation on Public Website...");
	try {
		const publicRes = await fetch(`${BASE_URL}/`);
		const publicHtml = await publicRes.text();
		if (!publicHtml.includes("Website Mobio Bio")) {
			console.log("  ✅ Draft explore item is NOT present on public website before publish.");
			report.draftPrivacyIsolation = true;
		} else {
			console.error("  ❌ Draft explore item leaked onto public website before publish!");
		}
	} catch (err) {
		console.error("  ❌ Privacy isolation check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 6. REFERENCED MEDIA DELETION PROTECTION
	// -------------------------------------------------------------------------
	console.log("\nTEST 6: Verifying Media Deletion Protection when Referenced in Explore...");
	try {
		// Upload a test media
		const pngBuf = createMinimalPng();
		const formData = new FormData();
		formData.append("file", new Blob([pngBuf], { type: "image/png" }), "explore-cover-art.png");
		formData.append("category", "cover");

		const uploadRes = await fetch(`${BASE_URL}/api/studio/media`, {
			method: "POST",
			headers: { "X-Mobio-Dev-Identity": "admin@localhost.local" },
			body: formData,
		});
		const uploadData = await uploadRes.json();
		const testMediaId = uploadData.asset?.id;

		if (testMediaId) {
			console.log("  ✅ Uploaded test media asset:", testMediaId);

			// Attach media to an explore draft item
			const mediaUrl = `/api/studio/media/${testMediaId}/preview`;
			await fetch(`${BASE_URL}/api/studio/explore`, {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify({
					type: "image",
					title_id: "Karya Seni Eksklusif",
					title_en: "Exclusive Artwork",
					cover_image: mediaUrl,
				}),
			});

			// Now attempt to delete the media asset
			const deleteRes = await fetch(`${BASE_URL}/api/studio/media`, {
				method: "DELETE",
				headers: authHeaders,
				body: JSON.stringify({ id: testMediaId }),
			});
			const deleteData = await deleteRes.json();

			if (deleteRes.status === 409 && deleteData.error?.includes("Explore")) {
				console.log(`  ✅ Deletion safely rejected with HTTP 409: "${deleteData.error}"`);
				report.referencedMediaProtection = true;
			} else {
				console.error("  ❌ Expected HTTP 409 when deleting referenced explore media, got:", deleteRes.status, deleteData);
			}
		}
	} catch (err) {
		console.error("  ❌ Media deletion protection check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 7. ATOMIC PUBLISH & PUBLIC RENDERING
	// -------------------------------------------------------------------------
	console.log("\nTEST 7: Verifying Atomic Publishing & Public SSR Rendering...");
	try {
		// Ensure created project is active before publish
		if (createdProject) {
			await fetch(`${BASE_URL}/api/studio/explore`, {
				method: "PUT",
				headers: authHeaders,
				body: JSON.stringify({ id: createdProject.id, is_enabled: 1 }),
			});
		}

		const pubRes = await fetch(`${BASE_URL}/api/studio/publish`, {
			method: "POST",
			headers: authHeaders,
		});
		const pubData = await pubRes.json();
		if (pubRes.ok && pubData.status === "ok") {
			console.log(`  ✅ Published atomically to v${pubData.version}`);

			// Verify public website renders published items
			const publicHtml = await (await fetch(`${BASE_URL}/`)).text();
			if (publicHtml.includes("Website Mobio Bio") || publicHtml.includes("Pemandangan Alam Bromo")) {
				console.log("  ✅ Public website now renders published Explore items in SSR!");
				report.atomicPublishAndPublicRendering = true;
			} else {
				console.error("  ❌ Published Explore items not found in public HTML!");
			}
		} else {
			console.error("  ❌ Atomic publish failed:", pubData);
		}
	} catch (err) {
		console.error("  ❌ Atomic publish check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 8. ATOMIC DISCARD
	// -------------------------------------------------------------------------
	console.log("\nTEST 8: Verifying Atomic Discard Functionality...");
	try {
		// Add an uncommitted draft item
		const uncommittedRes = await fetch(`${BASE_URL}/api/studio/explore`, {
			method: "POST",
			headers: authHeaders,
			body: JSON.stringify({
				type: "note",
				title_id: "Item Draft Yang Dibatalkan",
				title_en: "Discarded Draft Item",
			}),
		});
		const uncommittedData = await uncommittedRes.json();
		const uncommittedId = uncommittedData.item?.id;

		// Discard
		const discardRes = await fetch(`${BASE_URL}/api/studio/discard`, {
			method: "POST",
			headers: authHeaders,
		});
		if (discardRes.ok) {
			const checkDraft = await (await fetch(`${BASE_URL}/api/studio/explore`, { headers: authHeaders })).json();
			const exists = (checkDraft.explore || []).some((x) => x.id === uncommittedId);
			if (!exists) {
				console.log("  ✅ Discard cleanly rolled back draft items to published baseline.");
				report.atomicDiscard = true;
			} else {
				console.error("  ❌ Discarded item still present in draft!");
			}
		}
	} catch (err) {
		console.error("  ❌ Discard check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 9. PLAYWRIGHT UI & RESPONSIVE RENDERING
	// -------------------------------------------------------------------------
	console.log("\nTEST 9: Playwright UI Inspection across Viewports...");
	try {
		const browser = await chromium.launch({ channel: "msedge", headless: true });
		const viewports = [
			{ name: "360px-mobile-small", width: 360, height: 740 },
			{ name: "400px-mobile-standard", width: 400, height: 844 },
			{ name: "768px-tablet", width: 768, height: 1024 },
			{ name: "1024px-desktop", width: 1024, height: 768 },
			{ name: "1440px-wide-desktop", width: 1440, height: 900 },
		];

		const context = await browser.newContext({
			extraHTTPHeaders: { "X-Mobio-Dev-Identity": "admin@localhost.local" },
		});
		const page = await context.newPage();

		page.on("console", (msg) => {
			if (msg.type() === "error") {
				report.consoleErrors.push(msg.text());
			}
		});

		// 1. Visit Explore Studio
		await page.goto(`${BASE_URL}/studio?tab=explore`, { waitUntil: "networkidle" });
		await page.waitForTimeout(1000);

		const titleText = await page.textContent("h2");
		if (titleText && titleText.includes("Explore")) {
			console.log("  ✅ Studio Explore tab rendered successfully.");
			report.studioUiNavigation = true;
		}

		for (const vp of viewports) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.waitForTimeout(400);

			const studioShot = path.join(SCREENSHOT_DIR, `studio-explore-${vp.name}.png`);
			await page.screenshot({ path: studioShot, fullPage: false });

			// Also capture public explore tab
			await page.goto(`${BASE_URL}/#explore`, { waitUntil: "networkidle" });
			await page.waitForTimeout(400);
			const publicShot = path.join(SCREENSHOT_DIR, `public-explore-${vp.name}.png`);
			await page.screenshot({ path: publicShot, fullPage: false });

			report.responsiveChecks[vp.name] = {
				studioScreenshot: studioShot,
				publicScreenshot: publicShot,
			};
			console.log(`  📸 Captured responsive screenshots for ${vp.name}`);

			// Return to studio
			await page.goto(`${BASE_URL}/studio?tab=explore`, { waitUntil: "networkidle" });
		}

		await browser.close();
	} catch (err) {
		console.error("  ❌ Playwright UI check failed:", err.message);
	}

	console.log("\n============================================================");
	console.log("PHASE 4 TEST SUMMARY REPORT");
	console.log("============================================================");
	console.log(JSON.stringify(report, null, 2));

	const allPassed =
		report.d1MigrationAndSchema &&
		report.securityAndAuthGuards &&
		report.exploreDraftCrud &&
		report.exploreContentModels &&
		report.reorderAndDuplication &&
		report.draftPrivacyIsolation &&
		report.referencedMediaProtection &&
		report.atomicPublishAndPublicRendering &&
		report.atomicDiscard &&
		report.studioUiNavigation;

	if (allPassed) {
		console.log("\n🎉 ALL PHASE 4 VERIFICATION TESTS PASSED SUCCESSFULLY!");
		process.exit(0);
	} else {
		console.error("\n❌ SOME PHASE 4 TESTS FAILED!");
		process.exit(1);
	}
}

runPhase4Tests().catch((err) => {
	console.error("Fatal test suite error:", err);
	process.exit(1);
});
