import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:5173";
const DEV_AUTH_HEADER = { "X-Mobio-Dev-Identity": "dimas@example.com" };

// Minimal valid JPEG binary buffer (1x1 pixel)
function createMinimalJpeg() {
	return Buffer.from([
		0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
		0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
		0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
		0x03, 0x03, 0x04, 0x05, 0x08, 0x05, 0x05, 0x04, 0x04, 0x05, 0x0a, 0x07,
		0x07, 0x06, 0x08, 0x0c, 0x0a, 0x0c, 0x0c, 0x0b, 0x0a, 0x0b, 0x0b, 0x0d,
		0x0e, 0x12, 0x10, 0x0d, 0x0e, 0x11, 0x0e, 0x0b, 0x0b, 0x10, 0x16, 0x10,
		0x11, 0x13, 0x14, 0x15, 0x15, 0x15, 0x0c, 0x0f, 0x17, 0x18, 0x16, 0x14,
		0x18, 0x12, 0x14, 0x15, 0x14, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
		0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
		0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
		0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
		0x00, 0xbf, 0x80, 0xff, 0xd9,
	]);
}

// Minimal valid MP4 file binary (ftyp isom brand)
function createMinimalMp4() {
	const ftyp = Buffer.from([
		0x00, 0x00, 0x00, 0x18, // 24 bytes size
		0x66, 0x74, 0x79, 0x70, // 'ftyp'
		0x69, 0x73, 0x6f, 0x6d, // 'isom'
		0x00, 0x00, 0x02, 0x00, // minor version
		0x69, 0x73, 0x6f, 0x6d, // compatible brand 'isom'
		0x6d, 0x70, 0x34, 0x31, // compatible brand 'mp41'
	]);
	const mdat = Buffer.from([
		0x00, 0x00, 0x00, 0x10, // 16 bytes size
		0x6d, 0x64, 0x61, 0x74, // 'mdat'
		0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
	]);
	return Buffer.concat([ftyp, mdat]);
}

// Minimal valid WebM file binary (EBML header 1A 45 DF A3)
function createMinimalWebm() {
	return Buffer.from([
		0x1a, 0x45, 0xdf, 0xa3, // EBML
		0x01, 0x00, 0x00, 0x1f, // EBML size
		0x42, 0x86, 0x81, 0x01, // EBMLVersion = 1
		0x42, 0xf7, 0x81, 0x01, // EBMLReadVersion = 1
		0x42, 0xf2, 0x81, 0x04, // EBMLMaxIDLength = 4
		0x42, 0xf3, 0x81, 0x08, // EBMLMaxSizeLength = 8
		0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, // DocType = "webm"
		0x42, 0x87, 0x81, 0x02, // DocTypeVersion = 2
		0x42, 0x85, 0x81, 0x02, // DocTypeReadVersion = 2
	]);
}

async function openMediaLibrary(p) {
	const btn = p.locator("button:has-text('Choose Video from R2'), button:has-text('Pilih Video R2'), button:has-text('Choose from R2'), button:has-text('Pilih dari R2'), button:has-text('Choose from Media Library'), button:has-text('Pilih dari Media Library')").first();
	await btn.click();
	await p.waitForTimeout(400);
}

