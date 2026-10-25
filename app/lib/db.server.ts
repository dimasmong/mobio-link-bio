/**
 * MOBIO STUDIO — CLOUDFLARE D1 DATABASE ACCESS LAYER
 *
 * Provides safe, typed query helpers for Cloudflare D1 (SQLite).
 * Supports isolated Draft and Published states, atomic publishing,
 * and input validation with URL protocol allowlists.
 */

export interface SiteSettings {
	id: string;
	site_title: string;
	default_language: "id" | "en";
	created_at: string;
	updated_at: string;
}

export interface ProfileRecord {
	id: string;
	name: string;
	handle: string;
	avatar_url?: string;
	location_id?: string;
	location_en?: string;
	bio_id?: string;
	bio_en?: string;
	created_at: string;
	updated_at: string;
}

export interface LinkRecord {
	id: string;
	title_id: string;
	title_en: string;
	description_id?: string;
	description_en?: string;
	url: string;
	platform: string;
	icon: string;
	sort_order: number;
	is_enabled: number;
	created_at: string;
	updated_at: string;
}

export interface ExploreItemRecord {
	id: string;
	type: "project" | "gallery" | "music" | "note";
	title_id: string;
	title_en: string;
	subtitle_id?: string;
	subtitle_en?: string;
	description_id?: string;
	description_en?: string;
	url?: string;
	cover_image?: string;
	badge_id?: string;
	badge_en?: string;
	metadata_json?: string;
	sort_order: number;
	is_enabled: number;
	created_at: string;
	updated_at: string;
}

export interface ContactMethodRecord {
	id: string;
	platform: "whatsapp" | "telegram" | "email" | "instagram" | "custom";
	label_id: string;
	label_en: string;
	value: string;
	url: string;
	sort_order: number;
	is_enabled: number;
	created_at: string;
	updated_at: string;
}

export interface AppearanceRecord {
	id: string;
	palette: string;
	glass_intensity: string;
	background_type: "gradient" | "image" | "video";
	background_src?: string;
	background_poster?: string;
	background_animation: number;
	background_overlay_opacity: number;
	cover_enabled: number;
	cover_url?: string;
	cover_aspect_ratio: string;
	created_at: string;
	updated_at: string;
}

export interface PublishMetadataRecord {
	id: string;
	version: number;
	published_at: string;
	published_by: string;
	notes?: string;
	has_unpublished_changes?: number;
	draft_updated_at?: string;
}

export interface DatabaseStatus {
	isConfigured: boolean;
	isReady: boolean;
	tablesCount: number;
	tables: {
		name: string;
		rows: number;
	}[];
	systemCounts: {
		links: number;
		explore: number;
		contact: number;
		clicks: number;
	};
	publishStatus: {
		hasUnpublishedChanges: boolean;
		version: number;
		lastPublishedAt: string;
		draftUpdatedAt: string;
	};
	error?: string;
}

/**
 * Validates a destination URL against an allowlist of safe protocols.
 * Explicitly rejects dangerous schemes such as javascript:, data:, vbscript:.
 */
export function validateUrl(rawUrl: string): { isValid: boolean; normalizedUrl: string; error?: string } {
	if (!rawUrl || typeof rawUrl !== "string") {
		return { isValid: false, normalizedUrl: "", error: "URL tidak boleh kosong." };
	}

	const trimmed = rawUrl.trim();
	if (trimmed.length === 0) {
		return { isValid: false, normalizedUrl: "", error: "URL tidak boleh kosong." };
	}

	// Reject forbidden schemes explicitly
	const lower = trimmed.toLowerCase();
	if (
		lower.startsWith("javascript:") ||
		lower.startsWith("data:") ||
		lower.startsWith("vbscript:") ||
		lower.startsWith("file:")
	) {
		return {
			isValid: false,
			normalizedUrl: "",
			error: "Protokol URL tidak aman (hanya http, https, mailto, tel yang diizinkan).",
		};
	}

	// Allow relative paths for internal routing if starting with /
	if (trimmed.startsWith("/")) {
		return { isValid: true, normalizedUrl: trimmed };
	}

	// Parse with standard URL constructor
	try {
		const parsed = new URL(trimmed);
		const allowedProtocols = ["https:", "http:", "mailto:", "tel:"];
		if (!allowedProtocols.includes(parsed.protocol)) {
			return {
				isValid: false,
				normalizedUrl: "",
				error: `Protokol '${parsed.protocol}' tidak diizinkan. Gunakan https://, http://, mailto:, atau tel:.`,
			};
		}

		return { isValid: true, normalizedUrl: parsed.toString() };
	} catch {
		// If user typed 'example.com' without protocol, auto-prepend https://
		if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
			return { isValid: true, normalizedUrl: `https://${trimmed}` };
		}

		return {
			isValid: false,
			normalizedUrl: "",
			error: "Format URL tidak valid. Sertakan https:// atau http://.",
		};
	}
}

