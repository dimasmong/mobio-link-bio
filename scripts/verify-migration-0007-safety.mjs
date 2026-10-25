import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");

function computeRowHash(row) {
	return crypto.createHash("sha256").update(JSON.stringify(row)).digest("hex");
}

async function runSafetyAudit() {
	console.log("============================================================");
	console.log("MOBIO — SAFETY AUDIT & VERIFICATION FOR MIGRATION 0007");
	console.log("Isolated Pre-0007 Schema, Data Parity & Integrity Verification");
	console.log("============================================================\n");

	// -------------------------------------------------------------------------
	// 1. ISOLATED DATABASE SETUP (Pre-0007 Baseline)
	// -------------------------------------------------------------------------
	console.log("STEP 1: Setting up isolated database with migrations 0001 - 0006...");
	const db = new DatabaseSync(":memory:");

	// Enable foreign keys
	db.exec("PRAGMA foreign_keys = ON;");

	// Apply migrations 0001 to 0006
	for (let i = 1; i <= 6; i++) {
		const filename = fs.readdirSync(MIGRATIONS_DIR).find((f) => f.startsWith(`000${i}_`));
		if (!filename) throw new Error(`Could not find migration file for 000${i}`);
		const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf-8");
		console.log(`  Applying ${filename}...`);
		db.exec(sql);
	}
	console.log("  ✓ Migrations 0001 - 0006 applied successfully.\n");

	// -------------------------------------------------------------------------
	// 2. POPULATE REALISTIC PRODUCTION PRE-0007 DATA
	// -------------------------------------------------------------------------
	console.log("STEP 2: Populating realistic pre-0007 production data...");

	// Update profile and appearance
	db.exec(`
		UPDATE profile 
		SET name = 'Production User', handle = '@produser', avatar_url = 'https://example.com/avatar.jpg'
		WHERE id = 'published';
		
		UPDATE appearance_settings 
		SET palette = 'frost-aurora', cover_enabled = 1, cover_url = 'https://example.com/cover.jpg'
		WHERE id = 'published';
	`);

	// Add links (pre-0007 schema: NO icon_type, icon_url, icon_media_id)
	db.exec(`
		INSERT INTO links (id, title_id, title_en, url, platform, icon, sort_order, is_enabled)
		VALUES 
			('link-1', 'GitHub Profil', 'GitHub Profile', 'https://github.com/produser', 'github', 'github', 0, 1),
			('link-2', 'LinkedIn', 'LinkedIn', 'https://linkedin.com/in/produser', 'linkedin', 'linkedin', 1, 1),
			('link-3', 'Portofolio', 'Portfolio', 'https://example.com', 'custom', 'globe', 2, 1);

		INSERT INTO links_draft (id, title_id, title_en, url, platform, icon, sort_order, is_enabled)
		VALUES 
			('link-1', 'GitHub Profil', 'GitHub Profile', 'https://github.com/produser', 'github', 'github', 0, 1),
			('link-2', 'LinkedIn', 'LinkedIn', 'https://linkedin.com/in/produser', 'linkedin', 'linkedin', 1, 1),
			('link-3', 'Portofolio', 'Portfolio', 'https://example.com', 'custom', 'globe', 2, 1);
	`);

	// Add click events referencing links (testing foreign keys)
	db.exec(`
		INSERT INTO click_events (id, link_id, clicked_at, referrer)
		VALUES 
			('click-1', 'link-1', '2026-10-25T12:00:00Z', 'https://google.com'),
			('click-2', 'link-2', '2026-10-25T12:05:00Z', 'https://twitter.com');
	`);

	// Add media assets spanning all 4 original categories and statuses
	const preMediaData = [
		{
			id: "media-avatar-1",
			object_key: "avatars/prod-avatar-1.webp",
			original_filename: "my-avatar.png",
			media_category: "avatar",
			media_type: "image",
			mime_type: "image/webp",
			size_bytes: 450123,
			width: 800,
			height: 800,
			duration_seconds: null,
			status: "published",
			created_at: "2026-10-20T10:00:00Z",
			updated_at: "2026-10-20T10:00:00Z",
		},
		{
			id: "media-cover-1",
			object_key: "covers/prod-cover-1.jpg",
			original_filename: "panoramic-banner.jpg",
			media_category: "cover",
			media_type: "image",
			mime_type: "image/jpeg",
			size_bytes: 1250400,
			width: 1920,
			height: 820,
			duration_seconds: null,
			status: "published",
			created_at: "2026-10-21T11:00:00Z",
			updated_at: "2026-10-21T11:00:00Z",
		},
		{
			id: "media-bg-video-1",
			object_key: "backgrounds/ambient-loop.mp4",
			original_filename: "ambient-loop.mp4",
			media_category: "background",
			media_type: "video",
			mime_type: "video/mp4",
			size_bytes: 8400120,
			width: 1920,
			height: 1080,
			duration_seconds: 14.5,
			status: "draft",
			created_at: "2026-10-22T14:30:00Z",
			updated_at: "2026-10-22T14:30:00Z",
		},
		{
			id: "media-general-1",
			object_key: "general/doc-attachment.webp",
			original_filename: "doc-attachment.png",
			media_category: "general",
			media_type: "image",
			mime_type: "image/webp",
			size_bytes: 210450,
			width: 1200,
			height: 630,
			duration_seconds: null,
			status: "archived",
			created_at: "2026-10-23T09:15:00Z",
			updated_at: "2026-10-23T09:15:00Z",
		},
		{
			id: "media-upload-pending",
			object_key: "uploads/temp-upload.jpg",
			original_filename: "photo.jpg",
			media_category: "background",
			media_type: "image",
			mime_type: "image/jpeg",
			size_bytes: 980000,
			width: null,
			height: null,
			duration_seconds: null,
			status: "uploaded",
			created_at: "2026-10-24T16:00:00Z",
			updated_at: "2026-10-24T16:00:00Z",
		},
	];

	const insertMediaStmt = db.prepare(`
		INSERT INTO media_assets (
			id, object_key, original_filename, media_category, media_type,
			mime_type, size_bytes, width, height, duration_seconds, status,
			created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	for (const m of preMediaData) {
		insertMediaStmt.run(
			m.id,
			m.object_key,
			m.original_filename,
			m.media_category,
			m.media_type,
			m.mime_type,
			m.size_bytes,
			m.width,
			m.height,
			m.duration_seconds,
			m.status,
			m.created_at,
			m.updated_at
		);
	}
	console.log(`  ✓ Inserted ${preMediaData.length} media asset records across all categories.`);

	// -------------------------------------------------------------------------
	// 3. PRE-MIGRATION INTEGRITY SNAPSHOT & PRAGMA CHECKS
	// -------------------------------------------------------------------------
	console.log("\nSTEP 3: Taking pre-migration snapshot & running baseline PRAGMA checks...");
	const initialMediaRows = db.prepare("SELECT * FROM media_assets ORDER BY id ASC").all();
	const initialCount = initialMediaRows.length;
	const initialHashes = new Map(initialMediaRows.map((r) => [r.id, computeRowHash(r)]));

	const preFkCheck = db.prepare("PRAGMA foreign_key_check;").all();
	if (preFkCheck.length > 0) {
		throw new Error(`Pre-migration foreign key violations: ${JSON.stringify(preFkCheck)}`);
	}
	console.log("  ✓ Pre-migration PRAGMA foreign_key_check: 0 violations.");

	const preIntegrityCheck = db.prepare("PRAGMA integrity_check;").all();
	if (preIntegrityCheck[0]?.integrity_check !== "ok") {
		throw new Error(`Pre-migration integrity check failed: ${JSON.stringify(preIntegrityCheck)}`);
	}
	console.log("  ✓ Pre-migration PRAGMA integrity_check: ok.");

	// -------------------------------------------------------------------------
	// 4. EXECUTE MIGRATION 0007_custom_icons.sql
	// -------------------------------------------------------------------------
	console.log("\nSTEP 4: Applying 0007_custom_icons.sql in transaction...");
	const migration0007Sql = fs.readFileSync(path.join(MIGRATIONS_DIR, "0007_custom_icons.sql"), "utf-8");

	db.exec("BEGIN TRANSACTION;");
	try {
		db.exec(migration0007Sql);
		db.exec("COMMIT;");
		console.log("  ✓ 0007_custom_icons.sql executed and committed successfully.");
	} catch (err) {
		db.exec("ROLLBACK;");
		throw new Error(`Migration 0007 failed: ${err.message}`);
	}

	// -------------------------------------------------------------------------
	// 5. POST-MIGRATION DATA INTEGRITY VERIFICATION
	// -------------------------------------------------------------------------
	console.log("\nSTEP 5: Verifying post-migration data integrity...");
	const postMediaRows = db.prepare("SELECT * FROM media_assets ORDER BY id ASC").all();
	const postCount = postMediaRows.length;

	if (postCount !== initialCount) {
		throw new Error(`Row count mismatch: pre=${initialCount}, post=${postCount}`);
	}
	console.log(`  ✓ Row count verified: exactly ${postCount} rows preserved.`);

	for (const row of postMediaRows) {
		const preHash = initialHashes.get(row.id);
		if (!preHash) {
			throw new Error(`Unexpected new or modified row ID: ${row.id}`);
		}
		const postHash = computeRowHash(row);
		if (postHash !== preHash) {
			throw new Error(`Data corruption detected in media row ${row.id}!`);
		}
	}
	console.log("  ✓ 100% byte-for-byte data fidelity verified across all original media records.");

	// Verify indexes recreated
	const indexList = db.prepare("PRAGMA index_list(media_assets);").all();
	const indexNames = indexList.map((idx) => idx.name);
	if (!indexNames.includes("idx_media_assets_category") || !indexNames.includes("idx_media_assets_status")) {
		throw new Error(`Missing expected indexes on media_assets. Found: ${indexNames.join(", ")}`);
	}
	console.log("  ✓ Indexes verified: idx_media_assets_category, idx_media_assets_status exist.");

	// Verify links and links_draft new columns
	const linksRows = db.prepare("SELECT id, icon_type, icon_url, icon_media_id FROM links;").all();
	if (linksRows.length !== 3) throw new Error("Links table rows corrupted!");
	for (const l of linksRows) {
		if (l.icon_type !== "preset" || l.icon_url !== "" || l.icon_media_id !== "") {
			throw new Error(`Default column value mismatch in links: ${JSON.stringify(l)}`);
		}
	}
	console.log("  ✓ Links table extended with defaults: icon_type='preset', icon_url='', icon_media_id=''.");

	const linksDraftRows = db.prepare("SELECT id, icon_type, icon_url, icon_media_id FROM links_draft;").all();
	if (linksDraftRows.length !== 3) throw new Error("Links_draft table rows corrupted!");
	for (const l of linksDraftRows) {
		if (l.icon_type !== "preset" || l.icon_url !== "" || l.icon_media_id !== "") {
			throw new Error(`Default column value mismatch in links_draft: ${JSON.stringify(l)}`);
		}
	}
	console.log("  ✓ Links_draft table extended with defaults: icon_type='preset', icon_url='', icon_media_id=''.");

	// Verify foreign keys and integrity
	const postFkCheck = db.prepare("PRAGMA foreign_key_check;").all();
	if (postFkCheck.length > 0) {
		throw new Error(`Post-migration foreign key violations: ${JSON.stringify(postFkCheck)}`);
	}
	console.log("  ✓ Post-migration PRAGMA foreign_key_check: 0 violations.");

	const postIntegrityCheck = db.prepare("PRAGMA integrity_check;").all();
	if (postIntegrityCheck[0]?.integrity_check !== "ok") {
		throw new Error(`Post-migration integrity check failed: ${JSON.stringify(postIntegrityCheck)}`);
	}
	console.log("  ✓ Post-migration PRAGMA integrity_check: ok.");

	// -------------------------------------------------------------------------
	// 6. VERIFY NEW 'icon' CATEGORY FUNCTIONALITY & CHECK CONSTRAINTS
	// -------------------------------------------------------------------------
	console.log("\nSTEP 6: Testing new 'icon' category & CHECK constraint boundaries...");

	// Inserting 'icon' category MUST succeed
	db.prepare(`
		INSERT INTO media_assets (
			id, object_key, original_filename, media_category, media_type,
			mime_type, size_bytes, width, height, duration_seconds, status,
			created_at, updated_at
		) VALUES (
			'media-icon-new', 'icons/custom-brand.png', 'custom-brand.png',
			'icon', 'image', 'image/png', 12345, 64, 64, null, 'uploaded',
			'2026-10-26T00:00:00Z', '2026-10-26T00:00:00Z'
		)
	`).run();
	console.log("  ✓ Inserting media_assets with category='icon' SUCCEEDED.");

	// Inserting invalid category MUST fail
	let checkFailed = false;
	try {
		db.prepare(`
			INSERT INTO media_assets (
				id, object_key, original_filename, media_category, media_type,
				mime_type, size_bytes, width, height, duration_seconds, status,
				created_at, updated_at
			) VALUES (
				'media-invalid', 'icons/invalid.png', 'invalid.png',
				'malicious_category', 'image', 'image/png', 100, 64, 64, null, 'uploaded',
				'2026-10-26T00:00:00Z', '2026-10-26T00:00:00Z'
			)
		`).run();
	} catch (e) {
		checkFailed = true;
		console.log(`  ✓ Inserting invalid category correctly blocked by CHECK constraint: ${e.message}`);
	}
	if (!checkFailed) {
		throw new Error("CHECK constraint failed to block invalid media category!");
	}

	// -------------------------------------------------------------------------
	// 7. NEGATIVE TEST: VERIFY FAIL-CLOSED ROLLBACK ON CORRUPTED INPUT
	// -------------------------------------------------------------------------
	console.log("\nSTEP 7: Negative Test: Verifying atomic rollback on failed transfer...");
	const failDb = new DatabaseSync(":memory:");
	failDb.exec("PRAGMA foreign_keys = ON;");
	for (let i = 1; i <= 6; i++) {
		const filename = fs.readdirSync(MIGRATIONS_DIR).find((f) => f.startsWith(`000${i}_`));
		const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf-8");
		failDb.exec(sql);
	}

	// Insert standard media
	failDb.prepare(`
		INSERT INTO media_assets (
			id, object_key, original_filename, media_category, media_type,
			mime_type, size_bytes, width, height, duration_seconds, status,
			created_at, updated_at
		) VALUES (
			'pre-existing-media', 'avatars/pre.jpg', 'pre.jpg',
			'avatar', 'image', 'image/jpeg', 5000, 100, 100, null, 'published',
			'2026-10-25T00:00:00Z', '2026-10-25T00:00:00Z'
		)
	`).run();

	// Test assertion failure scenario:
	// If row counts don't match, _verify_media_assets_migration must fail and transaction must roll back
	let rollbackVerified = false;
	failDb.exec("BEGIN TRANSACTION;");
	try {
		// Create new table
		failDb.exec(`
			CREATE TABLE media_assets_new (
				id TEXT PRIMARY KEY,
				object_key TEXT NOT NULL UNIQUE,
				original_filename TEXT NOT NULL,
				media_category TEXT NOT NULL CHECK (media_category IN ('avatar', 'cover', 'background', 'general', 'icon')),
				media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
				mime_type TEXT NOT NULL,
				size_bytes INTEGER NOT NULL,
				width INTEGER,
				height INTEGER,
				duration_seconds REAL,
				status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'draft', 'published', 'archived')),
				created_at TEXT NOT NULL DEFAULT '',
				updated_at TEXT NOT NULL DEFAULT ''
			);
		`);

		// Deliberately simulate an incomplete insert (e.g. 0 rows copied while original had 1)
		// and run the assertion check:
		failDb.exec(`
			CREATE TABLE _verify_media_assets_migration (
				row_count_diff INTEGER NOT NULL CHECK (row_count_diff = 0)
			);
			INSERT INTO _verify_media_assets_migration (row_count_diff)
			SELECT (SELECT COUNT(*) FROM media_assets) - (SELECT COUNT(*) FROM media_assets_new);
			DROP TABLE _verify_media_assets_migration;
		`);
		failDb.exec("COMMIT;");
	} catch (e) {
		failDb.exec("ROLLBACK;");
		rollbackVerified = true;
		console.log(`  ✓ Data count mismatch successfully triggered failure and rollback: ${e.message}`);
	}

	if (!rollbackVerified) {
		throw new Error("Assertion check failed to trigger rollback!");
	}

	// Verify original table still exists and data is untouched
	const preservedMedia = failDb.prepare("SELECT * FROM media_assets").all();
	if (preservedMedia.length !== 1 || preservedMedia[0].id !== "pre-existing-media") {
		throw new Error("Original media_assets was corrupted or dropped during failed migration!");
	}
	console.log("  ✓ Original media_assets table completely intact with 0 data loss after rollback.");

	console.log("\n============================================================");
	console.log("ALL SAFETY & DATA PARITY AUDITS PASSED WITH ZERO LOSS! (7/7)");
	console.log("============================================================\n");
}

runSafetyAudit().catch((err) => {
	console.error("\n❌ AUDIT FAILED:", err);
	process.exit(1);
});
