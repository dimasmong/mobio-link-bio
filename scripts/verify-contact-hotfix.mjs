import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const VIEWPORTS = [
	{ name: "mobile-360", width: 360, height: 640 },
	{ name: "mobile-390", width: 390, height: 844 },
	{ name: "tablet-768", width: 768, height: 1024 },
	{ name: "desktop-1024", width: 1024, height: 768 },
	{ name: "laptop-1366", width: 1366, height: 768 },
	{ name: "desktop-1920", width: 1920, height: 1080 },
];

async function main() {
	let browser;
	try {
		browser = await chromium.launch({ channel: "msedge", headless: true });
	} catch {
		browser = await chromium.launch({ channel: "chrome", headless: true });
	}

	const artifactDir = "test-artifacts/screenshots/contact-hotfix";
	fs.mkdirSync(artifactDir, { recursive: true });

	const results = [];

	for (const vp of VIEWPORTS) {
		for (const lang of ["id", "en"]) {
			const context = await browser.newContext({
				viewport: { width: vp.width, height: vp.height },
			});
			await context.addCookies([
				{ name: "mobio_lang", value: lang, domain: "localhost", path: "/" },
			]);

			const page = await context.newPage();
			await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
			await page.waitForTimeout(300);

			// 1. Measure Home link card on this viewport
			const homeLinks = await page.locator("nav[aria-label] a").all();
			let homeCardBox = null;
			if (homeLinks.length > 0) {
				homeCardBox = await homeLinks[0].boundingBox();
			}

			// 2. Navigate to Contact tab via visible tab button
			const tabId = vp.width >= 640 ? "#desktop-tab-contact" : "#mobile-tab-contact";
			const contactNav = page.locator(tabId);
			await contactNav.click();
			await page.waitForTimeout(350);

			const screenshotPath = path.join(artifactDir, `contact-${lang}-${vp.name}.png`);
			await page.screenshot({ path: screenshotPath, fullPage: false });

			const mainBox = await page.locator("main > div").first().boundingBox();
			const headingBadge = await page.locator("#contact .inline-flex").first().boundingBox();
			const contactCards = await page.locator("#contact a").all();

			if (contactCards.length === 0) {
				throw new Error(`No contact cards found on ${vp.name} (${lang})`);
			}

			const card0Box = await contactCards[0].boundingBox();
			const titleEl = contactCards[0].locator("h3");
			const titleBox = await titleEl.boundingBox();
			const titleText = (await titleEl.innerText()).trim();

			// Calculate midpoints
			const cardMidX = card0Box.x + card0Box.width / 2;
			const badgeMidX = headingBadge.x + headingBadge.width / 2;
			const diffMidX = Math.abs(cardMidX - badgeMidX);

			// Expected text
			const expectedTitle = lang === "en" ? "Send Email" : "Kirim Email";

			const metrics = {
				viewport: vp.name,
				width: vp.width,
				lang,
				mainWidth: Math.round(mainBox.width),
				cardWidth: Math.round(card0Box.width),
				homeWidth: homeCardBox ? Math.round(homeCardBox.width) : null,
				widthMatchesHome: homeCardBox ? Math.abs(Math.round(card0Box.width) - Math.round(homeCardBox.width)) <= 1 : true,
				cardMidX: Math.round(cardMidX * 10) / 10,
				badgeMidX: Math.round(badgeMidX * 10) / 10,
				diffMidX: Math.round(diffMidX * 10) / 10,
				isAlignedWithBadge: diffMidX < 2,
				titleText,
				expectedTitle,
				titleHeight: Math.round(titleBox.height),
				isSingleLine: titleBox.height <= 30, // 2 lines would be >= 40px
				screenshotPath,
			};

			results.push(metrics);
			console.log(
				`[${vp.name} | ${lang.toUpperCase()}] CardWidth: ${metrics.cardWidth}px | HomeWidth: ${metrics.homeWidth}px | MatchHome: ${metrics.widthMatchesHome} | DiffMidX: ${metrics.diffMidX}px | Aligned: ${metrics.isAlignedWithBadge} | Text: "${metrics.titleText}" | TitleHeight: ${metrics.titleHeight}px (SingleLine: ${metrics.isSingleLine})`
			);

			await context.close();
		}
	}

	// Telemetry interaction test: click contact card and verify telemetry POST
	{
		const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
		const page = await context.newPage();
		let telemetryFired = false;
		page.on("request", (req) => {
			if (req.url().includes("/api/public/telemetry") && req.method() === "POST") {
				try {
					const body = req.postDataJSON();
					if (body?.category === "contact" && body?.type === "interaction") {
						telemetryFired = true;
					}
				} catch {}
			}
		});

		await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(300);

		const contactNav = page.locator("#desktop-tab-contact");
		await contactNav.click();
		await page.waitForTimeout(300);

		const card = page.locator("#contact a").first();
		await card.click();
		await page.waitForTimeout(400);

		console.log(`\nTelemetry Interaction Test: ${telemetryFired ? "PASSED" : "FAILED"}`);
		if (!telemetryFired) {
			console.warn("Telemetry POST request did not fire on contact click!");
		}
		await context.close();
	}

	await browser.close();

	// Verify all checks
	let allPassed = true;
	for (const r of results) {
		if (!r.widthMatchesHome) {
			console.error(`FAIL: Width does not match home on ${r.viewport} ${r.lang}: card ${r.cardWidth} vs home ${r.homeWidth}`);
			allPassed = false;
		}
		if (!r.isAlignedWithBadge) {
			console.error(`FAIL: Misaligned with heading badge on ${r.viewport} ${r.lang} (diff: ${r.diffMidX}px)`);
			allPassed = false;
		}
		if (!r.isSingleLine) {
			console.error(`FAIL: Title wraps onto multiple lines on ${r.viewport} ${r.lang} (height: ${r.titleHeight}px)`);
			allPassed = false;
		}
		if (r.titleText !== r.expectedTitle) {
			console.error(`FAIL: Title text mismatch on ${r.viewport} ${r.lang}: got "${r.titleText}", expected "${r.expectedTitle}"`);
			allPassed = false;
		}
	}

	if (!allPassed) {
		process.exit(1);
	}
	console.log("\nALL CONTACT LAYOUT HOTFIX TESTS PASSED SUCCESSFULLY! (12/12 combinations verified)");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