/**
 * Validates and normalizes contact platform URLs.
 */
export function validateContactDestination(
	platform: string,
	rawInput: string
): { isValid: boolean; normalizedUrl: string; displayValue: string; error?: string } {
	if (!rawInput || typeof rawInput !== "string" || rawInput.trim().length === 0) {
		return { isValid: false, normalizedUrl: "", displayValue: "", error: "Tujuan kontak tidak boleh kosong." };
	}

	const trimmed = rawInput.trim();

	switch (platform.toLowerCase()) {
		case "email": {
			const cleanEmail = trimmed.replace(/^mailto:/i, "").trim();
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(cleanEmail)) {
				return { isValid: false, normalizedUrl: "", displayValue: "", error: "Format alamat email tidak valid." };
			}
			return { isValid: true, normalizedUrl: `mailto:${cleanEmail}`, displayValue: cleanEmail };
		}
		case "whatsapp": {
			// Handle phone numbers or full wa.me links
			if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
				return { isValid: true, normalizedUrl: trimmed, displayValue: trimmed };
			}
			const cleanedNumber = trimmed.replace(/[^0-9]/g, "");
			if (cleanedNumber.length < 8) {
				return { isValid: false, normalizedUrl: "", displayValue: "", error: "Nomor WhatsApp tidak valid (terlalu pendek)." };
			}
			return {
				isValid: true,
				normalizedUrl: `https://wa.me/${cleanedNumber}`,
				displayValue: trimmed.startsWith("+") ? trimmed : `+${cleanedNumber}`,
			};
		}
		case "telegram": {
			if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
				return { isValid: true, normalizedUrl: trimmed, displayValue: trimmed };
			}
			const cleanHandle = trimmed.replace(/^@/, "").trim();
			if (cleanHandle.length < 3) {
				return { isValid: false, normalizedUrl: "", displayValue: "", error: "Username Telegram tidak valid." };
			}
			return {
				isValid: true,
				normalizedUrl: `https://t.me/${cleanHandle}`,
				displayValue: `@${cleanHandle}`,
			};
		}
		case "instagram": {
			if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
				return { isValid: true, normalizedUrl: trimmed, displayValue: trimmed };
			}
			const cleanHandle = trimmed.replace(/^@/, "").trim();
			if (cleanHandle.length < 1) {
				return { isValid: false, normalizedUrl: "", displayValue: "", error: "Username Instagram tidak boleh kosong." };
			}
			return {
				isValid: true,
				normalizedUrl: `https://instagram.com/${cleanHandle}`,
				displayValue: `@${cleanHandle}`,
			};
		}
		default: {
			const urlCheck = validateUrl(trimmed);
			if (!urlCheck.isValid) {
				return { isValid: false, normalizedUrl: "", displayValue: "", error: urlCheck.error };
			}
			return { isValid: true, normalizedUrl: urlCheck.normalizedUrl, displayValue: trimmed };
		}
	}
}

/**
 * Checks whether the Cloudflare D1 DB binding exists in the Worker environment.
 */
export function isDatabaseBound(env: unknown): boolean {
	if (!env || typeof env !== "object") return false;
	const e = env as Record<string, unknown>;
	return Boolean(e.DB && typeof (e.DB as D1Database).prepare === "function");
}

