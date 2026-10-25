import type { Route } from "./+types/api.studio.appearance";
import { requireAdmin } from "../lib/auth.server";
import {
	getAppearanceRecord,
	saveDraftAppearance,
	resetDraftAppearance,
	type AppearanceRecord,
} from "../lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const appearance = await getAppearanceRecord(env.DB, "draft");
	return Response.json({ status: "ok", appearance });
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	let body: {
		action?: "save" | "reset";
		appearance?: Partial<AppearanceRecord>;
	};

	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Format request JSON tidak valid." }, { status: 400 });
	}

	if (body.action === "reset") {
		const appearance = await resetDraftAppearance(env.DB);
		return Response.json({
			status: "ok",
			message: "Tampilan berhasil direset ke pengaturan default.",
			appearance,
		});
	}

	const incoming = (body.appearance || body || {}) as Partial<AppearanceRecord>;

	// Validate design tokens and bounds
	if (incoming.accent_color && !/^#([0-9a-fA-F]{3,8})$|^rgba?\(/.test(incoming.accent_color.trim())) {
		return Response.json({ error: "Format warna aksen tidak valid." }, { status: 422 });
	}

	if (
		incoming.background_type &&
		!["gradient", "image", "video"].includes(incoming.background_type)
	) {
		return Response.json(
			{ error: "Tipe background harus salah satu dari: gradient, image, video." },
			{ status: 422 }
		);
	}

	if (incoming.glass_opacity !== undefined) {
		const val = Number(incoming.glass_opacity);
		if (isNaN(val) || val < 0 || val > 1) {
			return Response.json({ error: "Opasitas liquid glass harus antara 0 dan 1." }, { status: 422 });
		}
	}

	if (incoming.background_scale !== undefined) {
		const val = Number(incoming.background_scale);
		if (isNaN(val) || val < 0.2 || val > 5) {
			return Response.json({ error: "Skala background harus antara 0.2 dan 5." }, { status: 422 });
		}
	}

	const saved = await saveDraftAppearance(env.DB, incoming);

	return Response.json({
		status: "ok",
		message: "Draft pengaturan tampilan berhasil disimpan.",
		appearance: saved,
	});
}
