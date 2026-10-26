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
	avatar_media_id?: string;
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
	icon_type: "preset" | "upload" | "url";
	icon_url: string;
	icon_media_id: string;
}

export type ExploreBlockType =
	| "gallery"
	| "image"
	| "video"
	| "music"
	| "game"
	| "review"
	| "project"
	| "note"
	| "link"
	| "custom";

export interface ExploreItemRecord {
	id: string;
	type: ExploreBlockType | string;
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
	category?: string;
	subcategory_id?: string;
	sort_order: number;
	is_enabled: number;
	created_at: string;
	updated_at: string;
}

export interface ExploreSubcategoryRecord {
	id: string;
	category: string;
	label_id: string;
	label_en: string;
	icon?: string;
	color?: string;
	sort_order: number;
	created_at?: string;
	updated_at?: string;
}

export interface ExploreCategoryRecord {
	id: string;
	name_id: string;
	name_en: string;
	icon?: string;
	color?: string;
	sort_order: number;
	is_enabled: number;
	created_at?: string;
	updated_at?: string;
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
	accent_color?: string;
	background_position_x?: number;
	background_position_y?: number;
	background_scale?: number;
	background_overlay_color?: string;
	background_brightness?: number;
	glass_blur?: string;
	glass_opacity?: number;
	glass_tint?: string;
	glass_border_opacity?: number;
	glass_highlight_intensity?: number;
	glass_shadow_intensity?: number;
	glass_radius?: string;
	background_media_id?: string;
	background_poster_media_id?: string;
	cover_media_id?: string;
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
		media?: number;
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
			"explore_items_draft",
			"contact_methods",
			"contact_methods_draft",
			"appearance_settings",
			"publish_metadata",
			"click_events",
			"media_assets",
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
				error: "Skema database belum lengkap. Jalankan migrasi: npx wrangler d1 migrations apply mobio-studio-db",
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
		const exploreCount = tableBreakdown.find((t) => t.name === "explore_items_draft")?.rows ?? 0;
		const contactCount = tableBreakdown.find((t) => t.name === "contact_methods_draft")?.rows ?? 0;
		const clicksCount = tableBreakdown.find((t) => t.name === "click_events")?.rows ?? 0;
		const mediaCount = tableBreakdown.find((t) => t.name === "media_assets")?.rows ?? 0;

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
				media: mediaCount,
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
	avatar_media_id?: string;
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
				`INSERT INTO profile (id, name, handle, avatar_url, avatar_media_id, location_id, location_en, bio_id, bio_en, updated_at)
				 VALUES ('draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT(id) DO UPDATE SET
				   name = excluded.name,
				   handle = excluded.handle,
				   avatar_url = excluded.avatar_url,
				   avatar_media_id = excluded.avatar_media_id,
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
				data.avatar_media_id?.trim() || "",
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
		icon_type?: "preset" | "upload" | "url";
		icon_url?: string;
		icon_media_id?: string;
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
		icon_type: link.icon_type || "preset",
		icon_url: link.icon_url?.trim() || "",
		icon_media_id: link.icon_media_id?.trim() || "",
	};

	await db.batch([
		db
			.prepare(
				`INSERT INTO links_draft (id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, icon_type, icon_url, icon_media_id, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
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
				newRecord.icon_type,
				newRecord.icon_url,
				newRecord.icon_media_id,
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
		icon_type: data.icon_type !== undefined ? data.icon_type : (current.icon_type || "preset"),
		icon_url: data.icon_url !== undefined ? data.icon_url.trim() : (current.icon_url || ""),
		icon_media_id: data.icon_media_id !== undefined ? data.icon_media_id.trim() : (current.icon_media_id || ""),
		updated_at: now,
	};

