import type { Route } from "./+types/api.studio.media";
import { requireAdmin } from "../lib/auth.server";
import {
	validateUpload,
	saveMediaToR2,
	createMediaAsset,
	listMediaAssets,
	deleteMediaAsset,
	type MediaCategory,
	type MediaAssetRecord,
} from "../lib/media.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const url = new URL(request.url);
	const category = url.searchParams.get("category") || undefined;
	const type = url.searchParams.get("type") || undefined;
	const status = url.searchParams.get("status") || undefined;

	const assets = await listMediaAssets(env.DB, { category, type, status });
	return Response.json({ status: "ok", assets });
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB || !env?.MEDIA_BUCKET) {
		return Response.json(
			{ error: "Layanan database D1 atau penyimpanan R2 tidak terhubung." },
			{ status: 503 }
		);
	}

	// 1. DELETE request
	if (request.method === "DELETE") {
		let id = "";
		const url = new URL(request.url);
		id = url.searchParams.get("id") || "";

		if (!id) {
			try {
				const body = (await request.json()) as { id?: string };
				id = body.id || "";
			} catch {
				// ignore
			}
		}

		if (!id) {
			return Response.json({ error: "ID media wajib disertakan." }, { status: 400 });
		}

		const deleteRes = await deleteMediaAsset(env.DB, env.MEDIA_BUCKET, id);
		if (!deleteRes.success) {
			return Response.json({ error: deleteRes.error }, { status: 409 });
		}

		return Response.json({ status: "ok", message: "Media berhasil dihapus." });
	}

	// 2. POST (Upload) request
	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return Response.json({ error: "Permintaan harus berupa multipart/form-data." }, { status: 400 });
	}

	const file = formData.get("file");
	if (!file || typeof file === "string" || !(file instanceof File)) {
		return Response.json({ error: "File upload tidak ditemukan." }, { status: 422 });
	}

	const rawCategory = (formData.get("category") || "general").toString().toLowerCase();
	const category: MediaCategory = ["avatar", "cover", "background", "general"].includes(rawCategory)
		? (rawCategory as MediaCategory)
		: "general";

	const buffer = new Uint8Array(await file.arrayBuffer());
	const validation = validateUpload(buffer, file.name, category);

	if (!validation.isValid || !validation.format || !validation.sanitizedFilename) {
		return Response.json(
			{ error: validation.error || "Validasi file gagal." },
			{ status: validation.statusCode || 400 }
		);
	}

	const id = crypto.randomUUID();
	const objectKey = `media/${category}/${Date.now()}-${id}.${validation.format.extension}`;
	const now = new Date().toISOString();

	try {
		// Save binary into Cloudflare R2
		await saveMediaToR2(
			env.MEDIA_BUCKET,
			objectKey,
			buffer,
			validation.format.mimeType,
			{
				originalFilename: validation.sanitizedFilename,
				mediaId: id,
			}
		);

		// Record metadata into Cloudflare D1
		const assetRecord: MediaAssetRecord = {
			id,
			object_key: objectKey,
			original_filename: validation.sanitizedFilename,
			media_category: category,
			media_type: validation.format.mediaType,
			mime_type: validation.format.mimeType,
			size_bytes: buffer.length,
			width: null,
			height: null,
			duration_seconds: null,
			status: "draft",
			created_at: now,
			updated_at: now,
		};

		await createMediaAsset(env.DB, assetRecord);

		return Response.json(
			{
				status: "ok",
				message: "Media berhasil diupload.",
				asset: assetRecord,
			},
			{ status: 201 }
		);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Gagal mengunggah media ke R2";
		return Response.json({ error: message }, { status: 500 });
	}
}