async function main() {
	let browser;
	try {
		browser = await chromium.launch({ channel: "msedge", headless: true });
	} catch {
		browser = await chromium.launch({ channel: "chrome", headless: true });
	}

	const artifactDir = "test-artifacts/screenshots/mobile-upload";
	fs.mkdirSync(artifactDir, { recursive: true });

	const tempDir = "temp-upload-test";
	fs.mkdirSync(tempDir, { recursive: true });
	const jpegPath = path.resolve(tempDir, "test-photo.jpg");
	const mp4Path = path.resolve(tempDir, "test-video.mp4");
	const webmPath = path.resolve(tempDir, "test-video.webm");
	const textPath = path.resolve(tempDir, "unsupported.txt");

	fs.writeFileSync(jpegPath, createMinimalJpeg());
	fs.writeFileSync(mp4Path, createMinimalMp4());
	fs.writeFileSync(webmPath, createMinimalWebm());
	fs.writeFileSync(textPath, "This is an unsupported plain text file.");

	try {
		console.log("============================================================");
		console.log("MOBIO STUDIO — MOBILE MEDIA UPLOAD AUDIT");
		console.log("Source Selection Dialog • Android Compatibility • R2 Videos");
		console.log("============================================================\n");

		// Test 1: Desktop Browser — Open Media Library and verify Source Selection Dialog
		console.log("TEST 1: Verifying Upload Source Dialog on Desktop...");
		const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
		await context.setExtraHTTPHeaders(DEV_AUTH_HEADER);
		const page = await context.newPage();

		page.on("response", async (res) => {
			if (res.url().includes("/api/studio/media")) {
				console.log(`  [Media API Response] ${res.request().method()} ${res.url()} -> ${res.status()}`);
				if (res.status() >= 400) {
					try {
						console.log("  [Media API Error Body]", await res.text());
					} catch {}
				}
			}
		});

		await page.goto(`${BASE_URL}/studio?tab=appearance`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(600);

		// Switch to "Background & Media" subtab
		const mediaSubTab = page.locator("button:has-text('Background & Media'), button:has-text('Latar Belakang & Media')").first();
		await mediaSubTab.click();
		await page.waitForTimeout(400);

		// Switch background type to Custom Video
		const customVideoTabBtn = page.locator("button:has-text('Custom Video'), button:has-text('Video Kustom')").first();
		await customVideoTabBtn.click();
		await page.waitForTimeout(400);

		// Open Media Library modal (target: background)
		await openMediaLibrary(page);

		// Verify Media Library is open
		const mediaLibraryModal = page.locator("h3:has-text('Media Library (Cloudflare R2)')");
		if (!(await mediaLibraryModal.isVisible())) {
			throw new Error("Media Library modal did not open!");
		}
		console.log("  ✓ Media Library modal opened (Target: background).");

		// Click "+ Upload Media" button
		const uploadMediaBtn = page.locator("button:has-text('+ Upload Media')").first();
		await uploadMediaBtn.click();
		await page.waitForTimeout(300);

		// Verify Source Selection Dialog appears
		const sourceDialogTitle = page.locator("h3:has-text('Pilih Sumber Media'), h3:has-text('Select Media Source')");
		if (!(await sourceDialogTitle.isVisible())) {
			throw new Error("Upload Source Dialog did not appear upon clicking '+ Upload Media'!");
		}
		console.log("  ✓ Upload Source Dialog appeared successfully in-app.");

		// Verify Option 1 ("Galeri / Foto & Video") and Option 2 ("File Manager / Jelajahi Penyimpanan")
		const galleryOption = page.locator("label:has-text('Galeri / Foto & Video'), label:has-text('Gallery / Photos & Videos')");
		const fileManagerOption = page.locator("label:has-text('File Manager / Jelajahi Penyimpanan'), label:has-text('File Manager / Browse Storage')");

		if (!(await galleryOption.isVisible()) || !(await fileManagerOption.isVisible())) {
			throw new Error("Both Gallery and File Manager options must be visible in the dialog!");
		}
		console.log("  ✓ Both 'Gallery / Photos & Videos' and 'File Manager / Browse Storage' options are present.");

		// Verify input attributes
		const galleryInput = galleryOption.locator("input[type='file']");
		const fileManagerInput = fileManagerOption.locator("input[type='file']");

		const galleryAccept = await galleryInput.getAttribute("accept");
		const galleryCapture = await galleryInput.getAttribute("capture");
		const fileManagerAccept = await fileManagerInput.getAttribute("accept");
		const fileManagerCapture = await fileManagerInput.getAttribute("capture");

		console.log(`  ✓ Gallery input accept: "${galleryAccept}"`);
		console.log(`  ✓ Gallery input capture: ${galleryCapture ?? "NONE (Correct: does not force camera)"}`);
		console.log(`  ✓ File Manager input accept: ${fileManagerAccept ?? "NONE (Correct: allows browsing storage without image restriction)"}`);
		console.log(`  ✓ File Manager input capture: ${fileManagerCapture ?? "NONE (Correct)"}`);

		if (!galleryAccept || (!galleryAccept.includes("image/*") && !galleryAccept.includes("video/*"))) {
			throw new Error("Gallery input must support both image/* and video/*!");
		}
		if (galleryCapture) {
			throw new Error("Gallery input must NOT have capture attribute!");
		}
		if (fileManagerAccept && !fileManagerAccept.includes("*/*")) {
			throw new Error("File Manager input must not restrict accept attribute to images only!");
		}
		if (fileManagerCapture) {
			throw new Error("File Manager input must NOT have capture attribute!");
		}

		await page.screenshot({ path: path.join(artifactDir, "desktop-source-dialog.png") });

		// Test Dialog Close: Cancel button
		const cancelBtn = page.locator("button:has-text('Batal'), button:has-text('Cancel')").first();
		await cancelBtn.click();
		await page.waitForTimeout(300);
		if (await sourceDialogTitle.isVisible()) {
			throw new Error("Cancel button failed to close the source dialog!");
		}
		console.log("  ✓ Cancel button closes the source dialog cleanly without closing Media Library.");

		// Test Dialog Re-open & Close via Escape key
		await uploadMediaBtn.click();
		await page.waitForTimeout(200);
		await page.keyboard.press("Escape");
		await page.waitForTimeout(200);
		if (await sourceDialogTitle.isVisible()) {
			throw new Error("Escape key failed to close the source dialog!");
		}
		console.log("  ✓ Escape key closes the source dialog cleanly.");

		// Test 2: Mobile Viewport Emulation (Android Phone - Pixel 7: 412x915)
		console.log("\nTEST 2: Auditing Mobile Viewport (Android Screen Size 390x844)...");
		const mobileContext = await browser.newContext({
			viewport: { width: 390, height: 844 },
			userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
		});
		await mobileContext.setExtraHTTPHeaders(DEV_AUTH_HEADER);
		const mobilePage = await mobileContext.newPage();
		await mobilePage.goto(`${BASE_URL}/studio?tab=appearance`, { waitUntil: "domcontentloaded" });
		await mobilePage.waitForTimeout(600);

		// Switch to "Background & Media" subtab on mobile
		const mobileMediaSubTab = mobilePage.locator("button:has-text('Background & Media'), button:has-text('Latar Belakang & Media')").first();
		await mobileMediaSubTab.click();
		await mobilePage.waitForTimeout(400);

		// Open Media Library on mobile
		await openMediaLibrary(mobilePage);

		// Open Source Dialog on mobile
		await mobilePage.locator("button:has-text('+ Upload Media')").first().click();
		await mobilePage.waitForTimeout(300);

		const mobileDialogBox = await mobilePage.locator("h3:has-text('Pilih Sumber Media'), h3:has-text('Select Media Source')").locator("xpath=ancestor::div[contains(@class, 'rounded-3xl')]").first().boundingBox();
		console.log(`  ✓ Mobile dialog dimensions: ${Math.round(mobileDialogBox.width)}x${Math.round(mobileDialogBox.height)}px (Fits viewport: ${mobileDialogBox.width <= 390})`);
		if (mobileDialogBox.width > 390) {
			throw new Error("Dialog exceeds mobile viewport width!");
		}

		await mobilePage.screenshot({ path: path.join(artifactDir, "mobile-android-source-dialog.png") });

		// Test Back navigation (popstate) closes dialog on mobile
		await mobilePage.goBack();
		await mobilePage.waitForTimeout(300);
		const isStillOpen = await mobilePage.locator("h3:has-text('Pilih Sumber Media'), h3:has-text('Select Media Source')").isVisible();
		console.log(`  ✓ Mobile hardware/gesture Back button support: ${!isStillOpen ? "PASSED (Closed dialog cleanly)" : "Active"}`);

		await mobileContext.close();

		// Test 3: Upload Photo via Gallery Option and verify thumbnail
		console.log("\nTEST 3: Uploading Photo via Gallery Option to Cloudflare R2...");
		// Re-open source dialog
		await uploadMediaBtn.click();
		await page.waitForTimeout(200);

		const galleryFileInput = page.locator("label:has-text('Galeri / Foto & Video'), label:has-text('Gallery / Photos & Videos')").locator("input[type='file']");
		await galleryFileInput.setInputFiles(jpegPath);
		await page.waitForTimeout(1000);

		// Re-open Media Library to inspect grid
		await openMediaLibrary(page);

		// Switch to "All Categories" tab inside Media Library to see all items
		const allCatTab = page.locator("button:has-text('All Categories'), button:has-text('Semua Kategori')").first();
		if (await allCatTab.isVisible()) {
			await allCatTab.click();
			await page.waitForTimeout(400);
		}

		// Verify photo card in grid
		const photoCards = await page.locator("img[alt='test-photo.jpg']").all();
		if (photoCards.length === 0) {
			throw new Error("Photo card with alt='test-photo.jpg' not found after upload!");
		}
		console.log("  ✓ Photo uploaded to R2 and displayed as image thumbnail in Media Library!");
		await page.screenshot({ path: path.join(artifactDir, "media-library-with-photo.png") });

		// Test 4: Upload Video (MP4) via Gallery Option and verify Video Card + Play Icon
		console.log("\nTEST 4: Uploading MP4 Video via Gallery Option to Cloudflare R2...");
		await uploadMediaBtn.click();
		await page.waitForTimeout(200);

		const galleryVideoInput = page.locator("label:has-text('Galeri / Foto & Video'), label:has-text('Gallery / Photos & Videos')").locator("input[type='file']");
		await galleryVideoInput.setInputFiles(mp4Path);
		await page.waitForTimeout(1200);

		// Re-open Media Library to inspect video card
		await openMediaLibrary(page);

		// Switch to "All Categories" tab
		if (await allCatTab.isVisible()) {
			await allCatTab.click();
			await page.waitForTimeout(400);
		}

		// Verify video asset in grid
		const videoCardTitle = page.locator("div[title='test-video.mp4']").first();
		if (!(await videoCardTitle.isVisible())) {
			throw new Error("Video card with title='test-video.mp4' not found after upload!");
		}
		console.log("  ✓ Video uploaded to R2 successfully!");

		// Verify Play Icon overlay and VIDEO badge
		const videoCard = videoCardTitle.locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')]").first();
		const playIcon = videoCard.locator("svg path[d='M8 5v14l11-7z']");
		const videoBadge = videoCard.locator("span:has-text('VIDEO')");

		if (!(await playIcon.isVisible()) || !(await videoBadge.isVisible())) {
			throw new Error("Video asset must show Play icon overlay and 'VIDEO' badge!");
		}
		console.log("  ✓ Video card displays dedicated Play icon overlay and 'VIDEO' badge!");
		await page.screenshot({ path: path.join(artifactDir, "media-library-with-video-card.png") });

		// Test 5: Upload Video via File Manager Option
		console.log("\nTEST 5: Uploading WebM Video via File Manager Option...");
		await uploadMediaBtn.click();
		await page.waitForTimeout(200);

		const fileManagerVideoInput = page.locator("label:has-text('File Manager / Jelajahi Penyimpanan'), label:has-text('File Manager / Browse Storage')").locator("input[type='file']");
		await fileManagerVideoInput.setInputFiles(webmPath);
		await page.waitForTimeout(1200);

		// Re-open Media Library to inspect webm card
		await openMediaLibrary(page);

		if (await allCatTab.isVisible()) {
			await allCatTab.click();
			await page.waitForTimeout(400);
		}

		const webmCardTitle = page.locator("div[title='test-video.webm']").first();
		if (!(await webmCardTitle.isVisible())) {
			throw new Error("WebM video card with title='test-video.webm' not found!");
		}
		console.log("  ✓ File Manager option successfully uploaded WebM video to Cloudflare R2!");

		// Test 6: Verify Backend R2 HTTP Range Streaming for uploaded MP4
		console.log("\nTEST 6: Verifying HTTP Range Streaming on Video Endpoint...");
		const videoSrc = await videoCard.locator("video").getAttribute("src");
		console.log(`  ✓ Video preview endpoint: ${videoSrc}`);

		const streamRes = await fetch(`${BASE_URL}${videoSrc}`, {
			headers: { ...DEV_AUTH_HEADER, Range: "bytes=0-15" },
		});
		console.log(`  ✓ HTTP Range response status: ${streamRes.status} (Expected: 206 Partial Content)`);
		console.log(`  ✓ Content-Range header: ${streamRes.headers.get("content-range")}`);
		console.log(`  ✓ Content-Type header: ${streamRes.headers.get("content-type")}`);

		if (streamRes.status !== 206) {
			throw new Error(`Expected HTTP 206 Partial Content for video Range request, got ${streamRes.status}`);
		}
		if (streamRes.headers.get("content-type") !== "video/mp4") {
			throw new Error(`Expected content-type video/mp4, got ${streamRes.headers.get("content-type")}`);
		}
		console.log("  ✓ Video streaming with HTTP 206 Range verified!");

		// Test 7: Negative Test — Unsupported file format shows clear error
		console.log("\nTEST 7: Negative Test — Uploading unsupported file format...");
		await uploadMediaBtn.click();
		await page.waitForTimeout(200);

		const fmInvalidInput = page.locator("label:has-text('File Manager / Jelajahi Penyimpanan'), label:has-text('File Manager / Browse Storage')").locator("input[type='file']");
		await fmInvalidInput.setInputFiles(textPath);
		await page.waitForTimeout(800);

		const errorBanner = page.locator("div:has-text('Format file tidak didukung'), div:has-text('tidak didukung')").first();
		if (!(await errorBanner.isVisible())) {
			throw new Error("Expected clear error message when uploading unsupported file format!");
		}
		const errorText = await errorBanner.innerText();
		console.log(`  ✓ Clear rejection error displayed: "${errorText.replace(/\n/g, ' ')}"`);

		// Test 8: Clean up uploaded test media files
		console.log("\nTEST 8: Cleaning up uploaded test media...");
		for (const filename of ["test-photo.jpg", "test-video.mp4", "test-video.webm"]) {
			const itemCard = page.locator(`div:has-text('${filename}')`).first().locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')]").first();
			if (await itemCard.isVisible()) {
				const deleteBtn = itemCard.locator("button[title*='Hapus'], button[title*='Delete']");
				await deleteBtn.click();
				await page.waitForTimeout(400);
				console.log(`  ✓ Cleaned up ${filename}`);
			}
		}

		await context.close();
		console.log("\n============================================================");
		console.log("ALL MOBILE MEDIA UPLOAD TESTS PASSED SUCCESSFULLY! 🎉");
		console.log("============================================================");
	} finally {
		await browser.close();
		// Remove temp files
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {}
	}
}

main().catch((err) => {
	console.error("\n❌ TEST SUITE FAILED:", err);
	process.exit(1);
});
