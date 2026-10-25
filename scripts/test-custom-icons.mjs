import { execSync } from "child_process";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";

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

function createFakeMp4() {
	// MP4 EBML/ftyp header
	const buf = Buffer.alloc(32);
	buf.writeUInt32BE(32, 0);
	buf.write("ftyp", 4, 4, "ascii");
	buf.write("isom", 8, 4, "ascii");
	buf.writeUInt32BE(512, 12);
	buf.write("isom", 16, 4, "ascii");
	buf.write("iso2", 20, 4, "ascii");
	buf.write("mp41", 24, 4, "ascii");
	return buf;
}

async function runCustomIconTests() {
	console.log("============================================================");
	console.log("MOBIO STUDIO — CUSTOM ICON SYSTEM & ICON LIBRARY TESTS");
	console.log("============================================================\n");

	const adminHeaders = {
		"X-Mobio-Dev-Identity": "admin@localhost.local",
		Origin: BASE_URL,
		"Content-Type": "application/json",
	};

	let createdLinkIds = [];
	let createdMediaIds = [];

	try {
		// ---------------------------------------------------------------------
		// 1. D1 SCHEMA & MIGRATION VERIFICATION
		// ---------------------------------------------------------------------
		console.log("TEST 1: Verifying D1 schema (icon_type, icon_url, icon_media_id)...");
		const linkCols = execSync(
			'npx.cmd wrangler d1 execute mobio-studio-db --local --command "PRAGMA table_info(links); PRAGMA table_info(links_draft);"',
			{ encoding: "utf8" }
		);

		if (
			linkCols.includes("icon_type") &&
			linkCols.includes("icon_url") &&
			linkCols.includes("icon_media_id")
		) {
			console.log("  ✓ Both links and links_draft contain custom icon columns.");
		} else {
			throw new Error("links or links_draft missing custom icon columns.");
		}

		const mediaAssetsSql = execSync(
			'npx.cmd wrangler d1 execute mobio-studio-db --local --command "SELECT sql FROM sqlite_master WHERE name=\'media_assets\';"',
			{ encoding: "utf8" }
		);
		if (mediaAssetsSql.includes("'icon'")) {
			console.log("  ✓ media_assets table CHECK constraint includes 'icon' category.");
		} else {
			throw new Error("media_assets table missing 'icon' category in CHECK constraint.");
		}

		// ---------------------------------------------------------------------
		// 2. BASIC PRESET ICON (CREATE & ISOLATION)
		// ---------------------------------------------------------------------
		console.log("\nTEST 2: Basic Preset Icon (creation and draft isolation)...");
		const presetRes = await fetch(`${BASE_URL}/api/studio/links`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				title_id: "Dokumentasi GitHub",
				title_en: "GitHub Docs",
				url: "https://github.com/dimasmong/mobio-link-bio",
				platform: "github",
				icon: "github",
				icon_type: "preset",
			}),
		});

		const presetData = await presetRes.json();
		if (!presetRes.ok || !presetData.link) {
			throw new Error(`Failed to create preset icon link: ${JSON.stringify(presetData)}`);
		}
		const presetLinkId = presetData.link.id;
		createdLinkIds.push(presetLinkId);

		if (presetData.link.icon_type !== "preset" || presetData.link.icon !== "github") {
			throw new Error(`Unexpected link data: ${JSON.stringify(presetData.link)}`);
		}
		console.log("  ✓ Successfully created draft link with preset icon (github).");

		// Verify draft isolation: Should NOT exist in public published links yet
		const pubLinksCheck1 = execSync(
			`npx.cmd wrangler d1 execute mobio-studio-db --local --command "SELECT count(*) as cnt FROM links WHERE id='${presetLinkId}';"`,
			{ encoding: "utf8" }
		);
		if (pubLinksCheck1.includes('"cnt": 0') || pubLinksCheck1.includes('"cnt":0')) {
			console.log("  ✓ Draft isolation verified: preset link not in published table.");
		} else {
			throw new Error("Draft isolation failed: link found in published table before publishing.");
		}

		// ---------------------------------------------------------------------
		// 3. EXTERNAL HTTPS ICON URL (VALIDATION & SECURITY)
		// ---------------------------------------------------------------------
		console.log("\nTEST 3: External Icon URL validation (HTTPS enforcement & SSRF prevention)...");

		// A. Insecure http:// rejection
		const httpRes = await fetch(`${BASE_URL}/api/studio/links`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				title_id: "Insecure Icon",
				title_en: "Insecure Icon",
				url: "https://example.com",
				platform: "custom",
				icon_type: "url",
				icon_url: "http://insecure-cdn.example.com/icon.png",
			}),
		});
		if (httpRes.status === 422) {
			console.log("  ✓ Insecure http:// icon URL strictly rejected with 422.");
		} else {
			throw new Error(`Expected 422 for http:// icon URL, got ${httpRes.status}`);
		}

		// B. JavaScript / XSS URL rejection
		const jsRes = await fetch(`${BASE_URL}/api/studio/links`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				title_id: "XSS Icon",
				title_en: "XSS Icon",
				url: "https://example.com",
				platform: "custom",
				icon_type: "url",
				icon_url: "javascript:alert(1)",
			}),
		});
		if (jsRes.status === 422) {
			console.log("  ✓ javascript: icon URL strictly rejected with 422.");
		} else {
			throw new Error(`Expected 422 for javascript: icon URL, got ${jsRes.status}`);
		}

		// C. Valid HTTPS URL acceptance
		const httpsRes = await fetch(`${BASE_URL}/api/studio/links`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				title_id: "CDN Icon Link",
				title_en: "CDN Icon Link",
				url: "https://example.com/app",
				platform: "website",
				icon_type: "url",
				icon_url: "https://assets.example.com/icons/brand.webp",
			}),
		});
		const httpsData = await httpsRes.json();
		if (!httpsRes.ok || !httpsData.link) {
			throw new Error(`Failed to create external URL icon link: ${JSON.stringify(httpsData)}`);
		}
		const urlLinkId = httpsData.link.id;
		createdLinkIds.push(urlLinkId);

		if (
			httpsData.link.icon_type !== "url" ||
			httpsData.link.icon_url !== "https://assets.example.com/icons/brand.webp"
		) {
			throw new Error(`Unexpected external URL link data: ${JSON.stringify(httpsData.link)}`);
		}
		console.log("  ✓ Valid HTTPS icon URL successfully accepted and stored.");

		// ---------------------------------------------------------------------
		// 4. CUSTOM ICON UPLOAD TO R2 (MEDIA MANAGEMENT)
		// ---------------------------------------------------------------------
		console.log("\nTEST 4: Custom Icon Upload to R2 via Media Management...");

		// A. Reject non-image for icon category (e.g. video)
		const videoForm = new FormData();
		videoForm.append("category", "icon");
		videoForm.append(
			"file",
			new Blob([createFakeMp4()], { type: "video/mp4" }),
			"fake-video.mp4"
		);
		const badFormatRes = await fetch(`${BASE_URL}/api/studio/media`, {
			method: "POST",
			headers: {
				"X-Mobio-Dev-Identity": "admin@localhost.local",
				Origin: BASE_URL,
			},
			body: videoForm,
		});
		if (badFormatRes.status === 422 || badFormatRes.status === 415) {
			console.log("  ✓ Video upload rejected for icon category with 422/415.");
		} else {
			throw new Error(`Expected 422/415 for video icon upload, got ${badFormatRes.status}`);
		}

		// B. Reject oversized icon (> 2 MiB)
		const oversizedBuf = Buffer.alloc(2.5 * 1024 * 1024, 0xff); // 2.5 MiB
		// Start with JPEG header so format is image
		oversizedBuf[0] = 0xff;
		oversizedBuf[1] = 0xd8;
		oversizedBuf[2] = 0xff;
		const oversizedForm = new FormData();
		oversizedForm.append("category", "icon");
		oversizedForm.append(
			"file",
			new Blob([oversizedBuf], { type: "image/jpeg" }),
			"large-icon.jpg"
		);
		const oversizedRes = await fetch(`${BASE_URL}/api/studio/media`, {
			method: "POST",
			headers: {
				"X-Mobio-Dev-Identity": "admin@localhost.local",
				Origin: BASE_URL,
			},
			body: oversizedForm,
		});
		if (oversizedRes.status === 413) {
			console.log("  ✓ Oversized icon (> 2 MiB) strictly rejected with 413.");
		} else {
			throw new Error(`Expected 413 for oversized icon, got ${oversizedRes.status}`);
		}

		// C. Successful transparent PNG upload
		const pngForm = new FormData();
		pngForm.append("category", "icon");
		pngForm.append(
			"file",
			new Blob([createMinimalPng()], { type: "image/png" }),
			"custom-icon.png"
		);
		const uploadRes = await fetch(`${BASE_URL}/api/studio/media`, {
			method: "POST",
			headers: {
				"X-Mobio-Dev-Identity": "admin@localhost.local",
				Origin: BASE_URL,
			},
			body: pngForm,
		});
		const uploadData = await uploadRes.json();
		if (!uploadRes.ok || !uploadData.asset) {
			throw new Error(`Failed to upload valid PNG icon: ${JSON.stringify(uploadData)}`);
		}
		const iconAssetId = uploadData.asset.id;
		createdMediaIds.push(iconAssetId);

		if (uploadData.asset.media_category !== "icon" || uploadData.asset.media_type !== "image") {
			throw new Error(`Unexpected asset category/type: ${JSON.stringify(uploadData.asset)}`);
		}
		console.log(`  ✓ Successfully uploaded transparent PNG icon to R2 (Asset ID: ${iconAssetId}).`);

		// Attach uploaded icon to a new draft link
		const uploadedLinkRes = await fetch(`${BASE_URL}/api/studio/links`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				title_id: "Tautan Ikon Kustom R2",
				title_en: "R2 Custom Icon Link",
				url: "https://example.com/custom-app",
				platform: "custom",
				icon_type: "upload",
				icon_media_id: iconAssetId,
			}),
		});
		const uploadedLinkData = await uploadedLinkRes.json();
		if (!uploadedLinkRes.ok || !uploadedLinkData.link) {
			throw new Error(`Failed to create link with uploaded icon: ${JSON.stringify(uploadedLinkData)}`);
		}
		const uploadLinkId = uploadedLinkData.link.id;
		createdLinkIds.push(uploadLinkId);

		if (
			uploadedLinkData.link.icon_type !== "upload" ||
			uploadedLinkData.link.icon_media_id !== iconAssetId
		) {
			throw new Error(`Unexpected link data: ${JSON.stringify(uploadedLinkData.link)}`);
		}
		console.log("  ✓ Successfully created draft link referencing R2 icon asset.");

		// ---------------------------------------------------------------------
		// 5. REFERENCED MEDIA DELETION PROTECTION
		// ---------------------------------------------------------------------
		console.log("\nTEST 5: Referenced Media Deletion Protection...");
		const delRes = await fetch(`${BASE_URL}/api/studio/media?id=${iconAssetId}`, {
			method: "DELETE",
			headers: adminHeaders,
		});
		const delData = await delRes.json();
		if (delRes.status === 409 && delData.error && delData.error.includes("sedang digunakan")) {
			console.log(`  ✓ Protected: Attempt to delete referenced icon media blocked with 409: "${delData.error}"`);
		} else {
			throw new Error(`Expected 409 Conflict when deleting referenced icon media, got ${delRes.status}: ${JSON.stringify(delData)}`);
		}

		// ---------------------------------------------------------------------
		// 6. ATOMIC DRAFT PUBLISHING & ASSET PROMOTION
		// ---------------------------------------------------------------------
		console.log("\nTEST 6: Atomic Draft Publishing & Asset Status Transition...");
		const pubRes = await fetch(`${BASE_URL}/api/studio/publish`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({}),
		});
		const pubData = await pubRes.json();
		if (!pubRes.ok) {
			throw new Error(`Failed to publish drafts: ${JSON.stringify(pubData)}`);
		}
		console.log(`  ✓ Atomic publish succeeded (Version: ${pubData.version}).`);

		// Verify published table contains the links with their custom icon properties
		const pubLinksCheck2 = execSync(
			`npx.cmd wrangler d1 execute mobio-studio-db --local --command "SELECT id, icon_type, icon_url, icon_media_id FROM links WHERE id='${uploadLinkId}';"`,
			{ encoding: "utf8" }
		);
		if (
			pubLinksCheck2.includes(iconAssetId) &&
			pubLinksCheck2.includes("upload")
		) {
			console.log("  ✓ Published links table correctly contains custom icon fields.");
		} else {
			throw new Error(`Published link record missing custom icon fields: ${pubLinksCheck2}`);
		}

		// Verify media asset status is now 'published'
		const assetStatusCheck = execSync(
			`npx.cmd wrangler d1 execute mobio-studio-db --local --command "SELECT status FROM media_assets WHERE id='${iconAssetId}';"`,
			{ encoding: "utf8" }
		);
		if (assetStatusCheck.includes('"status": "published"') || assetStatusCheck.includes('"status":"published"')) {
			console.log("  ✓ Referenced icon media asset status automatically promoted to 'published'.");
		} else {
			throw new Error(`Expected media asset status 'published', got: ${assetStatusCheck}`);
		}

		// Verify deletion is still protected on published reference
		const delPubRes = await fetch(`${BASE_URL}/api/studio/media?id=${iconAssetId}`, {
			method: "DELETE",
			headers: adminHeaders,
		});
		if (delPubRes.status === 409) {
			console.log("  ✓ Protected: Attempt to delete published referenced icon media blocked with 409.");
		} else {
			throw new Error(`Expected 409 Conflict for published referenced icon, got ${delPubRes.status}`);
		}

		// ---------------------------------------------------------------------
		// 7. ATOMIC DRAFT DISCARD (ROLLBACK)
		// ---------------------------------------------------------------------
		console.log("\nTEST 7: Atomic Draft Discard & Rollback...");
		// Modify draft link icon to a different preset
		const updateRes = await fetch(`${BASE_URL}/api/studio/links`, {
			method: "PUT",
			headers: adminHeaders,
			body: JSON.stringify({
				id: uploadLinkId,
				icon_type: "preset",
				icon: "sparkles",
				icon_url: "",
				icon_media_id: "",
			}),
		});
		if (!updateRes.ok) {
			throw new Error("Failed to update draft link.");
		}

		// Verify draft has changed
		const draftCheck = execSync(
			`npx.cmd wrangler d1 execute mobio-studio-db --local --command "SELECT icon_type, icon FROM links_draft WHERE id='${uploadLinkId}';"`,
			{ encoding: "utf8" }
		);
		if (!draftCheck.includes("sparkles")) {
			throw new Error("Draft update did not reflect in links_draft.");
		}

		// Discard drafts
		const discardRes = await fetch(`${BASE_URL}/api/studio/discard`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({}),
		});
		if (!discardRes.ok) {
			throw new Error("Failed to discard drafts.");
		}

		// Verify draft reverted back to published state (icon_type: 'upload', icon_media_id: iconAssetId)
		const revertCheck = execSync(
			`npx.cmd wrangler d1 execute mobio-studio-db --local --command "SELECT icon_type, icon_media_id FROM links_draft WHERE id='${uploadLinkId}';"`,
			{ encoding: "utf8" }
		);
		if (revertCheck.includes(iconAssetId) && revertCheck.includes("upload")) {
			console.log("  ✓ Draft discard cleanly reverted icon properties back to published state.");
		} else {
			throw new Error(`Draft discard failed to revert icon properties: ${revertCheck}`);
		}

		console.log("\n============================================================");
		console.log("ALL CUSTOM ICON SYSTEM TESTS PASSED SUCCESSFULLY! ✓");
		console.log("============================================================\n");
	} finally {
		// Clean up created test data to restore clean defaults
		console.log("Cleaning up test records...");
		try {
			execSync(
				`npx.cmd wrangler d1 execute mobio-studio-db --local --command "DELETE FROM links; DELETE FROM links_draft; DELETE FROM media_assets; UPDATE publish_metadata SET has_unpublished_changes = 0, version = 1 WHERE id = 'current';"`,
				{ encoding: "utf8" }
			);
			console.log("  ✓ Test records cleaned up. Database restored to clean defaults.");
		} catch (err) {
			console.warn("  ⚠ Failed to cleanup test records:", err);
		}
	}
}

runCustomIconTests().catch((err) => {
	console.error("\n❌ TEST SUITE FAILED:", err);
	process.exit(1);
});
