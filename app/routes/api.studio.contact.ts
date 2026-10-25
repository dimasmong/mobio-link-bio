import type { Route } from "./+types/api.studio.contact";
import { requireAdmin } from "../lib/auth.server";
import {
	getContactMethods,
	createDraftContact,
	updateDraftContact,
	deleteDraftContact,
	reorderDraftContacts,
	validateContactDestination,
} from "../lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const methods = await getContactMethods(env.DB, "draft");
	return Response.json({ status: "ok", contactMethods: methods });
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
			return Response.json({ error: "Parameter 'id' wajib diisi untuk menghapus kontak." }, { status: 422 });
		}
		await deleteDraftContact(env.DB, id);
		return Response.json({ status: "ok", message: "Metode kontak berhasil dihapus dari draft." });
	}

	// 2. PUT (Update or Reorder)
	if (method === "PUT") {
		// Reorder operation
		if (Array.isArray(body.orderedIds)) {
			await reorderDraftContacts(env.DB, body.orderedIds as string[]);
			return Response.json({ status: "ok", message: "Urutan metode kontak berhasil diperbarui." });
		}

		// Single item update
		const id = typeof body.id === "string" ? body.id.trim() : "";
		if (!id) {
			return Response.json({ error: "Parameter 'id' wajib diisi." }, { status: 422 });
		}

		const platform = typeof body.platform === "string" ? body.platform : "custom";
		if (body.url !== undefined) {
			const check = validateContactDestination(platform, String(body.url));
			if (!check.isValid) {
				return Response.json({ error: check.error }, { status: 422 });
			}
			body.url = check.normalizedUrl;
			if (!body.value) {
				body.value = check.displayValue;
			}
		}

		await updateDraftContact(env.DB, id, body);
		return Response.json({ status: "ok", message: "Metode kontak berhasil diperbarui di draft." });
	}

	// 3. POST (Create)
	if (method === "POST") {
		const platform = (typeof body.platform === "string" ? body.platform : "email") as
			| "whatsapp"
			| "telegram"
			| "email"
			| "instagram"
			| "custom";
		const labelId = typeof body.label_id === "string" ? body.label_id.trim() : "";
		const labelEn = typeof body.label_en === "string" ? body.label_en.trim() : labelId;
		const rawDest = typeof body.url === "string" ? body.url.trim() : "";

		if (!labelId) {
			return Response.json({ error: "Label kontak wajib diisi." }, { status: 422 });
		}

		const check = validateContactDestination(platform, rawDest);
		if (!check.isValid) {
			return Response.json({ error: check.error }, { status: 422 });
		}

		const newContact = await createDraftContact(env.DB, {
			platform,
			label_id: labelId,
			label_en: labelEn,
			value: typeof body.value === "string" && body.value.trim() ? body.value.trim() : check.displayValue,
			url: check.normalizedUrl,
			is_enabled: body.is_enabled === 0 ? 0 : 1,
		});

		return Response.json({
			status: "ok",
			message: "Metode kontak baru berhasil ditambahkan ke draft.",
			contactMethod: newContact,
		});
	}

	return Response.json({ error: `Method ${method} tidak didukung.` }, { status: 405 });
}
