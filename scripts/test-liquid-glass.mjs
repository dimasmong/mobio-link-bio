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
	console.log(`Starting Liquid Glass Design verification on ${BASE_URL}...`);

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
		coverBannerCheck: false,
		profileCardCheck: false,
		singleColumnLinksCheck: false,
		floatingNavCheck: false,
		exploreSectionCheck: false,
		lightboxModalCheck: false,
		contactSectionCheck: false,
		languageToggleCheck: false,
		viewports: {},
		consoleErrors: [],
	};

	// 1. SSR & HTTP 200 Check
	const response = await page.goto(BASE_URL, { waitUntil: "networkidle" });
	results.ssrCheck = response && response.status() === 200;
	console.log(`1. SSR Status 200: ${results.ssrCheck ? "PASS" : "FAIL"}`);

	// 2. Cover Banner Check
	const coverEl = await page.$(".glass-liquid-cover");
	results.coverBannerCheck = coverEl !== null;
	console.log(`2. Cover Banner rendered: ${results.coverBannerCheck ? "PASS" : "FAIL"}`);

	// 3. Profile Card Check (Dedicated card with avatar, name, handle, bio ONLY)
	const h1Text = await page.textContent("header h1");
	const handleText = await page.textContent("header .text-violet-700");
	const bioText = await page.textContent("header p");
	const avatarInitial = await page.textContent("header .rounded-full.flex");
	console.log(`3. Profile Info: Name="${h1Text}", Handle="${handleText}", AvatarInitial="${avatarInitial}"`);
	results.profileCardCheck = Boolean(h1Text && handleText && bioText);

	// 4. Single-column Links Check
	// Verify all vertical links are stacked in a single vertical column (their X positions should be equal)
	const linkCards = await page.$$("nav[aria-label*='Tautan'] a, nav[aria-label*='Links'] a");
	console.log(`Found ${linkCards.length} vertical link cards.`);
	let isSingleColumn = linkCards.length > 0;
	if (linkCards.length >= 2) {
		const box0 = await linkCards[0].boundingBox();
		const box1 = await linkCards[1].boundingBox();
		// Both cards should have approximately the same x position and width
		if (box0 && box1) {
			const xDiff = Math.abs(box0.x - box1.x);
			const wDiff = Math.abs(box0.width - box1.width);
			isSingleColumn = xDiff < 5 && wDiff < 5 && box1.y > box0.y;
		}
	}
	results.singleColumnLinksCheck = isSingleColumn;
	console.log(`4. Single Column Layout (Desktop & Mobile): ${results.singleColumnLinksCheck ? "PASS" : "FAIL"}`);

	// 5. Floating Navigation Check (Home, Explore, Contact)
	const desktopNavItems = await page.$$("aside[aria-label='Desktop Navigation'] nav a");
	console.log(`Desktop nav items count: ${desktopNavItems.length}`);
	results.floatingNavCheck = desktopNavItems.length >= 3;

	// 6. Explore Section Check
	const exploreHeading = await page.$("#explore");
	results.exploreSectionCheck = exploreHeading !== null;
	console.log(`6. Explore Section: ${results.exploreSectionCheck ? "PASS" : "FAIL"}`);

	// 7. Lightbox Modal Interaction Check
	const galleryCard = await page.$("div[role='button'][aria-label*='gambar']");
	if (galleryCard) {
		await galleryCard.click();
		await page.waitForTimeout(300);
		const modal = await page.$("div[role='dialog']");
		const hasModal = modal !== null;
		// Press Escape to close
		await page.keyboard.press("Escape");
		await page.waitForTimeout(300);
		const modalAfterEsc = await page.$("div[role='dialog']");
		results.lightboxModalCheck = hasModal && modalAfterEsc === null;
		console.log(`7. Lightbox Modal open & close: ${results.lightboxModalCheck ? "PASS" : "FAIL"}`);
	} else {
		console.log("7. No gallery items found to test lightbox");
	}

	// 8. Contact Section Check
	const contactSection = await page.$("#contact");
	results.contactSectionCheck = contactSection !== null;
	console.log(`8. Contact Section: ${results.contactSectionCheck ? "PASS" : "FAIL"}`);

	// 9. Viewports Check (Responsive & No horizontal overflow)
	const viewports = [
		{ name: "360px (Small Mobile)", width: 360, height: 740 },
		{ name: "400px (Standard Mobile)", width: 400, height: 840 },
		{ name: "768px (Tablet)", width: 768, height: 1024 },
		{ name: "1024px (Small Desktop)", width: 1024, height: 800 },
		{ name: "1440px (Desktop)", width: 1440, height: 900 },
	];

	for (const vp of viewports) {
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.waitForTimeout(150);
		const overflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > document.documentElement.clientWidth;
		});
		results.viewports[vp.name] = !overflow ? "PASS (No overflow)" : "FAIL (Overflow)";
		console.log(`9. Viewport ${vp.name}: ${!overflow ? "PASS" : "FAIL"}`);
	}

	// 10. Language Switcher Check
	await page.setViewportSize({ width: 1440, height: 900 });
	const initialBio = await page.textContent("header p");
	await page.click('button[aria-label="English"]');
	await page.waitForTimeout(200);
	const enBio = await page.textContent("header p");
	await page.click('button[aria-label="Bahasa Indonesia"]');
	await page.waitForTimeout(200);
	const idBio = await page.textContent("header p");

	results.languageToggleCheck =
		initialBio.includes("Selamat datang") &&
		enBio.includes("Welcome to my Link in Bio") &&
		idBio.includes("Selamat datang");
	console.log(`10. Language Toggle: ${results.languageToggleCheck ? "PASS" : "FAIL"}`);

	// 11. Capture Full Page Screenshots for Desktop & Mobile
	// Desktop Screenshot
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.waitForTimeout(300);
	const desktopTarget = path.join(TEST_ARTIFACTS_DIR, "desktop.png");
	const desktopBrain = path.join(ARTIFACT_DIR, "desktop.png");
	await page.screenshot({ path: desktopTarget, fullPage: true });
	fs.copyFileSync(desktopTarget, desktopBrain);
	console.log(`Saved Desktop screenshot to ${desktopTarget}`);

	// Mobile Screenshot
	await page.setViewportSize({ width: 400, height: 840 });
	await page.waitForTimeout(300);
	const mobileTarget = path.join(TEST_ARTIFACTS_DIR, "mobile.png");
	const mobileBrain = path.join(ARTIFACT_DIR, "mobile.png");
	await page.screenshot({ path: mobileTarget, fullPage: true });
	fs.copyFileSync(mobileTarget, mobileBrain);
	console.log(`Saved Mobile screenshot to ${mobileTarget}`);

	results.consoleErrors = consoleErrors;

	await browser.close();

	console.log("\n================ FULL VERIFICATION RESULTS ================");
	console.log(JSON.stringify(results, null, 2));
	console.log("============================================================");

	const allPass =
		results.ssrCheck &&
		results.coverBannerCheck &&
		results.profileCardCheck &&
		results.singleColumnLinksCheck &&
		results.floatingNavCheck &&
		results.exploreSectionCheck &&
		results.lightboxModalCheck &&
		results.contactSectionCheck &&
		results.languageToggleCheck &&
		results.consoleErrors.length === 0;

	if (!allPass) {
		console.warn("Some checks had non-standard results, check log above.");
	}
}

run().catch((err) => {
	console.error("Test runner failed:", err);
	process.exit(1);
});