/**
 * Comprehensive health & migration check for D1 database.
 */
export async function getDatabaseStatus(db?: D1Database): Promise<DatabaseStatus> {
	if (!db) {
		return {
			isConfigured: false,
			isReady: false,
			tablesCount: 0,
			tables: [],
			systemCounts: { links: 0, explore: 0, contact: 0, clicks: 0 },
			publishStatus: {
				hasUnpublishedChanges: false,
				version: 1,
				lastPublishedAt: "",
				draftUpdatedAt: "",
			},
			error: "Binding D1 'DB' belum dikonfigurasikan di wrangler.json.",
		};
	}

	try {
		// 1. Query sqlite_master to verify tables created by migrations
		const tablesResult = await db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name ASC;"
			)
			.all<{ name: string }>();

		const tableNames = (tablesResult.results || []).map((t) => t.name);

		const requiredTables = [
			"site_settings",
			"profile",
			"links",
			"links_draft",
			"explore_items",
			"contact_methods",
			"contact_methods_draft",
			"appearance_settings",
			"publish_metadata",
			"click_events",
		];

		const hasAllTables = requiredTables.every((t) => tableNames.includes(t));

		if (!hasAllTables) {
			return {
				isConfigured: true,
				isReady: false,
				tablesCount: tableNames.length,
				tables: tableNames.map((name) => ({ name, rows: 0 })),
				systemCounts: { links: 0, explore: 0, contact: 0, clicks: 0 },
				publishStatus: {
					hasUnpublishedChanges: false,
					version: 1,
					lastPublishedAt: "",
					draftUpdatedAt: "",
				},
				error: "Skema database belum lengkap. Jalankan migrasi: npx wrangler d1 migrations apply mobio-db",
			};
		}

		// 2. Fetch row counts for each table
		const tableBreakdown: { name: string; rows: number }[] = [];
		for (const name of tableNames) {
			try {
				const countRes = await db
					.prepare(`SELECT count(*) as count FROM ${name};`)
					.first<{ count: number }>();
				tableBreakdown.push({ name, rows: countRes?.count ?? 0 });
			} catch {
				tableBreakdown.push({ name, rows: 0 });
			}
		}

		// 3. Quick counts for dashboard
		const linksCount = tableBreakdown.find((t) => t.name === "links_draft")?.rows ?? 0;
		const exploreCount = tableBreakdown.find((t) => t.name === "explore_items")?.rows ?? 0;
		const contactCount = tableBreakdown.find((t) => t.name === "contact_methods_draft")?.rows ?? 0;
		const clicksCount = tableBreakdown.find((t) => t.name === "click_events")?.rows ?? 0;

		// 4. Publish status
		const pubMeta = await getPublishMetadata(db);

		return {
			isConfigured: true,
			isReady: true,
			tablesCount: tableNames.length,
			tables: tableBreakdown,
			systemCounts: {
				links: linksCount,
				explore: exploreCount,
				contact: contactCount,
				clicks: clicksCount,
			},
			publishStatus: {
				hasUnpublishedChanges: Boolean(pubMeta?.has_unpublished_changes),
				version: pubMeta?.version ?? 1,
				lastPublishedAt: pubMeta?.published_at ?? "",
				draftUpdatedAt: pubMeta?.draft_updated_at ?? "",
			},
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Gagal menghubungi database D1";
		return {
			isConfigured: true,
			isReady: false,
			tablesCount: 0,
			tables: [],
			systemCounts: { links: 0, explore: 0, contact: 0, clicks: 0 },
			publishStatus: {
				hasUnpublishedChanges: false,
				version: 1,
				lastPublishedAt: "",
				draftUpdatedAt: "",
			},
			error: message,
		};
	}
}

/**
 * Reads single-row site settings.
 */
export async function getSiteSettings(db: D1Database): Promise<SiteSettings | null> {
	try {
		return await db
			.prepare("SELECT * FROM site_settings WHERE id = 'default' LIMIT 1;")
			.first<SiteSettings>();
	} catch {
		return null;
	}
}

