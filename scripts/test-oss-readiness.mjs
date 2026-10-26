import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

console.log("============================================================");
console.log("MOBIO LINK BIO — OPEN SOURCE READINESS & INTEGRITY AUDIT");
console.log("Verifying Documentation, Secret Cleanliness, Config Separation & Links");
console.log("============================================================\n");

// 1. Verify Core Repository Files
console.log("TEST 1: Verifying Mandatory Open-Source Files...");
const REQUIRED_FILES = [
	"README.md",
	"LICENSE",
	"CONTRIBUTING.md",
	"SECURITY.md",
	"CODE_OF_CONDUCT.md",
	"wrangler.json",
	"wrangler.example.json",
	".env.example",
	".dev.vars.example",
	".github/ISSUE_TEMPLATE/bug_report.md",
	".github/ISSUE_TEMPLATE/feature_request.md",
	".github/pull_request_template.md",
	"docs/INSTALLATION.md",
	"docs/CONFIGURATION.md",
	"docs/DEPLOYMENT.md",
	"docs/DEVELOPMENT.md",
	"docs/TROUBLESHOOTING.md",
	"docs/ARCHITECTURE.md",
];

for (const file of REQUIRED_FILES) {
	const filePath = path.resolve(process.cwd(), file);
	assert.ok(fs.existsSync(filePath), `Required file '${file}' must exist`);
	console.log(`  ✓ File '${file}' exists.`);
}

// 2. Verify LICENSE File Content
console.log("\nTEST 2: Auditing LICENSE File...");
const licenseContent = fs.readFileSync(path.resolve(process.cwd(), "LICENSE"), "utf-8");
assert.ok(licenseContent.includes("MIT License"), "LICENSE must be MIT");
assert.ok(licenseContent.includes("2026 Dimas Mong"), "LICENSE must specify 2026 Dimas Mong");
console.log("  ✓ LICENSE is valid MIT license (2026 Dimas Mong).");

// 3. Verify wrangler.example.json Separation
console.log("\nTEST 3: Auditing wrangler.example.json Isolation...");
const exampleWrangler = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "wrangler.example.json"), "utf-8"));
assert.equal(exampleWrangler.d1_databases[0].database_id, "YOUR_D1_DATABASE_ID", "Example wrangler must use placeholder D1 ID");
assert.equal(exampleWrangler.r2_buckets[0].bucket_name, "YOUR_R2_BUCKET_NAME", "Example wrangler must use placeholder R2 name");
assert.ok(!exampleWrangler.routes, "Example wrangler must NOT include production custom domain routes");
console.log("  ✓ wrangler.example.json cleanly separated from production resources.");

// 4. Verify Production wrangler.json Preservation
console.log("\nTEST 4: Auditing Production wrangler.json Preservation...");
const prodWrangler = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "wrangler.json"), "utf-8"));
assert.equal(prodWrangler.routes[0].pattern, "me.dimasmong.web.id", "Production custom domain must remain intact");
assert.equal(prodWrangler.d1_databases[0].database_name, "mobio-studio-db", "Production database name must remain intact");
console.log("  ✓ Production wrangler.json intact and untouched.");

// 5. Verify Clean Defaults in app/data/profile.ts
console.log("\nTEST 5: Auditing Clean Neutral Defaults in profile.ts...");
const profileContent = fs.readFileSync(path.resolve(process.cwd(), "app/data/profile.ts"), "utf-8");
assert.ok(profileContent.includes('name: "Your Name"'), "Default profile name must be 'Your Name'");
assert.ok(profileContent.includes('handle: "@username"'), "Default handle must be '@username'");
assert.ok(!profileContent.includes("dimas@"), "profile.ts must not contain personal email");
console.log("  ✓ app/data/profile.ts contains strictly clean neutral defaults.");

// 6. Verify Screenshot Assets in docs/images
console.log("\nTEST 6: Auditing Documentation Screenshots...");
const SCREENSHOTS = [
	"docs/images/v4-2-public-en-default.png",
	"docs/images/v4-2-public-id-switched.png",
	"docs/images/v4-2-studio-en-default.png",
	"docs/images/v4-2-studio-id-switched.png",
	"docs/images/v4-2-studio-preview-page.png",
];
for (const s of SCREENSHOTS) {
	assert.ok(fs.existsSync(path.resolve(process.cwd(), s)), `Screenshot '${s}' must exist`);
	console.log(`  ✓ Screenshot '${s}' verified.`);
}

// 7. Verify Markdown Internal Cross-Links
console.log("\nTEST 7: Validating Markdown Cross-Links in README and docs...");
const mdFiles = [
	"README.md",
	"docs/INSTALLATION.md",
	"docs/CONFIGURATION.md",
	"docs/DEPLOYMENT.md",
	"docs/DEVELOPMENT.md",
	"docs/TROUBLESHOOTING.md",
	"docs/ARCHITECTURE.md",
];

for (const mdFile of mdFiles) {
	const content = fs.readFileSync(path.resolve(process.cwd(), mdFile), "utf-8");
	const baseDir = path.dirname(path.resolve(process.cwd(), mdFile));
	// Match relative markdown links [text](path) excluding external URLs, mailto, and anchors
	const linkRegex = /\[([^\]]+)\]\((?!http|mailto|#)([^)#]+)(?:#[^)]+)?\)/g;
	let match;
	while ((match = linkRegex.exec(content)) !== null) {
		const targetRelPath = match[2];
		const targetAbsPath = path.resolve(baseDir, targetRelPath);
		assert.ok(
			fs.existsSync(targetAbsPath),
			`Broken link in ${mdFile}: target '${targetRelPath}' does not resolve to an existing file (${targetAbsPath})`
		);
	}
	console.log(`  ✓ All internal cross-links in '${mdFile}' verified.`);
}

// 8. Verify Instance Isolation & Preflight Guard
console.log("\nTEST 8: Auditing Instance Isolation & Preflight Guard...");
const gitignoreContent = fs.readFileSync(path.resolve(process.cwd(), ".gitignore"), "utf-8");
assert.ok(gitignoreContent.includes("wrangler.instance.json"), ".gitignore must contain wrangler.instance.json");
console.log("  ✓ wrangler.instance.json is properly ignored in .gitignore.");

assert.ok(fs.existsSync(path.resolve(process.cwd(), "scripts/preflight-instance.mjs")), "scripts/preflight-instance.mjs must exist");
console.log("  ✓ scripts/preflight-instance.mjs guard exists.");

console.log("\n============================================================");
console.log("ALL OPEN SOURCE READINESS CHECKS PASSED SUCCESSFULLY! 🎉");
console.log("============================================================\n");
