/**
 * MOBIO STUDIO — MEDIA MANAGEMENT & R2 STORAGE LAYER
 *
 * Implements:
 * - Content-type & magic byte signature detection
 * - File size and category limit validation
 * - R2 storage operations with chunking and HTTP Range support
 * - D1 Media Asset Registry operations
 * - Deletion protection for referenced media assets
 */

export type MediaCategory = "avatar" | "cover" | "background" | "general";
export type MediaType = "image" | "video";
export type MediaStatus = "uploaded" | "draft" | "published" | "archived";

export interface MediaAssetRecord {
	id: string;
	object_key: string;
	original_filename: string;
	media_category: MediaCategory;
	media_type: MediaType;
	mime_type: string;
	size_bytes: number;
	width: number | null;
	height: number | null;
	duration_seconds: number | null;
	status: MediaStatus;
	created_at: string;
	updated_at: string;
}

export const MEDIA_SIZE_LIMITS: Record<MediaCategory, number> = {
	avatar: 5 * 1024 * 1024, // 5 MiB
	cover: 15 * 1024 * 1024, // 15 MiB
	background: 50 * 1024 * 1024, // 50 MiB (covers both 15 MiB images and 50 MiB videos)
	general: 15 * 1024 * 1024,
};

export interface DetectedFormat {
	mediaType: MediaType;
	mimeType: string;
	extension: string;
}

/**
 * Validates file signature / magic numbers against permitted formats.
 * Strictly rejects HTML, SVG, scripts, executables, or unknown binaries.
 */
export function detectMediaFormat(buffer: Uint8Array): DetectedFormat | null {
	if (buffer.length < 12) return null;

	// 1. JPEG: FF D8 FF
	if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
		return { mediaType: "image", mimeType: "image/jpeg", extension: "jpg" };
	}

	// 2. PNG: 89 50 4E 47 0D 0A 1A 0A
	if (
		buffer[0] === 0x89 &&
		buffer[1] === 0x50 &&
		buffer[2] === 0x4e &&
		buffer[3] === 0x47 &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	) {
		return { mediaType: "image", mimeType: "image/png", extension: "png" };
	}

	// 3. WebP: RIFF ... WEBP (0-3: 52 49 46 46, 8-11: 57 45 42 50)
	if (
		buffer[0] === 0x52 &&
		buffer[1] === 0x49 &&
		buffer[2] === 0x46 &&
		buffer[3] === 0x46 &&
		buffer[8] === 0x57 &&
		buffer[9] === 0x45 &&
		buffer[10] === 0x42 &&
		buffer[11] === 0x50
	) {
		return { mediaType: "image", mimeType: "image/webp", extension: "webp" };
	}

	// 4. WebM: 1A 45 DF A3 (EBML Header)
	if (
		buffer[0] === 0x1a &&
		buffer[1] === 0x45 &&
		buffer[2] === 0xdf &&
		buffer[3] === 0xa3
	) {
		return { mediaType: "video", mimeType: "video/webm", extension: "webm" };
	}

	// 5. MP4 / AVIF (ISO Base Media File Format: bytes 4-7 = 'ftyp')
	const ftypString = String.fromCharCode(buffer[4], buffer[5], buffer[6], buffer[7]);
	if (ftypString === "ftyp") {
		const brand = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
		// AVIF brands: avif, avis
		if (brand === "avif" || brand === "avis") {
			return { mediaType: "image", mimeType: "image/avif", extension: "avif" };
		}
		// Standard MP4 brands (isom, mp41, mp42, dash, etc.)
		return { mediaType: "video", mimeType: "video/mp4", extension: "mp4" };
	}

	return null;
}

/**
 * Sanitizes original filename to prevent directory traversal or shell injection.
 */
export function sanitizeFilename(filename: string): string {
	const basename = filename.split(/[/\\]/).pop() || "upload";
	return basename.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
}

/**
 * Validates an uploaded media buffer.
 */
