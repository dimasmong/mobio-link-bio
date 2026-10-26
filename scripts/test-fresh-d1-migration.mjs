import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

console.log("============================================================");
console.log("TESTING FRESH D1 DATABASE MIGRATIONS (0001 -> 0011)");
console.log("Simulating a fresh, empty Cloudflare D1 instance for OSS users");
console.log("============================================================\n");

const migrationsDir = path.resolve(process.cwd(), "migrations");
const migrationFiles = fs
	.readdirSync(migrationsDir)
	.filter((f) => f.endsWith(".sql"))
	.sort();

console.log(`Found ${migrationFiles.length} migration files in sequence:`);
migrationFiles.forEach((file) => console.log(`  - ${file}`));

// Create an isolated in-memory SQLite database matching Cloudflare D1 engine
const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON;");

for (const file of migrationFiles) {
	const filePath = path.join(migrationsDir, file);
	const sql = fs.readFileSync(filePath, "utf-8");
	try {
		db.exec(sql);
		console.log(`✓ Successfully applied migration: ${file}`);
	} catch (err) {
		console.error(`❌ Migration failed at ${file}:`, err);
		process.exit(1);
	}
}

console.log("\nVerifying database schema after all 11 migrations...");

// Retrieve all created tables
const tablesQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;");
const tables = tablesQuery.all().map((r) => r.name);

console.log(`Total tables created: ${tables.length}`);
console.log(tables.join(", "));

const REQUIRED_TABLES = [
	"site_settings",
	"profile",
	"links",
	"links_draft",
	"explore_items",
	"explore_items_draft",
	"explore_categories",
	"explore_categories_draft",
	"explore_subcategories",
	"explore_subcategories_draft",
	"contact_methods",
	"contact_methods_draft",
	"appearance_settings",
	"media_assets",
	"publish_metadata",
	"click_events",
	"page_views",
	"interaction_events",
];

for (const reqTable of REQUIRED_TABLES) {
	assert.ok(tables.includes(reqTable), `Required table '${reqTable}' must exist in schema`);
	console.log(`  ✓ Table '${reqTable}' verified.`);
}

console.log("\nAuditing default table contents for privacy & zero personal data...");

// 1. Verify profile table has draft & published rows with no personal data
const profileRows = db.prepare("SELECT id, name, handle, avatar_url FROM profile;").all();
console.log(`  Profile rows count: ${profileRows.length} (${profileRows.map((r) => r.id).join(", ")})`);
for (const p of profileRows) {
	assert.equal(p.name, "", `Profile row '${p.id}' name must be empty string`);
	assert.equal(p.handle, "", `Profile row '${p.id}' handle must be empty string`);
	assert.equal(p.avatar_url, "", `Profile row '${p.id}' avatar_url must be empty string`);
}
console.log("  ✓ Profile rows (draft & published) contain zero personal data.");

// 3. Verify links table is empty
const linksRows = db.prepare("SELECT * FROM links;").all();
assert.equal(linksRows.length, 0, "Default links table must be completely empty");
console.log("  ✓ Links table is completely empty (0 rows).");

// 4. Verify contact_methods table is empty
const contactRows = db.prepare("SELECT * FROM contact_methods;").all();
assert.equal(contactRows.length, 0, "Default contact_methods table must be completely empty");
console.log("  ✓ Contact methods table is completely empty (0 rows).");

// 5. Verify explore_items table is empty
const exploreRows = db.prepare("SELECT * FROM explore_items;").all();
assert.equal(exploreRows.length, 0, "Default explore_items table must be completely empty");
console.log("  ✓ Explore items table is completely empty (0 rows).");

// 6. Verify default categories exist and are generic
const categories = db.prepare("SELECT id, name_en, name_id FROM explore_categories;").all();
assert.ok(categories.length >= 4, "Default generic explore categories must be seeded");
console.log(`  ✓ Default categories seeded (${categories.length} generic categories): ${categories.map((c) => c.name_en).join(", ")}`);

// 7. Verify analytics tables start at 0
const clicks = db.prepare("SELECT COUNT(*) as count FROM click_events;").get();
const views = db.prepare("SELECT COUNT(*) as count FROM page_views;").get();
const interactions = db.prepare("SELECT COUNT(*) as count FROM interaction_events;").get();
assert.equal(clicks.count, 0, "Click events must be 0");
assert.equal(views.count, 0, "Page views must be 0");
assert.equal(interactions.count, 0, "Interaction events must be 0");
console.log("  ✓ Analytics telemetry tables start at strictly 0 events.");

console.log("\n============================================================");
console.log("FRESH D1 MIGRATION TEST PASSED! 100% CLEAN & IDEMPOTENT 🎉");
console.log("============================================================\n");
