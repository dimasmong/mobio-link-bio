import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { validateConfiguration } from "./preflight-instance.mjs";

console.log("============================================================");
console.log("MOBIO LINK BIO — OPEN SOURCE READINESS & INTEGRITY AUDIT");
console.log("Verifying Documentation, Secret Cleanliness, Config Separation & Safety");
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
	"scripts/preflight-instance.mjs",
	"scripts/build-instance.mjs",
	"scripts/deploy-instance.mjs",
	"scripts/migrate-instance.mjs",
	"scripts/build-prod.mjs",
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
assert.equal(prodWrangler.d1_databases[0].database_id, "00e8060a-0372-4b1a-8de3-84f9905edf51", "Production D1 UUID must remain intact");
assert.equal(prodWrangler.r2_buckets[0].bucket_name, "mobio-media-bucket", "Production R2 bucket must remain intact");
console.log("  ✓ Production wrangler.json intact, preserved, and untouched.");

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
	"docs/STUDIO-SETUP.md",
];

for (const mdFile of mdFiles) {
	const content = fs.readFileSync(path.resolve(process.cwd(), mdFile), "utf-8");
	const baseDir = path.dirname(path.resolve(process.cwd(), mdFile));
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

// 8. Verify Instance Isolation in .gitignore and package.json
console.log("\nTEST 8: Auditing Instance Isolation & Script Safety in package.json...");
const gitignoreContent = fs.readFileSync(path.resolve(process.cwd(), ".gitignore"), "utf-8");
assert.ok(gitignoreContent.includes("wrangler.instance.json"), ".gitignore must contain wrangler.instance.json");
console.log("  ✓ wrangler.instance.json is properly ignored in .gitignore.");

const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
assert.ok(pkg.scripts["preflight:instance"], "package.json must contain preflight:instance script");
assert.ok(pkg.scripts["build:instance"], "package.json must contain build:instance script");
assert.ok(pkg.scripts["deploy:instance"], "package.json must contain deploy:instance script");
assert.ok(pkg.scripts["migrate:instance"], "package.json must contain migrate:instance script");
assert.ok(pkg.scripts["migrate:instance:local"], "package.json must contain migrate:instance:local script");
assert.ok(pkg.scripts["build:prod"], "package.json must contain build:prod script");
assert.ok(pkg.scripts["deploy"], "package.json must preserve original deploy script for maintainer");
console.log("  ✓ package.json contains all required independent instance and maintainer scripts.");

// 9. Comprehensive Preflight Guard Validation Suite
console.log("\nTEST 9: Auditing Preflight Guard Validation Edge Cases...");
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mobio-preflight-test-"));

try {
	// 9.1 Missing instance configuration file
	const missingResult = validateConfiguration(path.join(tmpDir, "wrangler.instance.json"), false);
	assert.equal(missingResult.success, false, "Missing instance file must fail");
	assert.ok(missingResult.errors[0].includes("Instance configuration file not found"), "Error must clearly cite missing file");
	console.log("  ✓ Missing instance configuration correctly rejected with setup instructions.");

	// Helper to write temporary test configuration
	function writeTestConfig(name, obj) {
		const filePath = path.join(tmpDir, name);
		if (typeof obj === "string") {
			fs.writeFileSync(filePath, obj, "utf-8");
		} else {
			fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf-8");
		}
		return filePath;
	}

	// 9.2 Malformed JSON
	const malformedPath = writeTestConfig("malformed.json", "{ name: invalid json without quotes ");
	const malformedResult = validateConfiguration(malformedPath, false);
	assert.equal(malformedResult.success, false, "Malformed JSON must fail");
	assert.ok(malformedResult.errors[0].includes("Failed to parse"), "Malformed JSON must give clear parsing error");
	console.log("  ✓ Malformed JSON handled gracefully without crashing.");

	// 9.3 Root not an object
	const arrayRootPath = writeTestConfig("array.json", "[]");
	const arrayResult = validateConfiguration(arrayRootPath, false);
	assert.equal(arrayResult.success, false, "Array root must fail");
	console.log("  ✓ Non-object root configuration rejected.");

	// Base valid config template
	const baseValid = {
		name: "my-valid-bio",
		compatibility_date: "2025-10-08",
		workers_dev: true,
		d1_databases: [
			{
				binding: "DB",
				database_name: "my-bio-db",
				database_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
			},
		],
		r2_buckets: [
			{
				binding: "MEDIA_BUCKET",
				bucket_name: "my-bio-media",
			},
		],
	};

	// 9.4 Missing or empty Worker name
	const noNamePath = writeTestConfig("no-name.json", { ...baseValid, name: "" });
	const noNameResult = validateConfiguration(noNamePath, false);
	assert.equal(noNameResult.success, false, "Empty Worker name must fail");
	assert.ok(noNameResult.errors.some((e) => e.includes("Missing or empty 'name' field")), "Should identify 'name' field");
	console.log("  ✓ Empty Worker name rejected.");

	// 9.5 Invalid Worker name (contains spaces/special symbols)
	const badNamePath = writeTestConfig("bad-name.json", { ...baseValid, name: "my invalid bio!" });
	const badNameResult = validateConfiguration(badNamePath, false);
	assert.equal(badNameResult.success, false, "Invalid Worker name must fail");
	console.log("  ✓ Invalid Worker name characters rejected.");

	// 9.6 Production Worker name in instance config
	const prodNamePath = writeTestConfig("prod-name.json", { ...baseValid, name: "mobio-link-bio" });
	const prodNameResult = validateConfiguration(prodNamePath, false);
	assert.equal(prodNameResult.success, false, "Production Worker name must fail in instance mode");
	assert.ok(prodNameResult.errors.some((e) => e.includes("cannot be the original production Worker name")), "Should reject production Worker name");
	console.log("  ✓ Production Worker name ('mobio-link-bio') rejected in instance configuration.");

	// 9.7 Missing D1 binding DB
	const noDbPath = writeTestConfig("no-db.json", { ...baseValid, d1_databases: [] });
	const noDbResult = validateConfiguration(noDbPath, false);
	assert.equal(noDbResult.success, false, "Missing D1 DB binding must fail");
	console.log("  ✓ Missing D1 database binding 'DB' rejected.");

	// 9.8 Duplicate D1 binding DB
	const dupDbPath = writeTestConfig("dup-db.json", {
		...baseValid,
		d1_databases: [
			baseValid.d1_databases[0],
			{ binding: "DB", database_name: "extra-db", database_id: "12345678-1234-1234-1234-123456789abc" },
		],
	});
	const dupDbResult = validateConfiguration(dupDbPath, false);
	assert.equal(dupDbResult.success, false, "Duplicate D1 DB binding must fail");
	assert.ok(dupDbResult.errors.some((e) => e.includes("Duplicate D1 binding 'DB'")), "Should report duplicate D1 DB");
	console.log("  ✓ Duplicate D1 DB bindings rejected.");

	// 9.9 Placeholder D1 database UUID
	const placeholderDbPath = writeTestConfig("ph-db.json", {
		...baseValid,
		d1_databases: [{ binding: "DB", database_name: "my-db", database_id: "YOUR_D1_DATABASE_ID" }],
	});
	const placeholderDbResult = validateConfiguration(placeholderDbPath, false);
	assert.equal(placeholderDbResult.success, false, "Placeholder D1 ID must fail");
	assert.ok(placeholderDbResult.errors.some((e) => e.includes("Placeholder database_id detected")), "Should identify placeholder D1 ID");
	console.log("  ✓ Placeholder D1 database ID ('YOUR_D1_DATABASE_ID') rejected.");

	// 9.10 Malformed D1 database UUID
	const malformedDbPath = writeTestConfig("malformed-db.json", {
		...baseValid,
		d1_databases: [{ binding: "DB", database_name: "my-db", database_id: "not-a-valid-uuid-123" }],
	});
	const malformedDbResult = validateConfiguration(malformedDbPath, false);
	assert.equal(malformedDbResult.success, false, "Malformed UUID must fail");
	assert.ok(malformedDbResult.errors.some((e) => e.includes("Malformed D1 database_id")), "Should identify malformed UUID format");
	console.log("  ✓ Malformed D1 UUID rejected.");

	// 9.11 Production D1 database UUID in instance config
	const prodDbPath = writeTestConfig("prod-db.json", {
		...baseValid,
		d1_databases: [{ binding: "DB", database_name: "my-db", database_id: "00e8060a-0372-4b1a-8de3-84f9905edf51" }],
	});
	const prodDbResult = validateConfiguration(prodDbPath, false);
	assert.equal(prodDbResult.success, false, "Production D1 UUID must fail in instance mode");
	assert.ok(prodDbResult.errors.some((e) => e.includes("Original production D1 database UUID")), "Should reject production D1 UUID");
	console.log("  ✓ Production D1 database ID ('00e8060a-0372-4b1a-8de3-84f9905edf51') rejected in instance configuration.");

	// 9.12 Missing MEDIA_BUCKET binding
	const noR2Path = writeTestConfig("no-r2.json", { ...baseValid, r2_buckets: [] });
	const noR2Result = validateConfiguration(noR2Path, false);
	assert.equal(noR2Result.success, false, "Missing MEDIA_BUCKET must fail");
	console.log("  ✓ Missing R2 MEDIA_BUCKET binding rejected.");

	// 9.13 Duplicate MEDIA_BUCKET binding
	const dupR2Path = writeTestConfig("dup-r2.json", {
		...baseValid,
		r2_buckets: [
			baseValid.r2_buckets[0],
			{ binding: "MEDIA_BUCKET", bucket_name: "extra-media" },
		],
	});
	const dupR2Result = validateConfiguration(dupR2Path, false);
	assert.equal(dupR2Result.success, false, "Duplicate MEDIA_BUCKET must fail");
	console.log("  ✓ Duplicate MEDIA_BUCKET bindings rejected.");

	// 9.14 Placeholder R2 bucket name
	const placeholderR2Path = writeTestConfig("ph-r2.json", {
		...baseValid,
		r2_buckets: [{ binding: "MEDIA_BUCKET", bucket_name: "YOUR_R2_BUCKET_NAME" }],
	});
	const placeholderR2Result = validateConfiguration(placeholderR2Path, false);
	assert.equal(placeholderR2Result.success, false, "Placeholder R2 name must fail");
	assert.ok(placeholderR2Result.errors.some((e) => e.includes("Placeholder bucket_name detected")), "Should identify placeholder bucket name");
	console.log("  ✓ Placeholder R2 bucket name ('YOUR_R2_BUCKET_NAME') rejected.");

	// 9.15 Production R2 bucket name in instance config
	const prodR2Path = writeTestConfig("prod-r2.json", {
		...baseValid,
		r2_buckets: [{ binding: "MEDIA_BUCKET", bucket_name: "mobio-media-bucket" }],
	});
	const prodR2Result = validateConfiguration(prodR2Path, false);
	assert.equal(prodR2Result.success, false, "Production R2 name must fail in instance mode");
	assert.ok(prodR2Result.errors.some((e) => e.includes("Original production R2 bucket name")), "Should reject production R2 bucket");
	console.log("  ✓ Production R2 bucket name ('mobio-media-bucket') rejected in instance configuration.");

	// 9.16 Production custom domain in instance config routes
	const prodDomainPath = writeTestConfig("prod-domain.json", {
		...baseValid,
		routes: [{ pattern: "me.dimasmong.web.id", custom_domain: true }],
	});
	const prodDomainResult = validateConfiguration(prodDomainPath, false);
	assert.equal(prodDomainResult.success, false, "Production custom domain in routes must fail");
	assert.ok(prodDomainResult.errors.some((e) => e.includes("Original production domain")), "Should reject production custom domain");
	console.log("  ✓ Production custom domain ('me.dimasmong.web.id') rejected in instance routes.");

	// 9.17 Malformed routes
	const badRoutesPath = writeTestConfig("bad-routes.json", { ...baseValid, routes: "not an array" });
	const badRoutesResult = validateConfiguration(badRoutesPath, false);
	assert.equal(badRoutesResult.success, false, "Non-array routes must fail");
	console.log("  ✓ Malformed routes array rejected.");

	// 9.18 Valid independent instance config passes
	const validInstancePath = writeTestConfig("valid-instance.json", baseValid);
	const validResult = validateConfiguration(validInstancePath, false);
	assert.equal(validResult.success, true, "Valid instance configuration must pass");
	assert.equal(validResult.errors.length, 0, "No errors expected for valid configuration");
	console.log("  ✓ Valid independent instance configuration successfully passes preflight.");

	// 9.19 Production configuration in --prod mode passes
	const prodCheck = validateConfiguration(path.resolve(process.cwd(), "wrangler.json"), true);
	assert.equal(prodCheck.success, true, "Production configuration must pass in --prod mode");
	assert.equal(prodCheck.errors.length, 0, "No errors expected for production configuration in --prod mode");
	console.log("  ✓ Upstream production configuration successfully passes in --prod mode.");

	// 9.20 Instance deployment halted when preflight fails
	console.log("\nTEST 10: Auditing Deployment & Migration Halting Guard...");
	const deployScript = path.resolve(process.cwd(), "scripts/deploy-instance.mjs");
	// When wrangler.instance.json does not exist, running deploy-instance.mjs must halt immediately
	const deployRes = spawnSync(process.execPath, [deployScript], { encoding: "utf-8" });
	assert.notEqual(deployRes.status, 0, "deploy:instance must exit non-zero when preflight fails");
	assert.ok(deployRes.stderr.includes("Deployment halted") || deployRes.stdout.includes("Deployment halted"), "deploy:instance must halt before executing wrangler");
	console.log("  ✓ deploy:instance script safely halts deployment execution on preflight failure.");

	const migrateScript = path.resolve(process.cwd(), "scripts/migrate-instance.mjs");
	const migrateRes = spawnSync(process.execPath, [migrateScript], { encoding: "utf-8" });
	assert.notEqual(migrateRes.status, 0, "migrate:instance must exit non-zero when preflight fails");
	assert.ok(migrateRes.stderr.includes("Instance migration halted") || migrateRes.stdout.includes("Instance migration halted"), "migrate:instance must halt before executing wrangler");
	console.log("  ✓ migrate:instance script safely halts migration execution on preflight failure.");
} finally {
	fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("\n============================================================");
console.log("ALL OPEN SOURCE READINESS CHECKS PASSED SUCCESSFULLY! 🎉");
console.log("============================================================\n");