export function validateUpload(
	buffer: Uint8Array,
	rawFilename: string,
	category: MediaCategory
): {
	isValid: boolean;
	format?: DetectedFormat;
	sanitizedFilename?: string;
	error?: string;
	statusCode?: number;
} {
	// 1. Check size limit
	const maxLimit = MEDIA_SIZE_LIMITS[category] || MEDIA_SIZE_LIMITS.general;
	if (buffer.length > maxLimit) {
		const limitMb = Math.round(maxLimit / (1024 * 1024));
		return {
			isValid: false,
			error: `Ukuran file (${(buffer.length / (1024 * 1024)).toFixed(1)} MiB) melebihi batas maksimum ${limitMb} MiB untuk kategori ${category}.`,
			statusCode: 413,
		};
	}

	if (buffer.length === 0) {
		return {
			isValid: false,
			error: "File upload kosong (0 bytes).",
			statusCode: 422,
		};
	}

	// 2. Validate magic bytes signature
	const format = detectMediaFormat(buffer);
	if (!format) {
		return {
			isValid: false,
			error: "Format file tidak didukung atau rusak. Hanya gambar (JPEG, PNG, WebP, AVIF) dan video latar (MP4, WebM) yang diizinkan.",
			statusCode: 415,
		};
	}

	// 3. Category constraint check
	if (category === "avatar" || category === "cover") {
		if (format.mediaType !== "image") {
			return {
				isValid: false,
				error: `Kategori ${category} hanya menerima format gambar (JPEG, PNG, WebP, AVIF).`,
				statusCode: 422,
			};
		}
	}

	if (category === "background" && format.mediaType === "image" && buffer.length > 15 * 1024 * 1024) {
		return {
			isValid: false,
			error: "Gambar latar belakang maksimal 15 MiB.",
			statusCode: 413,
		};
	}

	const sanitized = sanitizeFilename(rawFilename);
	return {
		isValid: true,
		format,
		sanitizedFilename: sanitized,
	};
}

/**
 * Saves a media object to Cloudflare R2 bucket.
 */
export async function saveMediaToR2(
	bucket: R2Bucket,
	objectKey: string,
	data: Uint8Array | ReadableStream,
	mimeType: string,
	metadata?: Record<string, string>
): Promise<R2Object> {
	return await bucket.put(objectKey, data, {
		httpMetadata: {
			contentType: mimeType,
			cacheControl: "public, max-age=31536000, immutable",
		},
		customMetadata: metadata,
	});
}

/**
 * Retrieves a media object from Cloudflare R2 with optional HTTP Range.
 */
export async function getMediaFromR2(
	bucket: R2Bucket,
	objectKey: string,
	range?: R2Range
): Promise<R2ObjectBody | null> {
	return await bucket.get(objectKey, { range });
}

/**
 * Deletes a media object from Cloudflare R2.
 */
export async function deleteMediaFromR2(bucket: R2Bucket, objectKey: string): Promise<void> {
	await bucket.delete(objectKey);
}

// =============================================================================
// D1 REGISTRY FUNCTIONS
// =============================================================================

/**
 * Registers an uploaded media asset into D1.
 */