/**
 * Reads profile record for specified mode ("draft" or "published").
 */
export async function getProfileRecord(
	db: D1Database,
	mode: "draft" | "published" = "published"
): Promise<ProfileRecord | null> {
	try {
		// First try requested mode ('draft' or 'published')
		let res = await db
			.prepare("SELECT * FROM profile WHERE id = ? LIMIT 1;")
			.bind(mode)
			.first<ProfileRecord>();

		// Fallback to 'default' if 0002 hasn't run
		if (!res) {
			res = await db
				.prepare("SELECT * FROM profile WHERE id = 'default' LIMIT 1;")
				.first<ProfileRecord>();
		}
		return res;
	} catch {
		return null;
	}
}

/**
 * Saves draft profile changes into D1.
 */
export async function saveDraftProfile(
	db: D1Database,
	data: {
		name: string;
		handle: string;
		avatar_url?: string;
		location_id?: string;
		location_en?: string;
		bio_id?: string;
		bio_en?: string;
	}
): Promise<void> {
	const now = new Date().toISOString();
	await db.batch([
		db
			.prepare(
				`INSERT INTO profile (id, name, handle, avatar_url, location_id, location_en, bio_id, bio_en, updated_at)
				 VALUES ('draft', ?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT(id) DO UPDATE SET
				   name = excluded.name,
				   handle = excluded.handle,
				   avatar_url = excluded.avatar_url,
				   location_id = excluded.location_id,
				   location_en = excluded.location_en,
				   bio_id = excluded.bio_id,
				   bio_en = excluded.bio_en,
				   updated_at = excluded.updated_at;`
			)
			.bind(
				data.name.trim(),
				data.handle.trim(),
				data.avatar_url?.trim() || "",
				data.location_id?.trim() || "",
				data.location_en?.trim() || "",
				data.bio_id?.trim() || "",
				data.bio_en?.trim() || "",
				now
			),
		// Mark unpublished changes active
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now),
	]);
}

/**
 * Reads links from D1 (draft or published).
 */
export async function getLinks(
	db: D1Database,
	mode: "draft" | "published" = "published",
	activeOnly = false
): Promise<LinkRecord[]> {
	try {
		const table = mode === "draft" ? "links_draft" : "links";
		const query = activeOnly
			? `SELECT * FROM ${table} WHERE is_enabled = 1 ORDER BY sort_order ASC, created_at DESC;`
			: `SELECT * FROM ${table} ORDER BY sort_order ASC, created_at DESC;`;
		const res = await db.prepare(query).all<LinkRecord>();
		return res.results || [];
	} catch {
		return [];
	}
}

/**
 * Creates a new draft link item.
 */
