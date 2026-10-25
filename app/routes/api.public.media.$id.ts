import type { Route } from "./+types/api.public.media.$id";
import { getMediaAssetById } from "../lib/media.server";

function parseRangeHeader(
	rangeHeader: string | null,
	totalSize: number
): { offset: number; length: number; start: number; end: number } | null {
	if (!rangeHeader || !rangeHeader.startsWith("bytes=")) return null;
	const parts = rangeHeader.replace("bytes=", "").split("-");
	let start = parseInt(parts[0], 10);
	let end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

	if (isNaN(start)) {
		const suffix = parseInt(parts[1], 10);
		if (isNaN(suffix)) return null;
		start = Math.max(0, totalSize - suffix);
		end = totalSize - 1;
	}

	if (isNaN(end) || end >= totalSize) {
		end = totalSize - 1;
	}

	if (start > end || start >= totalSize) return null;

	return {
		offset: start,
		length: end - start + 1,
		start,
		end,
	};
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;

	if (!env?.DB || !env?.MEDIA_BUCKET) {
		return new Response("Service Unavailable", { status: 503 });
	}

	const id = params.id;
	if (!id) {
		return new Response("ID media wajib disertakan.", { status: 400 });
	}

	const asset = await getMediaAssetById(env.DB, id);
	if (!asset) {
		return new Response("Media tidak ditemukan.", { status: 404 });
	}

	// Strictly enforce publication privacy: only published assets can be served publicly
	if (asset.status !== "published") {
		return new Response("Media belum dipublikasikan.", { status: 403 });
	}

	const rangeHeader = request.headers.get("Range");
	const range = parseRangeHeader(rangeHeader, asset.size_bytes);

	let r2Object;
	if (range) {
		r2Object = await env.MEDIA_BUCKET.get(asset.object_key, {
			range: { offset: range.offset, length: range.length },
		});
	} else {
		r2Object = await env.MEDIA_BUCKET.get(asset.object_key);
	}

	if (!r2Object || !r2Object.body) {
		return new Response("Objek media tidak ditemukan di penyimpanan R2.", { status: 404 });
	}

	const headers = new Headers();
	headers.set("Content-Type", asset.mime_type);
	headers.set("Accept-Ranges", "bytes");
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Cache-Control", "public, max-age=31536000, immutable");

	if (range) {
		headers.set("Content-Range", `bytes ${range.start}-${range.end}/${asset.size_bytes}`);
		headers.set("Content-Length", range.length.toString());
		return new Response(r2Object.body, {
			status: 206,
			headers,
		});
	}

	headers.set("Content-Length", asset.size_bytes.toString());
	return new Response(r2Object.body, {
		status: 200,
		headers,
	});
}