export async function createMediaAsset(
	db: D1Database,
	asset: MediaAssetRecord
): Promise<MediaAssetRecord> {
	await db
		.prepare(
			`INSERT INTO media_assets (
				id, object_key, original_filename, media_category, media_type,
				mime_type, size_bytes, width, height, duration_seconds, status,
				created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
		)
		.bind(
			asset.id,
			asset.object_key,
			asset.original_filename,
			asset.media_category,
			asset.media_type,
			asset.mime_type,
			asset.size_bytes,
			asset.width,
			asset.height,
			asset.duration_seconds,
			asset.status,
			asset.created_at,
			asset.updated_at
		)
		.run();

	return asset;
}

/**
 * Fetches a single media asset record by ID.
 */
export async function getMediaAssetById(
	db: D1Database,
	id: string
): Promise<MediaAssetRecord | null> {
	try {
		return await db
			.prepare("SELECT * FROM media_assets WHERE id = ? LIMIT 1;")
			.bind(id)
			.first<MediaAssetRecord>();
	} catch {
		return null;
	}
}

/**
 * Lists media assets with optional category, type, and status filters.
 */
export async function listMediaAssets(
	db: D1Database,
	filters: { category?: string; type?: string; status?: string } = {}
): Promise<MediaAssetRecord[]> {
	try {
		let query = "SELECT * FROM media_assets WHERE 1=1";
		const params: string[] = [];

		if (filters.category && filters.category !== "all") {
			query += " AND media_category = ?";
			params.push(filters.category);
		}
		if (filters.type && filters.type !== "all") {
			query += " AND media_type = ?";
			params.push(filters.type);
		}
		if (filters.status && filters.status !== "all") {
			query += " AND status = ?";
			params.push(filters.status);
		}

		query += " ORDER BY created_at DESC LIMIT 100;";
		const res = await db.prepare(query).bind(...params).all<MediaAssetRecord>();
		return res.results || [];
	} catch {
		return [];
	}
}

/**
 * Checks if a media asset is currently referenced by draft or published configurations.
 */
export async function isMediaReferenced(
	db: D1Database,
	mediaId: string
): Promise<{ referenced: boolean; reason?: string }> {
	try {
		// 1. Check profile avatar references
		const profMatch = await db
			.prepare("SELECT id FROM profile WHERE avatar_media_id = ? LIMIT 1;")
			.bind(mediaId)
			.first<{ id: string }>();

		if (profMatch) {
			return {
				referenced: true,
				reason: `Media ini sedang digunakan sebagai avatar profil (${profMatch.id}).`,
			};
		}

		// 2. Check appearance settings references
		const appMatch = await db
			.prepare(
				`SELECT id, background_media_id, background_poster_media_id, cover_media_id
				 FROM appearance_settings
				 WHERE background_media_id = ?
				    OR background_poster_media_id = ?
				    OR cover_media_id = ?
				 LIMIT 1;`
			)
			.bind(mediaId, mediaId, mediaId)
			.first<{
				id: string;
				background_media_id: string;
				background_poster_media_id: string;
				cover_media_id: string;
			}>();

		if (appMatch) {
			let field = "latar belakang";
			if (appMatch.cover_media_id === mediaId) field = "banner cover";
			if (appMatch.background_poster_media_id === mediaId) field = "poster video";
			return {
				referenced: true,
				reason: `Media ini sedang digunakan pada pengaturan ${field} (${appMatch.id}).`,
			};
		}

		return { referenced: false };
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : "Error querying references";
		return { referenced: true, reason: `Gagal memverifikasi referensi media: ${msg}` };
	}
}

/**
 * Deletes a media asset safely from R2 and D1, ensuring it is not referenced.
 */
export async function deleteMediaAsset(
	db: D1Database,
	bucket: R2Bucket,
	id: string
): Promise<{ success: boolean; error?: string }> {
	const asset = await getMediaAssetById(db, id);
	if (!asset) {
		return { success: false, error: "Media tidak ditemukan." };
	}

	const refCheck = await isMediaReferenced(db, id);
	if (refCheck.referenced) {
		return {
			success: false,
			error: `Tidak dapat menghapus: ${refCheck.reason}`,
		};
	}

	// Delete from R2 storage
	try {
		await deleteMediaFromR2(bucket, asset.object_key);
	} catch (err: unknown) {
		console.warn("Failed to delete object from R2:", err);
	}

	// Delete from D1 registry
	await db.prepare("DELETE FROM media_assets WHERE id = ?;").bind(id).run();

	return { success: true };
}

/**
 * Updates status of a media asset in D1.
 */
export async function updateMediaStatus(
	db: D1Database,
	id: string,
	status: MediaStatus
): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare("UPDATE media_assets SET status = ?, updated_at = ? WHERE id = ?;")
		.bind(status, now, id)
		.run();
}
