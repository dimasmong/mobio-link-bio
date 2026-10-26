import type { Route } from "./+types/api.studio.explore";
import { requireAdmin } from "../lib/auth.server";
import {
	getExploreItems,
	createDraftExploreItem,
	updateDraftExploreItem,
	deleteDraftExploreItem,
	duplicateDraftExploreItem,
	reorderDraftExploreItems,
	getExploreCategories,
	createDraftExploreCategory,
	updateDraftExploreCategory,
	deleteDraftExploreCategory,
	reorderDraftExploreCategories,
	getExploreSubcategories,
	createDraftExploreSubcategory,
	updateDraftExploreSubcategory,
	deleteDraftExploreSubcategory,
	reorderDraftExploreSubcategories,
	validateUrl,
	type ExploreBlockType,
} from "../lib/db.server";

const VALID_EXPLORE_TYPES: ExploreBlockType[] = [
	"gallery",
	"image",
	"video",
	"music",
	"game",
	"review",
	"project",
	"note",
	"link",
	"custom",
];

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const explore = await getExploreItems(env.DB, "draft");
	const categories = await getExploreCategories(env.DB, "draft");
	const subcategories = await getExploreSubcategories(env.DB, "draft");
	return Response.json({ status: "ok", explore, categories, subcategories });
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

	// --- Category Actions (Single-Tier Customizable Main Categories) ---
	if (body.action === "create_category") {
		const nameId = typeof body.name_id === "string" ? body.name_id.trim() : "";
		const nameEn = typeof body.name_en === "string" ? body.name_en.trim() : nameId;
		if (!nameId) {
			return Response.json({ error: "Nama kategori (ID) wajib diisi." }, { status: 422 });
		}
		const cat = await createDraftExploreCategory(env.DB, {
			id: typeof body.id === "string" ? body.id.trim() : undefined,
			name_id: nameId,
			name_en: nameEn,
			icon: typeof body.icon === "string" ? body.icon.trim() : "folder",
			color: typeof body.color === "string" ? body.color.trim() : "#8b5cf6",
			is_enabled: typeof body.is_enabled === "number" ? body.is_enabled : 1,
		});
		return Response.json({ status: "ok", message: "Kategori berhasil dibuat.", category: cat }, { status: 201 });
	}

	if (body.action === "update_category") {
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi." }, { status: 422 });
		}
		await updateDraftExploreCategory(env.DB, id, body);
		return Response.json({ status: "ok", message: "Kategori berhasil diperbarui." });
	}

	if (body.action === "delete_category") {
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi." }, { status: 422 });
		}
		await deleteDraftExploreCategory(env.DB, id);
		return Response.json({ status: "ok", message: "Kategori berhasil dihapus." });
	}

	if (body.action === "reorder_categories") {
		if (Array.isArray(body.orderedIds)) {
			await reorderDraftExploreCategories(env.DB, body.orderedIds as string[]);
		}
		return Response.json({ status: "ok", message: "Urutan kategori berhasil diperbarui." });
	}

	// --- Subcategory Actions (Can be invoked via POST/PUT/DELETE with body.action) ---
	if (body.action === "create_subcategory") {
		const category = typeof body.category === "string" ? body.category.trim() : "all";
		const labelId = typeof body.label_id === "string" ? body.label_id.trim() : "";
		const labelEn = typeof body.label_en === "string" ? body.label_en.trim() : labelId;
		if (!labelId) {
			return Response.json({ error: "Label subkategori wajib diisi." }, { status: 422 });
		}
		const subcat = await createDraftExploreSubcategory(env.DB, {
			category,
			label_id: labelId,
			label_en: labelEn,
			icon: typeof body.icon === "string" ? body.icon.trim() : "",
			color: typeof body.color === "string" ? body.color.trim() : "",
		});
		return Response.json({ status: "ok", message: "Subkategori berhasil dibuat.", subcategory: subcat }, { status: 201 });
	}

	if (body.action === "update_subcategory") {
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi." }, { status: 422 });
		}
		await updateDraftExploreSubcategory(env.DB, id, body);
		return Response.json({ status: "ok", message: "Subkategori berhasil diperbarui." });
	}

	if (body.action === "delete_subcategory") {
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi." }, { status: 422 });
		}
		await deleteDraftExploreSubcategory(env.DB, id);
		return Response.json({ status: "ok", message: "Subkategori berhasil dihapus." });
	}

	if (body.action === "reorder_subcategories") {
		if (Array.isArray(body.orderedIds)) {
			await reorderDraftExploreSubcategories(env.DB, body.orderedIds as string[]);
			return Response.json({ status: "ok", message: "Urutan subkategori berhasil diperbarui." });
		}
		return Response.json({ error: "Daftar orderedIds wajib disertakan." }, { status: 422 });
	}

	// 1. DELETE Explore Item
	if (method === "DELETE") {
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi untuk menghapus item Explore." }, { status: 422 });
		}
		await deleteDraftExploreItem(env.DB, id);
		return Response.json({ status: "ok", message: "Item Explore berhasil dihapus dari draft." });
	}

	// 2. PUT (Update, Duplicate, or Reorder Explore Item)
	if (method === "PUT") {
		// Reorder operation
		if (Array.isArray(body.orderedIds)) {
			await reorderDraftExploreItems(env.DB, body.orderedIds as string[]);
			return Response.json({ status: "ok", message: "Urutan item Explore berhasil diperbarui." });
		}

		// Duplicate operation
		if (body.action === "duplicate") {
			const id = typeof body.id === "string" ? body.id.trim() : "";
			if (!id) {
				return Response.json({ error: "Parameter 'id' wajib diisi untuk duplikasi item." }, { status: 422 });
			}
			const duplicated = await duplicateDraftExploreItem(env.DB, id);
			return Response.json({ status: "ok", message: "Item Explore berhasil diduplikasi.", item: duplicated });
		}

		// Single item update
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi." }, { status: 422 });
		}

		// Validate URL if supplied
		if (body.url !== undefined && String(body.url).trim() !== "") {
			const check = validateUrl(String(body.url));
			if (!check.isValid) {
				return Response.json({ error: check.error }, { status: 422 });
			}
			body.url = check.normalizedUrl;
		}

		// Validate type if supplied
		if (body.type !== undefined) {
			const typeStr = String(body.type).trim().toLowerCase() as ExploreBlockType;
			if (!VALID_EXPLORE_TYPES.includes(typeStr)) {
				return Response.json(
					{ error: `Tipe '${body.type}' tidak valid. Pilihan: ${VALID_EXPLORE_TYPES.join(", ")}` },
					{ status: 422 }
				);
			}
			body.type = typeStr;
		}

		// Validate metadata JSON if supplied
		if (body.metadata_json !== undefined && typeof body.metadata_json === "string") {
			try {
				JSON.parse(body.metadata_json);
			} catch {
				return Response.json({ error: "Metadata JSON tidak valid formatnya." }, { status: 422 });
			}
		}

		await updateDraftExploreItem(env.DB, id, body);
		return Response.json({ status: "ok", message: "Item Explore berhasil diperbarui di draft." });
	}

	// 3. POST (Create Explore Item)
	if (method === "POST") {
		const typeStr = typeof body.type === "string" ? body.type.trim().toLowerCase() : "custom";
		const titleId = typeof body.title_id === "string" ? body.title_id.trim() : "";
		const titleEn = typeof body.title_en === "string" ? body.title_en.trim() : titleId;
		const rawUrl = typeof body.url === "string" ? body.url.trim() : "";

		if (!titleId) {
			return Response.json({ error: "Judul item Explore wajib diisi." }, { status: 422 });
		}

		if (!VALID_EXPLORE_TYPES.includes(typeStr as ExploreBlockType)) {
			return Response.json(
				{ error: `Tipe '${typeStr}' tidak valid. Pilihan: ${VALID_EXPLORE_TYPES.join(", ")}` },
				{ status: 422 }
			);
		}

		let finalUrl = "";
		if (rawUrl) {
			const check = validateUrl(rawUrl);
			if (!check.isValid) {
				return Response.json({ error: check.error }, { status: 422 });
			}
			finalUrl = check.normalizedUrl;
		}

		let metadataJson = "{}";
		if (body.metadata_json) {
			if (typeof body.metadata_json === "string") {
				try {
					JSON.parse(body.metadata_json);
					metadataJson = body.metadata_json;
				} catch {
					return Response.json({ error: "Metadata JSON tidak valid." }, { status: 422 });
				}
			} else if (typeof body.metadata_json === "object") {
				metadataJson = JSON.stringify(body.metadata_json);
			}
		}

		const newItem = await createDraftExploreItem(env.DB, {
			type: typeStr,
			title_id: titleId,
			title_en: titleEn,
			subtitle_id: typeof body.subtitle_id === "string" ? body.subtitle_id.trim() : "",
			subtitle_en: typeof body.subtitle_en === "string" ? body.subtitle_en.trim() : "",
			description_id: typeof body.description_id === "string" ? body.description_id.trim() : "",
			description_en: typeof body.description_en === "string" ? body.description_en.trim() : "",
			url: finalUrl,
			cover_image: typeof body.cover_image === "string" ? body.cover_image.trim() : "",
			badge_id: typeof body.badge_id === "string" ? body.badge_id.trim() : "",
			badge_en: typeof body.badge_en === "string" ? body.badge_en.trim() : "",
			metadata_json: metadataJson,
			category: typeof body.category === "string" ? body.category.trim() : "all",
			subcategory_id: typeof body.subcategory_id === "string" ? body.subcategory_id.trim() : "",
			is_enabled: body.is_enabled === 0 ? 0 : 1,
		});

		return Response.json(
			{ status: "ok", message: "Item Explore berhasil ditambahkan ke draft.", item: newItem },
			{ status: 201 }
		);
	}

	return Response.json({ error: `Metode HTTP '${method}' tidak diizinkan.` }, { status: 405 });
}