export async function createDraftLink(
	db: D1Database,
	link: {
		title_id: string;
		title_en: string;
		description_id?: string;
		description_en?: string;
		url: string;
		platform?: string;
		icon?: string;
		sort_order?: number;
		is_enabled?: number;
	}
): Promise<LinkRecord> {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	// If sort_order not provided, calculate next available order
	let sortOrder = link.sort_order;
	if (typeof sortOrder !== "number") {
		const maxOrder = await db
			.prepare("SELECT MAX(sort_order) as maxOrder FROM links_draft;")
			.first<{ maxOrder: number | null }>();
		sortOrder = (maxOrder?.maxOrder ?? -1) + 1;
	}

	const newRecord: LinkRecord = {
		id,
		title_id: link.title_id.trim(),
		title_en: link.title_en.trim() || link.title_id.trim(),
		description_id: link.description_id?.trim() || "",
		description_en: link.description_en?.trim() || "",
		url: link.url.trim(),
		platform: link.platform?.trim() || "website",
		icon: link.icon?.trim() || "globe",
		sort_order: sortOrder,
		is_enabled: link.is_enabled ?? 1,
		created_at: now,
		updated_at: now,
	};

	await db.batch([
		db
			.prepare(
				`INSERT INTO links_draft (id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
			)
			.bind(
				newRecord.id,
				newRecord.title_id,
				newRecord.title_en,
				newRecord.description_id,
				newRecord.description_en,
				newRecord.url,
				newRecord.platform,
				newRecord.icon,
				newRecord.sort_order,
				newRecord.is_enabled,
				newRecord.created_at,
				newRecord.updated_at
			),
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now),
	]);

	return newRecord;
}

/**
 * Updates an existing draft link.
 */
export async function updateDraftLink(
	db: D1Database,
	id: string,
	data: Partial<LinkRecord>
): Promise<void> {
	const now = new Date().toISOString();
	const current = await db
		.prepare("SELECT * FROM links_draft WHERE id = ? LIMIT 1;")
		.bind(id)
		.first<LinkRecord>();

	if (!current) {
		throw new Error(`Link dengan ID '${id}' tidak ditemukan.`);
	}

	const updated: LinkRecord = {
		...current,
		...data,
		title_id: data.title_id !== undefined ? data.title_id.trim() : current.title_id,
		title_en: data.title_en !== undefined ? data.title_en.trim() : current.title_en,
		description_id: data.description_id !== undefined ? data.description_id.trim() : current.description_id,
		description_en: data.description_en !== undefined ? data.description_en.trim() : current.description_en,
		url: data.url !== undefined ? data.url.trim() : current.url,
		platform: data.platform !== undefined ? data.platform.trim() : current.platform,
		icon: data.icon !== undefined ? data.icon.trim() : current.icon,
		sort_order: data.sort_order !== undefined ? data.sort_order : current.sort_order,
		is_enabled: data.is_enabled !== undefined ? data.is_enabled : current.is_enabled,
		updated_at: now,
	};

	await db.batch([
		db
			.prepare(
				`UPDATE links_draft
				 SET title_id = ?, title_en = ?, description_id = ?, description_en = ?, url = ?, platform = ?, icon = ?, sort_order = ?, is_enabled = ?, updated_at = ?
				 WHERE id = ?;`
			)
			.bind(
				updated.title_id,
				updated.title_en,
				updated.description_id,
				updated.description_en,
				updated.url,
				updated.platform,
				updated.icon,
				updated.sort_order,
				updated.is_enabled,
				updated.updated_at,
				id
			),
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now),
	]);
}

/**
 * Deletes a draft link.
 */
export async function deleteDraftLink(db: D1Database, id: string): Promise<void> {
	const now = new Date().toISOString();
	await db.batch([
		db.prepare("DELETE FROM links_draft WHERE id = ?;").bind(id),
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now),
	]);
}

/**
 * Reorders draft links based on an ordered list of IDs.
 */
export async function reorderDraftLinks(db: D1Database, orderedIds: string[]): Promise<void> {
	const now = new Date().toISOString();
	const statements = orderedIds.map((id, index) =>
		db
			.prepare("UPDATE links_draft SET sort_order = ?, updated_at = ? WHERE id = ?;")
			.bind(index, now, id)
	);

	statements.push(
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now)
	);

	await db.batch(statements);
}

/**
 * Reads contact methods (draft or published).
 */
export async function getContactMethods(
	db: D1Database,
	mode: "draft" | "published" = "published",
	activeOnly = false
): Promise<ContactMethodRecord[]> {
	try {
		const table = mode === "draft" ? "contact_methods_draft" : "contact_methods";
		const query = activeOnly
			? `SELECT * FROM ${table} WHERE is_enabled = 1 ORDER BY sort_order ASC, created_at DESC;`
			: `SELECT * FROM ${table} ORDER BY sort_order ASC, created_at DESC;`;
		const res = await db.prepare(query).all<ContactMethodRecord>();
		return res.results || [];
	} catch {
		return [];
	}
}

/**
 * Creates a new draft contact method.
 */
export async function createDraftContact(
	db: D1Database,
	contact: {
		platform: "whatsapp" | "telegram" | "email" | "instagram" | "custom";
		label_id: string;
		label_en: string;
		value: string;
		url: string;
		sort_order?: number;
		is_enabled?: number;
	}
): Promise<ContactMethodRecord> {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	let sortOrder = contact.sort_order;
	if (typeof sortOrder !== "number") {
		const maxOrder = await db
			.prepare("SELECT MAX(sort_order) as maxOrder FROM contact_methods_draft;")
			.first<{ maxOrder: number | null }>();
		sortOrder = (maxOrder?.maxOrder ?? -1) + 1;
	}

	const newRecord: ContactMethodRecord = {
		id,
		platform: contact.platform,
		label_id: contact.label_id.trim(),
		label_en: contact.label_en.trim() || contact.label_id.trim(),
		value: contact.value.trim(),
		url: contact.url.trim(),
		sort_order: sortOrder,
		is_enabled: contact.is_enabled ?? 1,
		created_at: now,
		updated_at: now,
	};

	await db.batch([
		db
			.prepare(
				`INSERT INTO contact_methods_draft (id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
			)
			.bind(
				newRecord.id,
				newRecord.platform,
				newRecord.label_id,
				newRecord.label_en,
				newRecord.value,
				newRecord.url,
				newRecord.sort_order,
				newRecord.is_enabled,
				newRecord.created_at,
				newRecord.updated_at
			),
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now),
	]);

	return newRecord;
}