	await db.batch([
		db
			.prepare(
				`UPDATE links_draft
				 SET title_id = ?, title_en = ?, description_id = ?, description_en = ?, url = ?, platform = ?, icon = ?, sort_order = ?, is_enabled = ?, icon_type = ?, icon_url = ?, icon_media_id = ?, updated_at = ?
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
				updated.icon_type,
				updated.icon_url,
				updated.icon_media_id,
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
 * Fetches explore items from either published or draft tables.
 */
export async function getExploreItems(
	db: D1Database,
	mode: "published" | "draft" = "published",
	activeOnly = false
): Promise<ExploreItemRecord[]> {
	const table = mode === "draft" ? "explore_items_draft" : "explore_items";
	const query = activeOnly
		? `SELECT * FROM ${table} WHERE is_enabled = 1 ORDER BY sort_order ASC, created_at ASC;`
		: `SELECT * FROM ${table} ORDER BY sort_order ASC, created_at ASC;`;

	try {
		const res = await db.prepare(query).all<ExploreItemRecord>();
		return res.results ?? [];
	} catch (err: unknown) {
		console.warn(`Failed to fetch explore items from ${table}:`, err);
		return [];
	}
}

/**
 * Fetches single explore item by ID.
 */
export async function getExploreItemById(
	db: D1Database,
	id: string,
	mode: "published" | "draft" = "draft"
): Promise<ExploreItemRecord | null> {
	const table = mode === "draft" ? "explore_items_draft" : "explore_items";
	try {
		return await db
			.prepare(`SELECT * FROM ${table} WHERE id = ? LIMIT 1;`)
			.bind(id)
			.first<ExploreItemRecord>();
	} catch {
		return null;
	}
}

/**
 * Creates a new draft explore item.
 */
export async function createDraftExploreItem(
	db: D1Database,
	item: {
		type: string;
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
		category?: string;
		subcategory_id?: string;
		sort_order?: number;
		is_enabled?: number;
	}
): Promise<ExploreItemRecord> {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	let sortOrder = item.sort_order;
	if (typeof sortOrder !== "number") {
		const maxOrder = await db
			.prepare("SELECT MAX(sort_order) as maxOrder FROM explore_items_draft;")
			.first<{ maxOrder: number | null }>();
		sortOrder = (maxOrder?.maxOrder ?? -1) + 1;
	}

	const newRecord: ExploreItemRecord = {
		id,
		type: item.type.trim().toLowerCase(),
		title_id: item.title_id.trim(),
		title_en: item.title_en.trim() || item.title_id.trim(),
		subtitle_id: item.subtitle_id?.trim() || "",
		subtitle_en: item.subtitle_en?.trim() || "",
		description_id: item.description_id?.trim() || "",
		description_en: item.description_en?.trim() || "",
		url: item.url?.trim() || "",
		cover_image: item.cover_image?.trim() || "",
		badge_id: item.badge_id?.trim() || "",
		badge_en: item.badge_en?.trim() || "",
		metadata_json: item.metadata_json?.trim() || "{}",
		category: item.category?.trim() || "all",
		subcategory_id: item.subcategory_id?.trim() || "",
		sort_order: sortOrder,
		is_enabled: item.is_enabled ?? 1,
		created_at: now,
		updated_at: now,
	};

	await db.batch([
		db
			.prepare(
				`INSERT INTO explore_items_draft (id, type, title_id, title_en, subtitle_id, subtitle_en, description_id, description_en, url, cover_image, badge_id, badge_en, metadata_json, sort_order, is_enabled, category, subcategory_id, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
			)
			.bind(
				newRecord.id,
				newRecord.type,
				newRecord.title_id,
				newRecord.title_en,
				newRecord.subtitle_id,
				newRecord.subtitle_en,
				newRecord.description_id,
				newRecord.description_en,
				newRecord.url,
				newRecord.cover_image,
				newRecord.badge_id,
				newRecord.badge_en,
				newRecord.metadata_json,
				newRecord.sort_order,
				newRecord.is_enabled,
				newRecord.category,
				newRecord.subcategory_id,
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
 * Updates an existing draft explore item.
 */
export async function updateDraftExploreItem(
	db: D1Database,
	id: string,
	data: Partial<ExploreItemRecord>
): Promise<void> {
	const now = new Date().toISOString();
	const current = await db
		.prepare("SELECT * FROM explore_items_draft WHERE id = ? LIMIT 1;")
		.bind(id)
		.first<ExploreItemRecord>();

	if (!current) {
		throw new Error(`Item Explore dengan ID '${id}' tidak ditemukan.`);
	}

	const updated: ExploreItemRecord = {
		...current,
		...data,
		type: data.type !== undefined ? data.type.trim().toLowerCase() : current.type,
		title_id: data.title_id !== undefined ? data.title_id.trim() : current.title_id,
		title_en: data.title_en !== undefined ? data.title_en.trim() : current.title_en,
		subtitle_id: data.subtitle_id !== undefined ? data.subtitle_id.trim() : current.subtitle_id,
		subtitle_en: data.subtitle_en !== undefined ? data.subtitle_en.trim() : current.subtitle_en,
		description_id: data.description_id !== undefined ? data.description_id.trim() : current.description_id,
		description_en: data.description_en !== undefined ? data.description_en.trim() : current.description_en,
		url: data.url !== undefined ? data.url.trim() : current.url,
		cover_image: data.cover_image !== undefined ? data.cover_image.trim() : current.cover_image,
		badge_id: data.badge_id !== undefined ? data.badge_id.trim() : current.badge_id,
		badge_en: data.badge_en !== undefined ? data.badge_en.trim() : current.badge_en,
		metadata_json: data.metadata_json !== undefined ? data.metadata_json.trim() : current.metadata_json,
		category: data.category !== undefined ? data.category.trim() : current.category || "all",
		subcategory_id: data.subcategory_id !== undefined ? data.subcategory_id.trim() : current.subcategory_id || "",
		sort_order: data.sort_order !== undefined ? data.sort_order : current.sort_order,
		is_enabled: data.is_enabled !== undefined ? data.is_enabled : current.is_enabled,
		updated_at: now,
	};

	await db.batch([
		db
			.prepare(
				`UPDATE explore_items_draft
				 SET type = ?, title_id = ?, title_en = ?, subtitle_id = ?, subtitle_en = ?, description_id = ?, description_en = ?, url = ?, cover_image = ?, badge_id = ?, badge_en = ?, metadata_json = ?, category = ?, subcategory_id = ?, sort_order = ?, is_enabled = ?, updated_at = ?
				 WHERE id = ?;`
			)
			.bind(
				updated.type,
				updated.title_id,
				updated.title_en,
				updated.subtitle_id,
				updated.subtitle_en,
				updated.description_id,
				updated.description_en,
				updated.url,
				updated.cover_image,
				updated.badge_id,
				updated.badge_en,
				updated.metadata_json,
				updated.category,
				updated.subcategory_id,
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
 * Deletes a draft explore item.
 */
export async function deleteDraftExploreItem(db: D1Database, id: string): Promise<void> {
	const now = new Date().toISOString();
	await db.batch([
		db.prepare("DELETE FROM explore_items_draft WHERE id = ?;").bind(id),
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
 * Duplicates a draft explore item.
 */
export async function duplicateDraftExploreItem(
	db: D1Database,
	id: string
): Promise<ExploreItemRecord> {
	const current = await db
		.prepare("SELECT * FROM explore_items_draft WHERE id = ? LIMIT 1;")
		.bind(id)
		.first<ExploreItemRecord>();

	if (!current) {
		throw new Error(`Item Explore dengan ID '${id}' tidak ditemukan untuk diduplikasi.`);
	}

	const maxOrder = await db
		.prepare("SELECT MAX(sort_order) as maxOrder FROM explore_items_draft;")
		.first<{ maxOrder: number | null }>();
	const newOrder = (maxOrder?.maxOrder ?? current.sort_order) + 1;

	return await createDraftExploreItem(db, {
		type: current.type,
		title_id: `${current.title_id} (Copy)`,
		title_en: `${current.title_en} (Copy)`,
		subtitle_id: current.subtitle_id,
		subtitle_en: current.subtitle_en,
		description_id: current.description_id,
		description_en: current.description_en,
		url: current.url,
		cover_image: current.cover_image,
		badge_id: current.badge_id,
		badge_en: current.badge_en,
		metadata_json: current.metadata_json,
		category: current.category,
		subcategory_id: current.subcategory_id,
		sort_order: newOrder,
		is_enabled: current.is_enabled,
	});
}

/**
 * Reorders draft explore items based on ordered array of IDs.
 */
export async function reorderDraftExploreItems(
	db: D1Database,
	orderedIds: string[]
): Promise<void> {
	const now = new Date().toISOString();
	const statements = orderedIds.map((id, index) =>
		db
			.prepare("UPDATE explore_items_draft SET sort_order = ?, updated_at = ? WHERE id = ?;")
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
 * Reads explore subcategories from D1.
 */
export async function getExploreSubcategories(
	db: D1Database,
	mode: "published" | "draft" = "published",
	category?: string
): Promise<ExploreSubcategoryRecord[]> {
	const table = mode === "draft" ? "explore_subcategories_draft" : "explore_subcategories";
	try {
		let query = `SELECT * FROM ${table}`;
		const params: string[] = [];
		if (category && category !== "all") {
			query += " WHERE category = ?";
			params.push(category);
		}
		query += " ORDER BY sort_order ASC, created_at ASC;";
		const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query);
		const res = await stmt.all<ExploreSubcategoryRecord>();
		return res.results ?? [];
	} catch (err: unknown) {
		console.warn(`Failed to fetch explore subcategories from ${table}:`, err);
		return [];
	}
}

/**
 * Creates a draft explore subcategory.
 */
export async function createDraftExploreSubcategory(
	db: D1Database,
	item: {
		category: string;
		label_id: string;
		label_en: string;
		icon?: string;
		color?: string;
		sort_order?: number;
	}
): Promise<ExploreSubcategoryRecord> {
	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	let sortOrder = item.sort_order;
	if (typeof sortOrder !== "number") {
		const maxOrder = await db
			.prepare("SELECT MAX(sort_order) as maxOrder FROM explore_subcategories_draft WHERE category = ?;")
			.bind(item.category)
			.first<{ maxOrder: number | null }>();
		sortOrder = (maxOrder?.maxOrder ?? -1) + 1;
	}

	const newRecord: ExploreSubcategoryRecord = {
		id,
		category: item.category.trim(),
		label_id: item.label_id.trim(),
		label_en: item.label_en.trim() || item.label_id.trim(),
		icon: item.icon?.trim() || "",
		color: item.color?.trim() || "",
		sort_order: sortOrder,
		created_at: now,
		updated_at: now,
	};

	await db.batch([
		db.prepare(
			`INSERT INTO explore_subcategories_draft (id, category, label_id, label_en, icon, color, sort_order, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`
		).bind(
			newRecord.id,
			newRecord.category,
			newRecord.label_id,
			newRecord.label_en,
			newRecord.icon,
			newRecord.color,
			newRecord.sort_order,
			newRecord.created_at,
			newRecord.updated_at
		),
		db.prepare(
			`UPDATE publish_metadata SET has_unpublished_changes = 1, draft_updated_at = ? WHERE id = 'current';`
		).bind(now),
	]);

	return newRecord;
}

/**
 * Updates a draft explore subcategory.
 */
export async function updateDraftExploreSubcategory(
	db: D1Database,
	id: string,
	data: Partial<ExploreSubcategoryRecord>
): Promise<void> {
	const now = new Date().toISOString();
	const current = await db
		.prepare("SELECT * FROM explore_subcategories_draft WHERE id = ? LIMIT 1;")
		.bind(id)
		.first<ExploreSubcategoryRecord>();

	if (!current) {
		throw new Error(`Subkategori dengan ID '${id}' tidak ditemukan.`);
	}

	const updated: ExploreSubcategoryRecord = {
		...current,
		...data,
		category: data.category !== undefined ? data.category.trim() : current.category,
		label_id: data.label_id !== undefined ? data.label_id.trim() : current.label_id,
		label_en: data.label_en !== undefined ? data.label_en.trim() : current.label_en,
		icon: data.icon !== undefined ? data.icon.trim() : current.icon,
		color: data.color !== undefined ? data.color.trim() : current.color,
		sort_order: data.sort_order !== undefined ? data.sort_order : current.sort_order,
		updated_at: now,
	};

	await db.batch([
		db.prepare(
			`UPDATE explore_subcategories_draft
			 SET category = ?, label_id = ?, label_en = ?, icon = ?, color = ?, sort_order = ?, updated_at = ?
			 WHERE id = ?;`
		).bind(
			updated.category,
			updated.label_id,
			updated.label_en,
			updated.icon,
			updated.color,
			updated.sort_order,
			updated.updated_at,
			id
		),
		db.prepare(
			`UPDATE publish_metadata SET has_unpublished_changes = 1, draft_updated_at = ? WHERE id = 'current';`
		).bind(now),
	]);
}

/**
 * Deletes a draft explore subcategory. Safe: Reassigns any explore items that had this subcategory to empty string.
 */
export async function deleteDraftExploreSubcategory(db: D1Database, id: string): Promise<void> {
	const now = new Date().toISOString();
	await db.batch([
		db.prepare("DELETE FROM explore_subcategories_draft WHERE id = ?;").bind(id),
		db.prepare("UPDATE explore_items_draft SET subcategory_id = '' WHERE subcategory_id = ?;").bind(id),
		db.prepare(
			`UPDATE publish_metadata SET has_unpublished_changes = 1, draft_updated_at = ? WHERE id = 'current';`
		).bind(now),
	]);
}

/**
 * Reorders draft explore subcategories.
 */
export async function reorderDraftExploreSubcategories(
	db: D1Database,
	orderedIds: string[]
): Promise<void> {
	const now = new Date().toISOString();
	const statements = orderedIds.map((id, index) =>
		db
			.prepare("UPDATE explore_subcategories_draft SET sort_order = ?, updated_at = ? WHERE id = ?;")
			.bind(index, now, id)
	);

	statements.push(
		db.prepare(
			`UPDATE publish_metadata SET has_unpublished_changes = 1, draft_updated_at = ? WHERE id = 'current';`
		).bind(now)
	);

	await db.batch(statements);
}

/**
 * Reads explore categories from D1.
 */
export async function getExploreCategories(
	db: D1Database,
	mode: "published" | "draft" = "published"
): Promise<ExploreCategoryRecord[]> {
	const table = mode === "draft" ? "explore_categories_draft" : "explore_categories";
	try {
		const res = await db
			.prepare(`SELECT * FROM ${table} ORDER BY sort_order ASC, created_at ASC;`)
			.all<ExploreCategoryRecord>();
		return res.results ?? [];
	} catch (err: unknown) {
		console.warn(`Failed to fetch explore categories from ${table}:`, err);
		return [];
	}
}

/**
 * Creates a draft explore category.
 */
export async function createDraftExploreCategory(
	db: D1Database,
	category: {
		id?: string;
		name_id: string;
		name_en: string;
		icon?: string;
		color?: string;
		sort_order?: number;
		is_enabled?: number;
	}
): Promise<ExploreCategoryRecord> {
	const rawId = category.id?.trim() || "";
	const slug = rawId ? rawId.toLowerCase().replace(/[^a-z0-9_-]/g, "-") : crypto.randomUUID().slice(0, 8);
	const now = new Date().toISOString();

	let sortOrder = category.sort_order;
	if (typeof sortOrder !== "number") {
		const maxOrder = await db
			.prepare("SELECT MAX(sort_order) as maxOrder FROM explore_categories_draft;")
			.first<{ maxOrder: number | null }>();
		sortOrder = (maxOrder?.maxOrder ?? -1) + 1;
	}

	const newRecord: ExploreCategoryRecord = {
		id: slug,
		name_id: category.name_id.trim(),
		name_en: category.name_en.trim() || category.name_id.trim(),
		icon: category.icon?.trim() || "folder",
		color: category.color?.trim() || "#8b5cf6",
		sort_order: sortOrder,
		is_enabled: category.is_enabled !== undefined ? category.is_enabled : 1,
		created_at: now,
		updated_at: now,
	};

	await db.batch([
		db.prepare(
			`INSERT INTO explore_categories_draft (id, name_id, name_en, icon, color, sort_order, is_enabled, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`
		).bind(
			newRecord.id,
			newRecord.name_id,
			newRecord.name_en,
			newRecord.icon,
			newRecord.color,
			newRecord.sort_order,
			newRecord.is_enabled,
			newRecord.created_at,
			newRecord.updated_at
		),
		db.prepare(
			`UPDATE publish_metadata SET has_unpublished_changes = 1, draft_updated_at = ? WHERE id = 'current';`
		).bind(now),
	]);

	return newRecord;
}

/**
 * Updates a draft explore category.
 */
export async function updateDraftExploreCategory(
	db: D1Database,
	id: string,
	data: Partial<ExploreCategoryRecord>
): Promise<void> {
	const now = new Date().toISOString();
	const current = await db
		.prepare("SELECT * FROM explore_categories_draft WHERE id = ? LIMIT 1;")
		.bind(id)
		.first<ExploreCategoryRecord>();

	if (!current) {
		throw new Error(`Kategori dengan ID '${id}' tidak ditemukan.`);
	}

	const updated: ExploreCategoryRecord = {
		...current,
		...data,
		name_id: data.name_id !== undefined ? data.name_id.trim() : current.name_id,
		name_en: data.name_en !== undefined ? data.name_en.trim() : current.name_en,
		icon: data.icon !== undefined ? data.icon.trim() : current.icon,
		color: data.color !== undefined ? data.color.trim() : current.color,
		sort_order: data.sort_order !== undefined ? data.sort_order : current.sort_order,
		is_enabled: data.is_enabled !== undefined ? data.is_enabled : current.is_enabled,
		updated_at: now,
	};

	await db.batch([
		db.prepare(
			`UPDATE explore_categories_draft
			 SET name_id = ?, name_en = ?, icon = ?, color = ?, sort_order = ?, is_enabled = ?, updated_at = ?
			 WHERE id = ?;`
		).bind(
			updated.name_id,
			updated.name_en,
			updated.icon,
			updated.color,
			updated.sort_order,
			updated.is_enabled,
			updated.updated_at,
			id
		),
		db.prepare(
			`UPDATE publish_metadata SET has_unpublished_changes = 1, draft_updated_at = ? WHERE id = 'current';`
		).bind(now),
	]);
}

/**
 * Deletes a draft explore category. Safe backward-compatible: reassigns items to 'all'.
 */
export async function deleteDraftExploreCategory(
	db: D1Database,
	id: string
): Promise<void> {
	const now = new Date().toISOString();

	await db.batch([
		db.prepare("DELETE FROM explore_categories_draft WHERE id = ?;").bind(id),
		db.prepare("UPDATE explore_items_draft SET category = 'all', updated_at = ? WHERE category = ?;").bind(now, id),
		db.prepare(
			`UPDATE publish_metadata SET has_unpublished_changes = 1, draft_updated_at = ? WHERE id = 'current';`
		).bind(now),
	]);
}

/**
 * Reorders draft explore categories.
 */
export async function reorderDraftExploreCategories(
	db: D1Database,
	orderedIds: string[]
): Promise<void> {
	const now = new Date().toISOString();
	const statements = orderedIds.map((id, index) =>
		db
			.prepare("UPDATE explore_categories_draft SET sort_order = ?, updated_at = ? WHERE id = ?;")
			.bind(index, now, id)
	);

	statements.push(
		db.prepare(
			`UPDATE publish_metadata SET has_unpublished_changes = 1, draft_updated_at = ? WHERE id = 'current';`
		).bind(now)
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
 * Default visual appearance settings (Frost Aurora + Medium Liquid Glass).
 */
export const DEFAULT_APPEARANCE: AppearanceRecord = {
	id: "draft",
	palette: "frost-aurora",
	glass_intensity: "medium",
	background_type: "gradient",
	background_src: "",
	background_poster: "",
	background_animation: 1,
	background_overlay_opacity: 0.45,
	cover_enabled: 0,
	cover_url: "",
	cover_aspect_ratio: "16:9",
	accent_color: "#8b5cf6",
	background_position_x: 50.0,
	background_position_y: 50.0,
	background_scale: 1.0,
	background_overlay_color: "rgba(248, 250, 252, 0.45)",
	background_brightness: 1.0,
	glass_blur: "16px",
	glass_opacity: 0.70,
	glass_tint: "rgba(255, 255, 255, 0.65)",
	glass_border_opacity: 0.30,
	glass_highlight_intensity: 0.40,
	glass_shadow_intensity: 0.15,
	glass_radius: "1.5rem",
	background_media_id: "",
	background_poster_media_id: "",
	cover_media_id: "",
	created_at: "",
	updated_at: "",
};

/**
 * Reads appearance settings from D1 (draft or published).
 */
export async function getAppearanceRecord(
	db: D1Database,
	mode: "draft" | "published" = "published"
): Promise<AppearanceRecord> {
	try {
		let res = await db
			.prepare("SELECT * FROM appearance_settings WHERE id = ? LIMIT 1;")
			.bind(mode)
			.first<AppearanceRecord>();

		if (!res && mode === "draft") {
			res = await db
				.prepare("SELECT * FROM appearance_settings WHERE id = 'published' LIMIT 1;")
				.first<AppearanceRecord>();
		}
		if (!res) {
			res = await db
				.prepare("SELECT * FROM appearance_settings WHERE id = 'default' LIMIT 1;")
				.first<AppearanceRecord>();
		}
		if (res) {
			return {
				...DEFAULT_APPEARANCE,
				...res,
			};
		}
		return { ...DEFAULT_APPEARANCE, id: mode };
	} catch {
		return { ...DEFAULT_APPEARANCE, id: mode };
	}
}

/**
 * Saves draft appearance settings in D1 and flags unpublished changes.
 */
export async function saveDraftAppearance(
	db: D1Database,
	data: Partial<AppearanceRecord>
): Promise<AppearanceRecord> {
	const current = await getAppearanceRecord(db, "draft");
	const now = new Date().toISOString();

	const merged: AppearanceRecord = {
		...current,
		...data,
		id: "draft",
		updated_at: now,
	};

	await db.batch([
		db.prepare(
			`INSERT INTO appearance_settings (
				id, palette, glass_intensity, background_type, background_src, background_poster,
				background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
				accent_color, background_position_x, background_position_y, background_scale,
				background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
				glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
				background_media_id, background_poster_media_id, cover_media_id, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				palette = excluded.palette,
				glass_intensity = excluded.glass_intensity,
				background_type = excluded.background_type,
				background_src = excluded.background_src,
				background_poster = excluded.background_poster,
				background_animation = excluded.background_animation,
				background_overlay_opacity = excluded.background_overlay_opacity,
				cover_enabled = excluded.cover_enabled,
				cover_url = excluded.cover_url,
				cover_aspect_ratio = excluded.cover_aspect_ratio,
				accent_color = excluded.accent_color,
				background_position_x = excluded.background_position_x,
				background_position_y = excluded.background_position_y,
				background_scale = excluded.background_scale,
				background_overlay_color = excluded.background_overlay_color,
				background_brightness = excluded.background_brightness,
				glass_blur = excluded.glass_blur,
				glass_opacity = excluded.glass_opacity,
				glass_tint = excluded.glass_tint,
				glass_border_opacity = excluded.glass_border_opacity,
				glass_highlight_intensity = excluded.glass_highlight_intensity,
				glass_shadow_intensity = excluded.glass_shadow_intensity,
				glass_radius = excluded.glass_radius,
				background_media_id = excluded.background_media_id,
				background_poster_media_id = excluded.background_poster_media_id,
				cover_media_id = excluded.cover_media_id,
				updated_at = excluded.updated_at;`
		).bind(
			"draft",
			merged.palette,
			merged.glass_intensity,
			merged.background_type,
			merged.background_src || "",
			merged.background_poster || "",
			merged.background_animation ?? 1,
			merged.background_overlay_opacity ?? 0.45,
			merged.cover_enabled ?? 0,
			merged.cover_url || "",
			merged.cover_aspect_ratio || "16:9",
			merged.accent_color || "#8b5cf6",
			merged.background_position_x ?? 50.0,
			merged.background_position_y ?? 50.0,
			merged.background_scale ?? 1.0,
			merged.background_overlay_color || "rgba(248, 250, 252, 0.45)",
			merged.background_brightness ?? 1.0,
			merged.glass_blur || "16px",
			merged.glass_opacity ?? 0.70,
			merged.glass_tint || "rgba(255, 255, 255, 0.65)",
			merged.glass_border_opacity ?? 0.30,
			merged.glass_highlight_intensity ?? 0.40,
			merged.glass_shadow_intensity ?? 0.15,
			merged.glass_radius || "1.5rem",
			merged.background_media_id || "",
			merged.background_poster_media_id || "",
			merged.cover_media_id || "",
			now
		),
		db.prepare(
			`UPDATE publish_metadata
			 SET has_unpublished_changes = 1, draft_updated_at = ?
			 WHERE id = 'current';`
		).bind(now),
	]);

	return merged;
}

/**
 * Resets draft appearance settings back to clean default visual tokens.
 */
export async function resetDraftAppearance(db: D1Database): Promise<AppearanceRecord> {
	return await saveDraftAppearance(db, DEFAULT_APPEARANCE);
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
			`INSERT INTO profile (id, name, handle, avatar_url, avatar_media_id, location_id, location_en, bio_id, bio_en, updated_at)
			 SELECT 'published', name, handle, avatar_url, avatar_media_id, location_id, location_en, bio_id, bio_en, ?
			 FROM profile WHERE id = 'draft'
			 ON CONFLICT(id) DO UPDATE SET
			   name = excluded.name,
			   handle = excluded.handle,
			   avatar_url = excluded.avatar_url,
			   avatar_media_id = excluded.avatar_media_id,
			   location_id = excluded.location_id,
			   location_en = excluded.location_en,
			   bio_id = excluded.bio_id,
			   bio_en = excluded.bio_en,
			   updated_at = excluded.updated_at;`
		).bind(now),

		// 2. Promote links_draft to links
		db.prepare("DELETE FROM links;"),
		db.prepare(
			`INSERT INTO links (id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, icon_type, icon_url, icon_media_id, created_at, updated_at)
			 SELECT id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, icon_type, icon_url, icon_media_id, created_at, updated_at
			 FROM links_draft;`
		),

		// 3. Promote contact_methods_draft to contact_methods
		db.prepare("DELETE FROM contact_methods;"),
		db.prepare(
			`INSERT INTO contact_methods (id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at)
			 SELECT id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at
			 FROM contact_methods_draft;`
		),

		// 3b. Promote explore_items_draft to explore_items
		db.prepare("DELETE FROM explore_items;"),
		db.prepare(
			`INSERT INTO explore_items (id, type, title_id, title_en, subtitle_id, subtitle_en, description_id, description_en, url, cover_image, badge_id, badge_en, metadata_json, sort_order, is_enabled, category, subcategory_id, created_at, updated_at)
			 SELECT id, type, title_id, title_en, subtitle_id, subtitle_en, description_id, description_en, url, cover_image, badge_id, badge_en, metadata_json, sort_order, is_enabled, category, subcategory_id, created_at, updated_at
			 FROM explore_items_draft;`
		),

		// 3c. Promote explore_subcategories_draft to explore_subcategories
		db.prepare("DELETE FROM explore_subcategories;"),
		db.prepare(
			`INSERT INTO explore_subcategories (id, category, label_id, label_en, icon, color, sort_order, created_at, updated_at)
			 SELECT id, category, label_id, label_en, icon, color, sort_order, created_at, updated_at
			 FROM explore_subcategories_draft;`
		),

		// 3d. Promote explore_categories_draft to explore_categories
		db.prepare("DELETE FROM explore_categories;"),
		db.prepare(
			`INSERT INTO explore_categories (id, name_id, name_en, icon, color, sort_order, is_enabled, created_at, updated_at)
			 SELECT id, name_id, name_en, icon, color, sort_order, is_enabled, created_at, updated_at
			 FROM explore_categories_draft;`
		),

		// 4. Promote appearance_settings draft to published
		db.prepare(
			`INSERT INTO appearance_settings (
				id, palette, glass_intensity, background_type, background_src, background_poster,
				background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
				accent_color, background_position_x, background_position_y, background_scale,
				background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
				glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
				background_media_id, background_poster_media_id, cover_media_id, updated_at
			)
			SELECT
				'published', palette, glass_intensity, background_type, background_src, background_poster,
				background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
				accent_color, background_position_x, background_position_y, background_scale,
				background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
				glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
				background_media_id, background_poster_media_id, cover_media_id, ?
			FROM appearance_settings WHERE id = 'draft'
			ON CONFLICT(id) DO UPDATE SET
				palette = excluded.palette,
				glass_intensity = excluded.glass_intensity,
				background_type = excluded.background_type,
				background_src = excluded.background_src,
				background_poster = excluded.background_poster,
				background_animation = excluded.background_animation,
				background_overlay_opacity = excluded.background_overlay_opacity,
				cover_enabled = excluded.cover_enabled,
				cover_url = excluded.cover_url,
				cover_aspect_ratio = excluded.cover_aspect_ratio,
				accent_color = excluded.accent_color,
				background_position_x = excluded.background_position_x,
				background_position_y = excluded.background_position_y,
				background_scale = excluded.background_scale,
				background_overlay_color = excluded.background_overlay_color,
				background_brightness = excluded.background_brightness,
				glass_blur = excluded.glass_blur,
				glass_opacity = excluded.glass_opacity,
				glass_tint = excluded.glass_tint,
				glass_border_opacity = excluded.glass_border_opacity,
				glass_highlight_intensity = excluded.glass_highlight_intensity,
				glass_shadow_intensity = excluded.glass_shadow_intensity,
				glass_radius = excluded.glass_radius,
				background_media_id = excluded.background_media_id,
				background_poster_media_id = excluded.background_poster_media_id,
				cover_media_id = excluded.cover_media_id,
				updated_at = excluded.updated_at;`
		).bind(now),

		// 5. Update status of referenced media assets to 'published'
		db.prepare(
			`UPDATE media_assets
			 SET status = 'published', updated_at = ?
			 WHERE id IN (SELECT avatar_media_id FROM profile WHERE id = 'draft' AND avatar_media_id != '')
			    OR id IN (SELECT background_media_id FROM appearance_settings WHERE id = 'draft' AND background_media_id != '')
			    OR id IN (SELECT background_poster_media_id FROM appearance_settings WHERE id = 'draft' AND background_poster_media_id != '')
			    OR id IN (SELECT cover_media_id FROM appearance_settings WHERE id = 'draft' AND cover_media_id != '')
			    OR id IN (SELECT icon_media_id FROM links_draft WHERE icon_media_id != '')
			    OR EXISTS (
			        SELECT 1 FROM explore_items_draft e
			        WHERE e.cover_image LIKE '%' || media_assets.id || '%'
			           OR e.metadata_json LIKE '%' || media_assets.id || '%'
			    );`
		).bind(now),

		// 6. Update publish metadata
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
			`INSERT INTO profile (id, name, handle, avatar_url, avatar_media_id, location_id, location_en, bio_id, bio_en, updated_at)
			 SELECT 'draft', name, handle, avatar_url, avatar_media_id, location_id, location_en, bio_id, bio_en, ?
			 FROM profile WHERE id = 'published'
			 ON CONFLICT(id) DO UPDATE SET
			   name = excluded.name,
			   handle = excluded.handle,
			   avatar_url = excluded.avatar_url,
			   avatar_media_id = excluded.avatar_media_id,
			   location_id = excluded.location_id,
			   location_en = excluded.location_en,
			   bio_id = excluded.bio_id,
			   bio_en = excluded.bio_en,
			   updated_at = excluded.updated_at;`
		).bind(now),

		// 2. Reset links_draft from links
		db.prepare("DELETE FROM links_draft;"),
		db.prepare(
			`INSERT INTO links_draft (id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, icon_type, icon_url, icon_media_id, created_at, updated_at)
			 SELECT id, title_id, title_en, description_id, description_en, url, platform, icon, sort_order, is_enabled, icon_type, icon_url, icon_media_id, created_at, updated_at
			 FROM links;`
		),

		// 3. Reset contact_methods_draft from contact_methods
		db.prepare("DELETE FROM contact_methods_draft;"),
		db.prepare(
			`INSERT INTO contact_methods_draft (id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at)
			 SELECT id, platform, label_id, label_en, value, url, sort_order, is_enabled, created_at, updated_at
			 FROM contact_methods;`
		),

		// 3b. Reset explore_items_draft from explore_items
		db.prepare("DELETE FROM explore_items_draft;"),
		db.prepare(
			`INSERT INTO explore_items_draft (id, type, title_id, title_en, subtitle_id, subtitle_en, description_id, description_en, url, cover_image, badge_id, badge_en, metadata_json, sort_order, is_enabled, category, subcategory_id, created_at, updated_at)
			 SELECT id, type, title_id, title_en, subtitle_id, subtitle_en, description_id, description_en, url, cover_image, badge_id, badge_en, metadata_json, sort_order, is_enabled, category, subcategory_id, created_at, updated_at
			 FROM explore_items;`
		),

		// 3c. Reset explore_subcategories_draft from explore_subcategories
		db.prepare("DELETE FROM explore_subcategories_draft;"),
		db.prepare(
			`INSERT INTO explore_subcategories_draft (id, category, label_id, label_en, icon, color, sort_order, created_at, updated_at)
			 SELECT id, category, label_id, label_en, icon, color, sort_order, created_at, updated_at
			 FROM explore_subcategories;`
		),

		// 3d. Reset explore_categories_draft from explore_categories
		db.prepare("DELETE FROM explore_categories_draft;"),
		db.prepare(
			`INSERT INTO explore_categories_draft (id, name_id, name_en, icon, color, sort_order, is_enabled, created_at, updated_at)
			 SELECT id, name_id, name_en, icon, color, sort_order, is_enabled, created_at, updated_at
			 FROM explore_categories;`
		),

		// 4. Reset appearance_settings draft from published
		db.prepare(
			`INSERT INTO appearance_settings (
				id, palette, glass_intensity, background_type, background_src, background_poster,
				background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
				accent_color, background_position_x, background_position_y, background_scale,
				background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
				glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
				background_media_id, background_poster_media_id, cover_media_id, updated_at
			)
			SELECT
				'draft', palette, glass_intensity, background_type, background_src, background_poster,
				background_animation, background_overlay_opacity, cover_enabled, cover_url, cover_aspect_ratio,
				accent_color, background_position_x, background_position_y, background_scale,
				background_overlay_color, background_brightness, glass_blur, glass_opacity, glass_tint,
				glass_border_opacity, glass_highlight_intensity, glass_shadow_intensity, glass_radius,
				background_media_id, background_poster_media_id, cover_media_id, ?
			FROM appearance_settings WHERE id = 'published'
			ON CONFLICT(id) DO UPDATE SET
				palette = excluded.palette,
				glass_intensity = excluded.glass_intensity,
				background_type = excluded.background_type,
				background_src = excluded.background_src,
				background_poster = excluded.background_poster,
				background_animation = excluded.background_animation,
				background_overlay_opacity = excluded.background_overlay_opacity,
				cover_enabled = excluded.cover_enabled,
				cover_url = excluded.cover_url,
				cover_aspect_ratio = excluded.cover_aspect_ratio,
				accent_color = excluded.accent_color,
				background_position_x = excluded.background_position_x,
				background_position_y = excluded.background_position_y,
				background_scale = excluded.background_scale,
				background_overlay_color = excluded.background_overlay_color,
				background_brightness = excluded.background_brightness,
				glass_blur = excluded.glass_blur,
				glass_opacity = excluded.glass_opacity,
				glass_tint = excluded.glass_tint,
				glass_border_opacity = excluded.glass_border_opacity,
				glass_highlight_intensity = excluded.glass_highlight_intensity,
				glass_shadow_intensity = excluded.glass_shadow_intensity,
				glass_radius = excluded.glass_radius,
				background_media_id = excluded.background_media_id,
				background_poster_media_id = excluded.background_poster_media_id,
				cover_media_id = excluded.cover_media_id,
				updated_at = excluded.updated_at;`
		).bind(now),

		// 5. Mark draft changes cleared
		db.prepare(
			`UPDATE publish_metadata
			 SET has_unpublished_changes = 0, draft_updated_at = ?
			 WHERE id = 'current';`
		).bind(now),
	]);
}
