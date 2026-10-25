import { chromium } from "playwright";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";

async function runBrowserTests() {
	console.log(`Starting real browser verification on ${BASE_URL}...`);

	const consoleErrors = [];
	let browser;

	try {
		// Launch using system Edge or Chrome
		browser = await chromium.launch({
			channel: "msedge",
			headless: true,
		});
	} catch (e) {
		console.log("Edge channel not available, trying chrome...");
		browser = await chromium.launch({
			channel: "chrome",
			headless: true,
		});
	}

	const context = await browser.newContext();
	const page = await context.newPage();

	// Listen for any console errors or page crashes
	page.on("console", (msg) => {
		if (msg.type() === "error") {
			consoleErrors.push(msg.text());
		}
	});

	page.on("pageerror", (err) => {
		consoleErrors.push(err.message);
	});

	const results = {
		ssrCheck: false,
		viewports: {},
		languageSwitcher: false,
		linkIntegrity: false,
		badgesOffByDefault: false,
		noConsoleErrors: false,
	};

	try {
		// 1. SSR & Initial Page Load
		const response = await page.goto(BASE_URL, { waitUntil: "networkidle" });
		if (response && response.status() === 200) {
			const title = await page.title();
			console.log(`✓ Page loaded successfully. Title: "${title}"`);
			results.ssrCheck = title.includes("Link in Bio");
		}

		// 2. Viewport & Responsiveness Tests (Checking for horizontal overflow)
		const testViewports = [
			{ name: "Small Mobile (360x640)", width: 360, height: 640 },
			{ name: "Standard Mobile (390x844)", width: 390, height: 844 },
			{ name: "Tablet (768x1024)", width: 768, height: 1024 },
			{ name: "Desktop (1280x800)", width: 1280, height: 800 },
			{ name: "Wide Desktop (1440x900)", width: 1440, height: 900 },
		];

		for (const vp of testViewports) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.waitForTimeout(150);

			const overflow = await page.evaluate(() => {
				const scrollWidth = document.documentElement.scrollWidth;
				const clientWidth = document.documentElement.clientWidth;
				return scrollWidth > clientWidth;
			});

			const isReadable = await page.evaluate(() => {
				const h1 = document.querySelector("h1");
				return h1 && h1.offsetWidth > 0 && h1.offsetHeight > 0;
			});

			const passed = !overflow && isReadable;
			results.viewports[vp.name] = passed ? "PASS (No overflow)" : "FAIL";
			console.log(`✓ Viewport ${vp.name}: ${passed ? "PASS" : "FAIL (overflow detected)"}`);
		}

		// 3. Test Badges are OFF by default
		const verifiedIconExists = await page.evaluate(() => {
			return document.querySelector("header svg.text-violet-600") !== null;
		});
		const statusPulseExists = await page.evaluate(() => {
			return document.querySelector(".animate-pulse") !== null;
		});

		results.badgesOffByDefault = !verifiedIconExists && !statusPulseExists;
		console.log(`✓ Optional badges default OFF: ${results.badgesOffByDefault ? "PASS" : "FAIL"}`);

		// 4. Test Language Switcher
		const idHeadingText = await page.textContent("h2");
		console.log(`Initial heading (ID): "${idHeadingText}"`);

		// Click English toggle
		const enButton = page.locator('button[aria-label="English"]');
		await enButton.click();
		await page.waitForTimeout(200);

		const enHeadingText = await page.textContent("h2");
		console.log(`Switched heading (EN): "${enHeadingText}"`);

		// Switch back to Indonesian
		const idButton = page.locator('button[aria-label="Bahasa Indonesia"]');
		await idButton.click();
		await page.waitForTimeout(200);

		const revertedHeadingText = await page.textContent("h2");
		console.log(`Reverted heading (ID): "${revertedHeadingText}"`);

		results.languageSwitcher =
			idHeadingText?.toLowerCase().includes("tautan unggulan") &&
			enHeadingText?.toLowerCase().includes("featured links") &&
			revertedHeadingText?.toLowerCase().includes("tautan unggulan");

		// 5. Test Link Integrity
		const linksData = await page.evaluate(() => {
			const anchors = Array.from(document.querySelectorAll("a[href]"));
			return anchors.map((a) => ({
				href: a.getAttribute("href"),
				target: a.getAttribute("target"),
				rel: a.getAttribute("rel"),
			}));
		});

		console.log(`Found ${linksData.length} active links on the page.`);
		let allLinksValid = linksData.length > 0;

		for (const link of linksData) {
			if (!link.href || link.href === "#") {
				allLinksValid = false;
				console.error(`Invalid link found: ${JSON.stringify(link)}`);
			}
			if (link.href && !link.href.startsWith("mailto:")) {
				if (link.target !== "_blank" || !link.rel?.includes("noopener")) {
					allLinksValid = false;
					console.error(`External link missing safe target/rel: ${JSON.stringify(link)}`);
				}
			}
		}
		results.linkIntegrity = allLinksValid;
		console.log(`✓ External links integrity: ${allLinksValid ? "PASS" : "FAIL"}`);

		// 6. Console errors check
		results.noConsoleErrors = consoleErrors.length === 0;
		if (consoleErrors.length > 0) {
			console.error("Browser console errors detected:", consoleErrors);
		} else {
			console.log("✓ Browser console: 0 errors detected.");
		}
	} finally {
		if (browser) {
			await browser.close();
		}
	}

	console.log("\n================ TEST SUMMARY ================");
	console.log(JSON.stringify(results, null, 2));
	console.log("==============================================");
}

runBrowserTests().catch((err) => {
	console.error("Fatal test error:", err);
	process.exit(1);
});