/**
 * Updates an existing draft contact method.
 */
export async function updateDraftContact(
	db: D1Database,
	id: string,
	data: Partial<ContactMethodRecord>
): Promise<void> {
	const now = new Date().toISOString();
	const current = await db
		.prepare("SELECT * FROM contact_methods_draft WHERE id = ? LIMIT 1;")
		.bind(id)
		.first<ContactMethodRecord>();

	if (!current) {
		throw new Error(`Kontak dengan ID '${id}' tidak ditemukan.`);
	}

	const updated: ContactMethodRecord = {
		...current,
		...data,
		label_id: data.label_id !== undefined ? data.label_id.trim() : current.label_id,
		label_en: data.label_en !== undefined ? data.label_en.trim() : current.label_en,
		value: data.value !== undefined ? data.value.trim() : current.value,
		url: data.url !== undefined ? data.url.trim() : current.url,
		sort_order: data.sort_order !== undefined ? data.sort_order : current.sort_order,
		is_enabled: data.is_enabled !== undefined ? data.is_enabled : current.is_enabled,
		updated_at: now,
	};

	await db.batch([
		db
			.prepare(
				`UPDATE contact_methods_draft
				 SET platform = ?, label_id = ?, label_en = ?, value = ?, url = ?, sort_order = ?, is_enabled = ?, updated_at = ?
				 WHERE id = ?;`
			)
			.bind(
				updated.platform,
				updated.label_id,
				updated.label_en,
				updated.value,
				updated.url,
				updated.sort_order,
				updated.is_enabled,
				updated.updated_at,
				id
			),
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now),
	]);
}

/**
 * Deletes a draft contact method.
 */
export async function deleteDraftContact(db: D1Database, id: string): Promise<void> {
	const now = new Date().toISOString();
	await db.batch([
		db.prepare("DELETE FROM contact_methods_draft WHERE id = ?;").bind(id),
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now),
	]);
}

/**
 * Reorders draft contact methods based on an ordered list of IDs.
 */
export async function reorderDraftContacts(db: D1Database, orderedIds: string[]): Promise<void> {
	const now = new Date().toISOString();
	const statements = orderedIds.map((id, index) =>
		db
			.prepare("UPDATE contact_methods_draft SET sort_order = ?, updated_at = ? WHERE id = ?;")
			.bind(index, now, id)
	);

	statements.push(
		db
			.prepare(
				`UPDATE publish_metadata
				 SET has_unpublished_changes = 1, draft_updated_at = ?
				 WHERE id = 'current';`
			)
			.bind(now)
	);

	await db.batch(statements);
}

/**
 * Reads publication metadata.
 */
export async function getPublishMetadata(db: D1Database): Promise<PublishMetadataRecord | null> {
	try {
		return await db
			.prepare("SELECT * FROM publish_metadata WHERE id = 'current' LIMIT 1;")
			.first<PublishMetadataRecord>();
	} catch {
		return null;
	}
}

