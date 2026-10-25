import type { Route } from "./+types/api.studio.links";
import { requireAdmin } from "../lib/auth.server";
import {
	getLinks,
	createDraftLink,
	updateDraftLink,
	deleteDraftLink,
	reorderDraftLinks,
	validateUrl,
} from "../lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const links = await getLinks(env.DB, "draft");
	return Response.json({ status: "ok", links });
}

function validateIconFields(body: Record<string, unknown>): {
	icon_type: "preset" | "upload" | "url";
	icon_url: string;
	icon_media_id: string;
	icon: string;
	error?: string;
} {
	const rawType = typeof body.icon_type === "string" ? body.icon_type.trim().toLowerCase() : "preset";
	const icon_type: "preset" | "upload" | "url" = ["preset", "upload", "url"].includes(rawType)
		? (rawType as "preset" | "upload" | "url")
		: "preset";

	let icon_url = typeof body.icon_url === "string" ? body.icon_url.trim() : "";
	const icon_media_id = typeof body.icon_media_id === "string" ? body.icon_media_id.trim() : "";
	const icon = typeof body.icon === "string" ? body.icon.trim() : "globe";

	if (icon_type === "url" && icon_url) {
		try {
			const parsed = new URL(icon_url);
			if (parsed.protocol !== "https:") {
				return {
					icon_type,
					icon_url: "",
					icon_media_id,
					icon,
					error: "URL ikon harus menggunakan protokol https:// yang aman.",
				};
			}
			icon_url = parsed.toString();
		} catch {
			return {
				icon_type,
				icon_url: "",
				icon_media_id,
				icon,
				error: "URL ikon yang dimasukkan tidak valid.",
			};
		}
	}

	return { icon_type, icon_url, icon_media_id, icon };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Format request JSON tidak valid." }, { status: 400 });
	}

	const method = request.method.toUpperCase();

	// 1. DELETE
	if (method === "DELETE") {
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi untuk menghapus tautan." }, { status: 422 });
		}
		await deleteDraftLink(env.DB, id);
		return Response.json({ status: "ok", message: "Tautan berhasil dihapus dari draft." });
	}

	// 2. PUT (Update or Reorder)
	if (method === "PUT") {
		// Reorder operation
		if (Array.isArray(body.orderedIds)) {
			await reorderDraftLinks(env.DB, body.orderedIds as string[]);
			return Response.json({ status: "ok", message: "Urutan tautan berhasil diperbarui." });
		}

		// Single item update
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi." }, { status: 422 });
		}

		if (body.url !== undefined) {
			const check = validateUrl(String(body.url));
			if (!check.isValid) {
				return Response.json({ error: check.error }, { status: 422 });
			}
			body.url = check.normalizedUrl;
		}

		if (
			body.icon_type !== undefined ||
			body.icon_url !== undefined ||
			body.icon_media_id !== undefined ||
			body.icon !== undefined
		) {
			const iconValidation = validateIconFields(body);
			if (iconValidation.error) {
				return Response.json({ error: iconValidation.error }, { status: 422 });
			}
			body.icon_type = iconValidation.icon_type;
			body.icon_url = iconValidation.icon_url;
			body.icon_media_id = iconValidation.icon_media_id;
			body.icon = iconValidation.icon;
		}

		await updateDraftLink(env.DB, id, body);
		return Response.json({ status: "ok", message: "Tautan berhasil diperbarui di draft." });
	}

	// 3. POST (Create)
	if (method === "POST") {
		const titleId = typeof body.title_id === "string" ? body.title_id.trim() : "";
		const titleEn = typeof body.title_en === "string" ? body.title_en.trim() : titleId;
		const rawUrl = typeof body.url === "string" ? body.url.trim() : "";

		if (!titleId) {
			return Response.json({ error: "Judul tautan wajib diisi." }, { status: 422 });
		}

		const check = validateUrl(rawUrl);
		if (!check.isValid) {
			return Response.json({ error: check.error }, { status: 422 });
		}

		const iconValidation = validateIconFields(body);
		if (iconValidation.error) {
			return Response.json({ error: iconValidation.error }, { status: 422 });
		}

		const newLink = await createDraftLink(env.DB, {
			title_id: titleId,
			title_en: titleEn,
			description_id: typeof body.description_id === "string" ? body.description_id.trim() : "",
			description_en: typeof body.description_en === "string" ? body.description_en.trim() : "",
			url: check.normalizedUrl,
			platform: typeof body.platform === "string" ? body.platform.trim() : "website",
			icon: iconValidation.icon,
			icon_type: iconValidation.icon_type,
			icon_url: iconValidation.icon_url,
			icon_media_id: iconValidation.icon_media_id,
			is_enabled: body.is_enabled === 0 ? 0 : 1,
		});

		return Response.json({
			status: "ok",
			message: "Tautan baru berhasil ditambahkan ke draft.",
			link: newLink,
		});
	}

	return Response.json({ error: `Method ${method} tidak didukung.` }, { status: 405 });
}
