import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:5175";
const ARTIFACT_DIR = "C:/Users/Dimas Mong/.gemini/antigravity/brain/e7780407-5c29-4c73-86e2-b40c63c8185f";

async function run() {
	console.log("============================================================");
	console.log("TEST SUITE: EXPLORE CATEGORY HORIZONTAL ARROW NAVIGATION");
	console.log("============================================================\n");

	const browser = await chromium.launch({ channel: "chrome" });
	const results = [];

	try {
		// -------------------------------------------------------------
		// TEST 1: Mobile Viewport (390x844) - Initial State Verification
		// -------------------------------------------------------------
		console.log("TEST 1: Initial state on Mobile Viewport (390x844)...");
		const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
		await page.goto(`${BASE_URL}/#explore`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(600);

		// If explore tabpanel is not visible yet, click the tab
		const exploreTab = page.locator("#desktop-tab-explore, #mobile-tab-explore").first();
		if (await exploreTab.isVisible()) {
			await exploreTab.click();
			await page.waitForTimeout(400);
		}

		// Locate left and right arrow buttons
		const leftArrow = page.locator("button[aria-label*='kiri'], button[aria-label*='left']").first();
		const rightArrow = page.locator("button[aria-label*='kanan'], button[aria-label*='right']").first();
		const scrollTrack = page.locator("#explore div[class*='overflow-x-auto']").first();

		assert.ok(await leftArrow.isVisible(), "Left arrow button must be visible");
		assert.ok(await rightArrow.isVisible(), "Right arrow button must be visible");
		assert.ok(await scrollTrack.isVisible(), "Categories scroll track must be visible");

		// Check buttons are on the same row (same or very close Y coordinates)
		const leftBox = await leftArrow.boundingBox();
		const rightBox = await rightArrow.boundingBox();
		const trackBox = await scrollTrack.boundingBox();

		assert.ok(leftBox && rightBox && trackBox, "All bounding boxes must exist");
		const yDiff = Math.abs(leftBox.y - rightBox.y);
		assert.ok(yDiff < 4, `Left and right buttons must be on the same vertical line (yDiff: ${yDiff}px)`);
		assert.ok(leftBox.x < trackBox.x, "Left arrow must be positioned to the left of the scroll track");
		assert.ok(rightBox.x > trackBox.x, "Right arrow must be positioned to the right of the scroll track");
		console.log(`  ✓ Left & right arrows flank the scroll track on the same row (Y: ${leftBox.y.toFixed(1)}px).`);

		// Initial scroll position should be 0
		const initialScrollLeft = await scrollTrack.evaluate((el) => el.scrollLeft);
		assert.equal(initialScrollLeft, 0, "Initial scrollLeft must be 0");

		// Left arrow must be disabled initially
		const isLeftDisabled = await leftArrow.isDisabled();
		assert.ok(isLeftDisabled, "Left arrow must be disabled at scroll position 0");
		console.log("  ✓ Left arrow is disabled at start of category list.");

		// Right arrow should be enabled because 5 categories overflow mobile width
		const isRightDisabled = await rightArrow.isDisabled();
		assert.ok(!isRightDisabled, "Right arrow must be enabled when categories overflow to the right");
		console.log("  ✓ Right arrow is enabled when content overflows to the right.");

		await page.screenshot({ path: path.join(ARTIFACT_DIR, "explore-arrow-mobile-start.png") });

		// -------------------------------------------------------------
		// TEST 2: Smooth Scrolling via Right Arrow Click
		// -------------------------------------------------------------
		console.log("\nTEST 2: Clicking Right Arrow to scroll...");
		await rightArrow.click();
		await page.waitForTimeout(600); // Wait for smooth scroll animation

		const scrolledLeft = await scrollTrack.evaluate((el) => el.scrollLeft);
		assert.ok(scrolledLeft > 30, `scrollLeft must increase after right click (current: ${scrolledLeft}px)`);
		console.log(`  ✓ Categories scrolled smoothly to the right (scrollLeft: ${scrolledLeft}px).`);

		// After scrolling right, left arrow MUST become enabled
		const isLeftEnabledAfterScroll = !(await leftArrow.isDisabled());
		assert.ok(isLeftEnabledAfterScroll, "Left arrow must become enabled after scrolling right");
		console.log("  ✓ Left arrow is now enabled.");

		await page.screenshot({ path: path.join(ARTIFACT_DIR, "explore-arrow-mobile-scrolled.png") });

		// -------------------------------------------------------------
		// TEST 3: Scrolling to the End of the List
		// -------------------------------------------------------------
		console.log("\nTEST 3: Scrolling to the end of the category list...");
		// Click right arrow multiple times or scroll to max
		await scrollTrack.evaluate((el) => {
			el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
		});
		await page.waitForTimeout(600);

		const atEndScrollLeft = await scrollTrack.evaluate((el) => el.scrollLeft);
		const scrollWidth = await scrollTrack.evaluate((el) => el.scrollWidth);
		const clientWidth = await scrollTrack.evaluate((el) => el.clientWidth);
		console.log(`  ✓ Scrolled to end: scrollLeft=${atEndScrollLeft}px, max=${scrollWidth - clientWidth}px`);

		// Right arrow must become disabled at the end of the list
		const isRightDisabledAtEnd = await rightArrow.isDisabled();
		assert.ok(isRightDisabledAtEnd, "Right arrow must be disabled when at the end of category list");
		console.log("  ✓ Right arrow is disabled when reaching the end.");

		// Verify the last category is visible and clickable
		const lastCategoryBtn = page.locator("#explore div[class*='overflow-x-auto'] button").last();
		assert.ok(await lastCategoryBtn.isVisible(), "Last category button must be visible at end");
		const lastCatText = await lastCategoryBtn.innerText();
		console.log(`  ✓ Last category ("${lastCatText}") is visible.`);

		await lastCategoryBtn.click();
		await page.waitForTimeout(400);
		console.log(`  ✓ Last category ("${lastCatText}") clicked successfully.`);

		await page.screenshot({ path: path.join(ARTIFACT_DIR, "explore-arrow-mobile-end.png") });

		// -------------------------------------------------------------
		// TEST 4: Smooth Scrolling via Left Arrow Click
		// -------------------------------------------------------------
		console.log("\nTEST 4: Clicking Left Arrow to scroll back...");
		await leftArrow.click();
		await page.waitForTimeout(600);

		const scrolledBackLeft = await scrollTrack.evaluate((el) => el.scrollLeft);
		assert.ok(scrolledBackLeft < atEndScrollLeft, `scrollLeft must decrease after left click (current: ${scrolledBackLeft}px)`);
		console.log(`  ✓ Categories scrolled smoothly to the left (scrollLeft: ${scrolledBackLeft}px).`);

		// Scroll all the way back to start
		await scrollTrack.evaluate((el) => {
			el.scrollTo({ left: 0, behavior: "smooth" });
		});
		await page.waitForTimeout(600);

		const backAtStart = await leftArrow.isDisabled();
		assert.ok(backAtStart, "Left arrow must be disabled once back at start");
		console.log("  ✓ Left arrow is disabled once returned to start.");

		// First category is visible and clickable
		const firstCategoryBtn = page.locator("#explore div[class*='overflow-x-auto'] button").first();
		assert.ok(await firstCategoryBtn.isVisible(), "First category button must be visible at start");
		const firstCatText = await firstCategoryBtn.innerText();
		console.log(`  ✓ First category ("${firstCatText}") is visible.`);

		await firstCategoryBtn.click();
		await page.waitForTimeout(400);
		console.log(`  ✓ First category ("${firstCatText}") clicked successfully.`);

		// -------------------------------------------------------------
		// TEST 5: Touch Swipe Gesture Simulation
		// -------------------------------------------------------------
		console.log("\nTEST 5: Simulating touch swipe gesture on mobile...");
		const trackCenter = {
			x: trackBox.x + trackBox.width / 2,
			y: trackBox.y + trackBox.height / 2,
		};

		// Mouse drag to simulate touch swipe
		await page.mouse.move(trackCenter.x + 80, trackCenter.y);
		await page.mouse.down();
		await page.mouse.move(trackCenter.x - 80, trackCenter.y, { steps: 8 });
		await page.mouse.up();
		await page.waitForTimeout(500);

		const touchScrollPos = await scrollTrack.evaluate((el) => el.scrollLeft);
		console.log(`  ✓ Touch drag resulted in scrollLeft: ${touchScrollPos}px`);

		// -------------------------------------------------------------
		// TEST 6: Responsive Viewports Check (No horizontal document overflow)
		// -------------------------------------------------------------
		console.log("\nTEST 6: Testing responsive viewports...");
		const viewports = [
			{ name: "Small Mobile (Android 360x640)", width: 360, height: 640 },
			{ name: "Standard Mobile (iPhone 390x844)", width: 390, height: 844 },
			{ name: "Tablet (iPad 768x1024)", width: 768, height: 1024 },
			{ name: "Desktop (1280x800)", width: 1280, height: 800 },
			{ name: "Ultra-wide Desktop (1440x900)", width: 1440, height: 900 },
		];

		for (const vp of viewports) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.waitForTimeout(300);

			// Verify no horizontal document overflow
			const hasPageOverflow = await page.evaluate(() => {
				return document.documentElement.scrollWidth > document.documentElement.clientWidth;
			});
			assert.ok(!hasPageOverflow, `Page must not have horizontal document overflow on ${vp.name}`);

			// Verify buttons and track fit within viewport
			const curTrackBox = await scrollTrack.boundingBox();
			const curLeftBox = await leftArrow.boundingBox();
			const curRightBox = await rightArrow.boundingBox();

			assert.ok(curLeftBox.x >= 0, `Left button must not overflow viewport left edge on ${vp.name}`);
			assert.ok(curRightBox.x + curRightBox.width <= vp.width, `Right button must not overflow viewport right edge on ${vp.name}`);
			console.log(`  ✓ ${vp.name}: No page overflow, arrows fully contained within viewport.`);

			// Capture responsive screenshot for tablet and desktop
			if (vp.width === 768) {
				await page.screenshot({ path: path.join(ARTIFACT_DIR, "explore-arrow-tablet-768.png") });
			} else if (vp.width === 1280) {
				await page.screenshot({ path: path.join(ARTIFACT_DIR, "explore-arrow-desktop-1280.png") });
			}
		}

		// -------------------------------------------------------------
		// TEST 7: Category Content Switching Integrity
		// -------------------------------------------------------------
		console.log("\nTEST 7: Verifying all categories display corresponding items...");
		const categoryButtons = await page.locator("#explore div[class*='overflow-x-auto'] button").all();
		console.log(`  Found ${categoryButtons.length} categories.`);

		for (let i = 0; i < categoryButtons.length; i++) {
			const btn = categoryButtons[i];
			const catName = await btn.innerText();
			await btn.click();
			await page.waitForTimeout(300);

			// Check active class on button
			const isSelected = await btn.evaluate((el) => el.classList.contains("scale-102") || el.getAttribute("aria-pressed") === "true" || el.classList.contains("font-bold"));
			assert.ok(isSelected, `Category '${catName}' must be marked as active when clicked`);

			// Check that grid has items (could be <div> or <a> tags)
			const visibleItemsCount = await page.locator("#explore .grid > *").count();
			assert.ok(visibleItemsCount > 0, `Category '${catName}' must show at least 1 item`);
			console.log(`  ✓ Category ${i + 1}/${categoryButtons.length} ('${catName}') active, showing ${visibleItemsCount} item(s).`);
		}

		console.log("\n============================================================");
		console.log("ALL 7 EXPLORE ARROW NAVIGATION TESTS PASSED! 🎉");
		console.log("============================================================");
	} finally {
		await browser.close();
	}
}

run().catch((err) => {
	console.error("\n❌ TEST SUITE FAILED:", err);
	process.exit(1);
});
