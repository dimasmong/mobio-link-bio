import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-artifacts/screenshots/phase3");

if (!fs.existsSync(SCREENSHOT_DIR)) {
	fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Minimal valid JPEG header (FF D8 FF E0 00 10 4A 46 49 46 00 01 ...)
function createMinimalJpeg() {
	return Buffer.from([
		0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
		0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
		0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
		0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
		0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
		0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
		0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
		0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
		0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
		0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
		0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
		0x00, 0xbf, 0x00, 0xff, 0xd9,
	]);
}

// Minimal valid PNG header (89 50 4E 47 0D 0A 1A 0A ...)
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

// Minimal valid WebP header
function createMinimalWebp() {
	return Buffer.from([
		0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
		0x56, 0x50, 0x38, 0x4c, 0x0d, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
		0x00, 0x07, 0x10, 0x11, 0x11, 0x88, 0x88, 0xfe, 0x07, 0x00,
	]);
}

async function runPhase3Tests() {
	console.log("============================================================");
	console.log("MOBIO STUDIO PHASE 3 — AUTOMATED VERIFICATION SUITE");
	console.log("Appearance Studio & Cloudflare R2 Media Management");
	console.log("============================================================\n");

	const report = {
		d1MigrationAndSchema: false,
		securityAndAuthGuards: false,
		mediaUploadAndMagicBytes: false,
		sizeLimitsAndRejection: false,
		draftPrivacyIsolation: false,
		httpRangeRequests: false,
		appearanceDraftAndTokens: false,
		referencedMediaProtection: false,
		atomicPublishAndPublicServing: false,
		appearanceResetToDefaults: false,
		studioUiNavigation: false,
		responsiveChecks: {},
		consoleErrors: [],
	};

	// -------------------------------------------------------------------------
	// 1. D1 SCHEMA & MIGRATION VERIFICATION
	// -------------------------------------------------------------------------
	console.log("TEST 1: Verifying D1 Schema (media_assets, appearance_settings, profile)...");
	try {
		const stdout = execSync(
			'npx.cmd wrangler d1 execute mobio-db --local --command "SELECT name FROM sqlite_master WHERE type=\'table\' AND name NOT LIKE \'sqlite_%\' AND name NOT LIKE \'_cf_%\' ORDER BY name ASC;"',
			{ encoding: "utf8" }
		);

		if (stdout.includes("media_assets") && stdout.includes("appearance_settings")) {
			// Verify columns in appearance_settings
			const columns = execSync(
				'npx.cmd wrangler d1 execute mobio-db --local --command "PRAGMA table_info(appearance_settings);"',
				{ encoding: "utf8" }
			);

			if (
				columns.includes("accent_color") &&
				columns.includes("glass_blur") &&
				columns.includes("background_media_id") &&
				columns.includes("cover_media_id")
			) {
				report.d1MigrationAndSchema = true;
				console.log("  ✓ D1 media_assets table & appearance_settings design token columns verified.");
			} else {
				console.error("  ✗ Missing expected columns in appearance_settings:", columns);
			}
		} else {
			console.error("  ✗ Required tables missing in D1 output:", stdout);
		}
	} catch (err) {
		console.error("  ✗ D1 check failed:", err.message);
	}

	// -------------------------------------------------------------------------
	// 2. SECURITY & AUTHENTICATION GUARDS
	// -------------------------------------------------------------------------
	console.log("\nTEST 2: Testing Security & Authentication Guards...");
	const browser = await chromium.launch({ channel: "msedge" });
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		// A. Unauthenticated request to GET /api/studio/appearance
		const noAuthAppearance = await context.request.get(`${BASE_URL}/api/studio/appearance`);
		// B. Unauthenticated upload to POST /api/studio/media
		const noAuthMedia = await context.request.post(`${BASE_URL}/api/studio/media`);
		// C. Unauthenticated preview of media
		const noAuthPreview = await context.request.get(`${BASE_URL}/api/studio/media/fake-id/preview`);

		if (
			[401, 403].includes(noAuthAppearance.status()) &&
			[401, 403].includes(noAuthMedia.status()) &&
			[401, 403].includes(noAuthPreview.status())
		) {
			report.securityAndAuthGuards = true;
			console.log("  ✓ All studio appearance & media endpoints strictly reject unauthenticated requests (401/403).");
		} else {
			console.error("  ✗ Security check failed. Statuses:", {
				appearance: noAuthAppearance.status(),
				media: noAuthMedia.status(),
				preview: noAuthPreview.status(),
			});
		}
	} catch (err) {
		console.error("  ✗ Security test error:", err.message);
	}

	// -------------------------------------------------------------------------
	// 3. MEDIA UPLOAD, SIGNATURE VALIDATION & FORMAT ENFORCEMENT
	// -------------------------------------------------------------------------
	console.log("\nTEST 3: Testing File Signatures, Size Limits & Format Allowlist...");
	let uploadedAvatarId = "";
	let uploadedCoverId = "";
	let uploadedBgId = "";

	try {
		const adminHeaders = {
			"X-Mobio-Dev-Identity": "admin@localhost.local",
			"Origin": BASE_URL,
		};

		// A. Reject HTML upload disguised as JPEG
		const fakeHtml = Buffer.from("<html><body><script>alert(1)</script></body></html>");
		const htmlRes = await context.request.post(`${BASE_URL}/api/studio/media`, {
			headers: adminHeaders,
			multipart: {
				category: "avatar",
				file: {
					name: "exploit.jpg",
					mimeType: "image/jpeg",
					buffer: fakeHtml,
				},
			},
		});

		// B. Reject SVG (executable vectors)
		const fakeSvg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
		const svgRes = await context.request.post(`${BASE_URL}/api/studio/media`, {
			headers: adminHeaders,
			multipart: {
				category: "avatar",
				file: {
					name: "logo.svg",
					mimeType: "image/svg+xml",
					buffer: fakeSvg,
				},
			},
		});

		// C. Reject file exceeding size limit (create 6 MiB buffer for 5 MiB avatar limit)
		const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
		oversizedBuffer[0] = 0xff;
		oversizedBuffer[1] = 0xd8;
		oversizedBuffer[2] = 0xff; // fake jpeg magic bytes
		const oversizedRes = await context.request.post(`${BASE_URL}/api/studio/media`, {
			headers: adminHeaders,
			multipart: {
				category: "avatar",
				file: {
					name: "oversized.jpg",
					mimeType: "image/jpeg",
					buffer: oversizedBuffer,
				},
			},
		});

		if (
			[415, 422].includes(htmlRes.status()) &&
			[415, 422].includes(svgRes.status()) &&
			oversizedRes.status() === 413
		) {
			report.sizeLimitsAndRejection = true;
			console.log("  ✓ Malicious/fake formats rejected (415) and oversized files rejected (413).");
		} else {
			console.error("  ✗ Validation rejection failed. Statuses:", {
				html: htmlRes.status(),
				svg: svgRes.status(),
				oversized: oversizedRes.status(),
			});
		}

		// D. Upload Valid Avatar (JPEG)
		const validJpeg = createMinimalJpeg();
		const avatarUploadRes = await context.request.post(`${BASE_URL}/api/studio/media`, {
			headers: adminHeaders,
			multipart: {
				category: "avatar",
				file: {
					name: "avatar-test.jpg",
					mimeType: "image/jpeg",
					buffer: validJpeg,
				},
			},
		});

		const avatarData = await avatarUploadRes.json();
		if (avatarUploadRes.status() === 201 && avatarData.asset?.id) {
			uploadedAvatarId = avatarData.asset.id;
			console.log(`  ✓ Valid Avatar uploaded to R2 (ID: ${uploadedAvatarId})`);
		}

		// E. Upload Valid Cover (PNG)
		const validPng = createMinimalPng();
		const coverUploadRes = await context.request.post(`${BASE_URL}/api/studio/media`, {
			headers: adminHeaders,
			multipart: {
				category: "cover",
				file: {
					name: "cover-banner.png",
					mimeType: "image/png",
					buffer: validPng,
				},
			},
		});

		const coverData = await coverUploadRes.json();
		if (coverUploadRes.status() === 201 && coverData.asset?.id) {
			uploadedCoverId = coverData.asset.id;
			console.log(`  ✓ Valid Cover banner uploaded to R2 (ID: ${uploadedCoverId})`);
		}

		// F. Upload Valid Background (WebP)
		const validWebp = createMinimalWebp();
		const bgUploadRes = await context.request.post(`${BASE_URL}/api/studio/media`, {
			headers: adminHeaders,
			multipart: {
				category: "background",
				file: {
					name: "aurora-bg.webp",
					mimeType: "image/webp",
					buffer: validWebp,
				},
			},
		});

		const bgData = await bgUploadRes.json();
		if (bgUploadRes.status() === 201 && bgData.asset?.id) {
			uploadedBgId = bgData.asset.id;
			console.log(`  ✓ Valid Background uploaded to R2 (ID: ${uploadedBgId})`);
		}

		if (uploadedAvatarId && uploadedCoverId && uploadedBgId) {
			report.mediaUploadAndMagicBytes = true;
		}
	} catch (err) {
		console.error("  ✗ Media upload test error:", err.message);
	}

	// -------------------------------------------------------------------------
	// 4. DRAFT ISOLATION & PUBLIC MEDIA ROUTE PRIVACY
	// -------------------------------------------------------------------------
	console.log("\nTEST 4: Testing Draft Media Privacy vs Admin Preview...");
	try {
		// A. Authenticated Admin Preview should succeed (200)
		const previewRes = await context.request.get(
			`${BASE_URL}/api/studio/media/${uploadedAvatarId}/preview`,
			{
				headers: {
					"X-Mobio-Dev-Identity": "admin@localhost.local",
				},
			}
		);

		// B. Public access to unpublished draft media should be blocked (403 or 404)
		const publicDraftRes = await context.request.get(
			`${BASE_URL}/api/public/media/${uploadedAvatarId}`
		);

		if (previewRes.status() === 200 && [403, 404].includes(publicDraftRes.status())) {
			report.draftPrivacyIsolation = true;
			console.log("  ✓ Admin can preview draft media (200); public access is strictly blocked (403/404).");
		} else {
			console.error("  ✗ Draft privacy mismatch:", {
				adminPreview: previewRes.status(),
				publicAccess: publicDraftRes.status(),
			});
		}
	} catch (err) {
		console.error("  ✗ Draft privacy test error:", err.message);
	}

	// -------------------------------------------------------------------------
	// 5. HTTP RANGE REQUEST SUPPORT
	// -------------------------------------------------------------------------
	console.log("\nTEST 5: Testing HTTP Range Requests (206 Partial Content)...");
	try {
		const rangeRes = await context.request.get(
			`${BASE_URL}/api/studio/media/${uploadedAvatarId}/preview`,
			{
				headers: {
					"X-Mobio-Dev-Identity": "admin@localhost.local",
					"Range": "bytes=0-9",
				},
			}
		);

		const contentRange = rangeRes.headers()["content-range"];
		const acceptRanges = rangeRes.headers()["accept-ranges"];

		if (
			rangeRes.status() === 206 &&
			contentRange &&
			contentRange.startsWith("bytes 0-9/") &&
			acceptRanges === "bytes"
		) {
			report.httpRangeRequests = true;
			console.log(`  ✓ Range request verified: Status 206, Content-Range: ${contentRange}`);
		} else {
			console.error("  ✗ Range request failed:", {
				status: rangeRes.status(),
				contentRange,
				acceptRanges,
			});
		}
	} catch (err) {
		console.error("  ✗ HTTP Range request error:", err.message);
	}

	// -------------------------------------------------------------------------
	// 6. APPEARANCE STUDIO DRAFT SAVING & TOKEN VALIDATION
	// -------------------------------------------------------------------------
	console.log("\nTEST 6: Testing Appearance Studio Draft & Token Validation...");
	try {
		const adminHeaders = {
			"X-Mobio-Dev-Identity": "admin@localhost.local",
			"Origin": BASE_URL,
			"Content-Type": "application/json",
		};

		// A. Save valid draft appearance
		const saveDraftRes = await context.request.post(`${BASE_URL}/api/studio/appearance`, {
			headers: adminHeaders,
			data: JSON.stringify({
				action: "save",
				appearance: {
					palette: "frost-aurora",
					accent_color: "#8b5cf6",
					glass_blur: "20px",
					glass_opacity: 0.75,
					glass_border_opacity: 0.35,
					background_type: "image",
					background_media_id: uploadedBgId,
					cover_enabled: 1,
					cover_media_id: uploadedCoverId,
					cover_aspect_ratio: "aspect-[21/9]",
				},
			}),
		});

		// B. Save invalid accent color
		const invalidColorRes = await context.request.post(`${BASE_URL}/api/studio/appearance`, {
			headers: adminHeaders,
			data: JSON.stringify({
				action: "save",
				appearance: {
					accent_color: "invalid-color-string",
				},
			}),
		});

		// C. Link avatar to profile draft
		await context.request.post(`${BASE_URL}/api/studio/profile`, {
			headers: adminHeaders,
			data: JSON.stringify({
				name: "Your Name",
				handle: "@username",
				avatar_media_id: uploadedAvatarId,
			}),
		});

		if (saveDraftRes.status() === 200 && invalidColorRes.status() === 422) {
			report.appearanceDraftAndTokens = true;
			console.log("  ✓ Appearance draft saved successfully; invalid tokens rejected (422).");
		} else {
			console.error("  ✗ Appearance draft error:", {
				saveStatus: saveDraftRes.status(),
				invalidStatus: invalidColorRes.status(),
			});
		}
	} catch (err) {
		console.error("  ✗ Appearance test error:", err.message);
	}

	// -------------------------------------------------------------------------
	// 7. REFERENCED MEDIA DELETION PROTECTION
	// -------------------------------------------------------------------------
	console.log("\nTEST 7: Testing Referenced Media Deletion Protection...");
	try {
		const adminHeaders = {
			"X-Mobio-Dev-Identity": "admin@localhost.local",
			"Origin": BASE_URL,
		};

		// Attempt to delete uploadedCoverId (currently referenced by draft cover)
		const delRes = await context.request.delete(
			`${BASE_URL}/api/studio/media?id=${uploadedCoverId}`,
			{ headers: adminHeaders }
		);

		if (delRes.status() === 409) {
			const body = await delRes.json();
			report.referencedMediaProtection = true;
			console.log(`  ✓ Deletion blocked as expected (409 Conflict): ${body.error}`);
		} else {
			console.error(`  ✗ Expected 409 Conflict but got: ${delRes.status()}`);
		}
	} catch (err) {
		console.error("  ✗ Deletion protection error:", err.message);
	}

	// -------------------------------------------------------------------------
	// 8. ATOMIC PUBLISHING & PUBLIC SSR SERVING
	// -------------------------------------------------------------------------
	console.log("\nTEST 8: Testing Atomic Publishing & Public SSR Integration...");
	try {
		const adminHeaders = {
			"X-Mobio-Dev-Identity": "admin@localhost.local",
			"Origin": BASE_URL,
			"Content-Type": "application/json",
		};

		// Publish drafts
		const pubRes = await context.request.post(`${BASE_URL}/api/studio/publish`, {
			headers: adminHeaders,
			data: JSON.stringify({}),
		});

		const pubData = await pubRes.json();
		console.log(`  ✓ Published successfully to version v${pubData.version}`);

		// Public endpoint should now serve the published media with immutable cache
		const publicMediaRes = await context.request.get(
			`${BASE_URL}/api/public/media/${uploadedCoverId}`
		);

		const cacheControl = publicMediaRes.headers()["cache-control"];
		const contentType = publicMediaRes.headers()["content-type"];

		if (
			publicMediaRes.status() === 200 &&
			cacheControl?.includes("immutable") &&
			contentType === "image/png"
		) {
			report.atomicPublishAndPublicServing = true;
			console.log(`  ✓ Published media accessible publicly (200 OK, Cache-Control: ${cacheControl})`);
		} else {
			console.error("  ✗ Public media serving error:", {
				status: publicMediaRes.status(),
				cacheControl,
				contentType,
			});
		}
	} catch (err) {
		console.error("  ✗ Publish test error:", err.message);
	}

	// -------------------------------------------------------------------------
	// 9. CLEAN RESET TO DEFAULTS (PRESERVING CLEAN REPO STATE)
	// -------------------------------------------------------------------------
	console.log("\nTEST 9: Testing Appearance Reset to Neutral Defaults...");
	try {
		const adminHeaders = {
			"X-Mobio-Dev-Identity": "admin@localhost.local",
			"Origin": BASE_URL,
			"Content-Type": "application/json",
		};

		// Reset draft appearance to defaults
		const resetRes = await context.request.post(`${BASE_URL}/api/studio/appearance`, {
			headers: adminHeaders,
			data: JSON.stringify({ action: "reset" }),
		});

		// Clear profile avatar
		await context.request.post(`${BASE_URL}/api/studio/profile`, {
			headers: adminHeaders,
			data: JSON.stringify({
				name: "Your Name",
				handle: "@username",
				avatar_media_id: "",
				avatar_url: "",
			}),
		});

		// Publish clean defaults
		await context.request.post(`${BASE_URL}/api/studio/publish`, {
			headers: adminHeaders,
			data: JSON.stringify({}),
		});

		if (resetRes.status() === 200) {
			report.appearanceResetToDefaults = true;
			console.log("  ✓ Appearance reset to clean default Frost Aurora and published.");
		}

		// Delete unreferenced test assets
		for (const id of [uploadedAvatarId, uploadedCoverId, uploadedBgId]) {
			if (id) {
				await context.request.delete(`${BASE_URL}/api/studio/media?id=${id}`, {
					headers: adminHeaders,
				});
			}
		}
		console.log("  ✓ Cleaned up test media assets from R2 & D1.");
	} catch (err) {
		console.error("  ✗ Reset test error:", err.message);
	}

	// -------------------------------------------------------------------------
	// 10. STUDIO UI & RESPONSIVE VIEWPORT CHECKS (PLAYWRIGHT)
	// -------------------------------------------------------------------------
	console.log("\nTEST 10: Testing Studio UI & Responsive Viewports...");
	try {
		// Set dev admin header directly on page
		await page.setExtraHTTPHeaders({
			"X-Mobio-Dev-Identity": "admin@localhost.local",
		});

		// Navigate to Studio Appearance tab
		await page.goto(`${BASE_URL}/studio?tab=appearance`, { waitUntil: "networkidle" });

		// Verify presence of Appearance Studio headings
		const appearanceTitle = await page.textContent("h2");
		if (appearanceTitle?.includes("Appearance Studio")) {
			report.studioUiNavigation = true;
			console.log("  ✓ Appearance Studio tab rendered correctly in UI.");
		}

		// Responsive viewports
		const viewports = [
			{ width: 360, height: 740, name: "360px-mobile-small" },
			{ width: 400, height: 844, name: "400px-mobile-standard" },
			{ width: 768, height: 1024, name: "768px-tablet" },
			{ width: 1024, height: 768, name: "1024px-desktop" },
			{ width: 1440, height: 900, name: "1440px-wide-desktop" },
		];

		for (const vp of viewports) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.waitForTimeout(300);

			const shotPath = path.join(SCREENSHOT_DIR, `studio-appearance-${vp.name}.png`);
			await page.screenshot({ path: shotPath, fullPage: true });
			report.responsiveChecks[vp.name] = true;
			console.log(`  ✓ Captured screenshot at ${vp.width}x${vp.height}: ${vp.name}`);
		}

		// Also capture Public Homepage across viewports
		await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
		for (const vp of viewports) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.waitForTimeout(300);

			const shotPath = path.join(SCREENSHOT_DIR, `public-home-${vp.name}.png`);
			await page.screenshot({ path: shotPath, fullPage: true });
		}
		console.log("  ✓ Public homepage responsive screenshots captured.");
	} catch (err) {
		console.error("  ✗ UI & viewport test error:", err.message);
	} finally {
		await browser.close();
	}

	// -------------------------------------------------------------------------
	// FINAL RESULTS SUMMARY
	// -------------------------------------------------------------------------
	console.log("\n============================================================");
	console.log("PHASE 3 VERIFICATION SUMMARY");
	console.log("============================================================");
	const allPassed =
		report.d1MigrationAndSchema &&
		report.securityAndAuthGuards &&
		report.mediaUploadAndMagicBytes &&
		report.sizeLimitsAndRejection &&
		report.draftPrivacyIsolation &&
		report.httpRangeRequests &&
		report.appearanceDraftAndTokens &&
		report.referencedMediaProtection &&
		report.atomicPublishAndPublicServing &&
		report.appearanceResetToDefaults &&
		report.studioUiNavigation;

	for (const [key, val] of Object.entries(report)) {
		if (typeof val === "boolean") {
			console.log(`${val ? "  ✓" : "  ✗"} ${key}: ${val ? "PASSED" : "FAILED"}`);
		}
	}

	console.log(`\nOverall Result: ${allPassed ? "ALL TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}`);
	return allPassed;
}

runPhase3Tests().then((passed) => {
	process.exit(passed ? 0 : 1);
});
