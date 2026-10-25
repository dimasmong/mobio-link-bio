import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";
const ARTIFACT_DIR = "C:/Users/Dimas Mong/.gemini/antigravity/brain/e7780407-5c29-4c73-86e2-b40c63c8185f";
const TEST_ARTIFACTS_DIR = path.resolve("./test-artifacts/screenshots");

if (!fs.existsSync(TEST_ARTIFACTS_DIR)) {
	fs.mkdirSync(TEST_ARTIFACTS_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
	fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
	console.log(`Starting Phase 1C verification on ${BASE_URL}...`);

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

	const results = {
		ssrCheck: false,
		avatarFallback: false,
		viewports: {},
		languageToggle: false,
		zeroPlaceholderLinks: false,
		neutralStateCheck: false,
		consoleErrors: [],
	};

	// 1. SSR check
	const response = await page.goto(BASE_URL, { waitUntil: "networkidle" });
	results.ssrCheck = response && response.status() === 200;
	console.log(`SSR status 200: ${results.ssrCheck ? "PASS" : "FAIL"}`);

	// 2. Avatar Fallback check: Monogram initials rendered
	const avatarFallbackText = await page.evaluate(() => {
		const el = document.querySelector("header .bg-gradient-to-tr.from-violet-600");
		return el ? el.textContent.trim() : null;
	});
	console.log(`Avatar initials rendered: "${avatarFallbackText}"`);
	results.avatarFallback = avatarFallbackText !== null && avatarFallbackText.length > 0;

	// 3. Neutral Template State check (no Dimas Mong data; neutral placeholder displayed)
	const h1Text = await page.textContent("h1");
	console.log(`Profile H1: "${h1Text}"`);
	results.neutralStateCheck = !h1Text.includes("Dimas Mong");

	// 4. Viewports (360px, 400px, 768px, 1440px)
	const viewportsToTest = [
		{ name: "360px (Small Mobile)", width: 360, height: 740 },
		{ name: "400px (Standard Mobile)", width: 400, height: 840 },
		{ name: "768px (Tablet)", width: 768, height: 1024 },
		{ name: "1440px (Desktop)", width: 1440, height: 900 },
	];

	for (const vp of viewportsToTest) {
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.waitForTimeout(150);

		const overflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > document.documentElement.clientWidth;
		});

		results.viewports[vp.name] = !overflow ? "PASS (Clean, no overflow)" : "FAIL (Overflow)";
		console.log(`Viewport ${vp.name}: ${!overflow ? "PASS" : "FAIL"}`);
	}

	// 5. Capture fresh screenshots of Phase 1C neutral template
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.waitForTimeout(200);
	const desktopPath = path.join(ARTIFACT_DIR, "desktop.png");
	const desktopTarget = path.join(TEST_ARTIFACTS_DIR, "desktop.png");
	await page.screenshot({ path: desktopPath, fullPage: true });
	fs.copyFileSync(desktopPath, desktopTarget);
	console.log(`Updated desktop screenshot in ${desktopTarget}`);

	await page.setViewportSize({ width: 400, height: 840 });
	await page.waitForTimeout(200);
	const mobilePath = path.join(ARTIFACT_DIR, "mobile.png");
	const mobileTarget = path.join(TEST_ARTIFACTS_DIR, "mobile.png");
	await page.screenshot({ path: mobilePath, fullPage: true });
	fs.copyFileSync(mobilePath, mobileTarget);
	console.log(`Updated mobile screenshot in ${mobileTarget}`);

	// 6. Language Switcher check
	await page.setViewportSize({ width: 1440, height: 900 });
	const initialBio = await page.textContent("header p");
	console.log(`Initial Bio (ID): "${initialBio}"`);

	const globeBtn = await page.$("button[aria-label*='Pilih Bahasa'], button[aria-label*='Language'], button[aria-haspopup='menu']");
	if (globeBtn) {
		await globeBtn.click();
		await page.waitForTimeout(200);
	}
	await page.click('button[aria-label="English"]');
	await page.waitForTimeout(200);
	const enBio = await page.textContent("header p");
	console.log(`Switched Bio (EN): "${enBio}"`);

	if (globeBtn) {
		await globeBtn.click();
		await page.waitForTimeout(200);
	}
	await page.click('button[aria-label="Bahasa Indonesia"]');
	await page.waitForTimeout(200);
	const revertedBio = await page.textContent("header p");
	console.log(`Reverted Bio (ID): "${revertedBio}"`);

	results.languageToggle =
		initialBio.includes("Selamat datang") &&
		enBio.includes("Welcome to my Link in Bio") &&
		revertedBio.includes("Selamat datang");

	// 7. Zero placeholder links check (only valid links can be rendered/clicked)
	const activeLinks = await page.evaluate(() => {
		const anchors = Array.from(document.querySelectorAll("a[href]"));
		return anchors.map((a) => a.getAttribute("href"));
	});
	console.log(`Active clickable links on page: ${activeLinks.length}`, activeLinks);
	results.zeroPlaceholderLinks = activeLinks.every((h) => h && h !== "#" && !h.includes("example.com"));

	results.consoleErrors = consoleErrors;

	await browser.close();

	console.log("\n================ PHASE 1C SUMMARY ================");
	console.log(JSON.stringify(results, null, 2));
	console.log("==================================================");
}

run().catch((err) => {
	console.error("Test error:", err);
	process.exit(1);
});