/**
 * Atomically publishes all draft changes to the published state.
 */
export async function publishAllDrafts(
	db: D1Database,
	publishedBy = "admin"
): Promise<{ version: number; publishedAt: string }> {
	const now = new Date().toISOString();
	const meta = await getPublishMetadata(db);
	const nextVersion = (meta?.version ?? 0) + 1;

	// Execute atomic batch
	await db.batch([
		// 1. Promote profile draft to published
		db.prepare(
			`INSERT INTO profile (id, name, handle, avatar_url, location_id, location_en, bio_id, bio_en, updated_at)
			 SELECT 'published', name, handle, avatar_url, location_id, location_en, bio_id, bio_en, ?
			 FROM profile WHERE id = 'draft'
			 ON CONFLICT(id) DO UPDATE SET
			   name = excluded.name,
			   handle = excluded.handle,
			   avatar_url = excluded.avatar_url,
			   location_id = excluded.location_id,
			   location_en = excluded.location_en,
			   bio_id = excluded.bio_id,
			   bio_en = excluded.bio_en,
			   updated_at = excluded.updated_at;`
		).bind(now),

		// 2. Promote links_draft to links
		db.prepare("DELETE FROM links;"),
		db.prepare(
			`INSERT INTO links (id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, created_at, updated_at)
			 SELECT id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, created_at, updated_at
			 FROM links_draft;`
		),

		// 3. Promote contact_methods_draft to contact_methods
		db.prepare("DELETE FROM contact_methods;"),
		db.prepare(
			`INSERT INTO contact_methods (id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at)
			 SELECT id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at
			 FROM contact_methods_draft;`
		),

		// 4. Update publish metadata
		db.prepare(
			`INSERT INTO publish_metadata (id, version, published_at, published_by, notes, has_unpublished_changes, draft_updated_at)
			 VALUES ('current', ?, ?, ?, 'Published from MOBIO Studio', 0, ?)
			 ON CONFLICT(id) DO UPDATE SET
			   version = excluded.version,
			   published_at = excluded.published_at,
			   published_by = excluded.published_by,
			   notes = excluded.notes,
			   has_unpublished_changes = 0,
			   draft_updated_at = excluded.draft_updated_at;`
		).bind(nextVersion, now, publishedBy, now),
	]);

	return { version: nextVersion, publishedAt: now };
}

/**
 * Discards all draft changes and resets draft tables back to currently published records.
 */
export async function discardAllDrafts(db: D1Database): Promise<void> {
	const now = new Date().toISOString();

	await db.batch([
		// 1. Reset profile draft from published
		db.prepare(
			`INSERT INTO profile (id, name, handle, avatar_url, location_id, location_en, bio_id, bio_en, updated_at)
			 SELECT 'draft', name, handle, avatar_url, location_id, location_en, bio_id, bio_en, ?
			 FROM profile WHERE id = 'published'
			 ON CONFLICT(id) DO UPDATE SET
			   name = excluded.name,
			   handle = excluded.handle,
			   avatar_url = excluded.avatar_url,
			   location_id = excluded.location_id,
			   location_en = excluded.location_en,
			   bio_id = excluded.bio_id,
			   bio_en = excluded.bio_en,
			   updated_at = excluded.updated_at;`
		).bind(now),

		// 2. Reset links_draft from links
		db.prepare("DELETE FROM links_draft;"),
		db.prepare(
			`INSERT INTO links_draft (id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, created_at, updated_at)
			 SELECT id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, created_at, updated_at
			 FROM links;`
		),

		// 3. Reset contact_methods_draft from contact_methods
		db.prepare("DELETE FROM contact_methods_draft;"),
		db.prepare(
			`INSERT INTO contact_methods_draft (id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at)
			 SELECT id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at
			 FROM contact_methods;`
		),

		// 4. Mark draft changes cleared
		db.prepare(
			`UPDATE publish_metadata
			 SET has_unpublished_changes = 0, draft_updated_at = ?
			 WHERE id = 'current';`
		).bind(now),
	]);
}
