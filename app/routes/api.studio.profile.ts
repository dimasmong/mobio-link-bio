import type { Route } from "./+types/api.studio.profile";
import { requireAdmin } from "../lib/auth.server";
import { getProfileRecord, saveDraftProfile, validateUrl } from "../lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const profile = await getProfileRecord(env.DB, "draft");
	return Response.json({ status: "ok", profile });
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	let body: {
		name?: string;
		handle?: string;
		avatar_url?: string;
		location_id?: string;
		location_en?: string;
		bio_id?: string;
		bio_en?: string;
	};

	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Format request JSON tidak valid." }, { status: 400 });
	}

	const name = (body.name || "").trim();
	if (name.length === 0) {
		return Response.json({ error: "Nama tampilan (Display name) wajib diisi." }, { status: 422 });
	}
	if (name.length > 80) {
		return Response.json({ error: "Nama tampilan maksimal 80 karakter." }, { status: 422 });
	}

	let handle = (body.handle || "").trim();
	if (handle.length === 0) {
		return Response.json({ error: "Username / handle wajib diisi." }, { status: 422 });
	}
	if (!handle.startsWith("@")) {
		handle = `@${handle}`;
	}
	if (handle.length > 50) {
		return Response.json({ error: "Username maksimal 50 karakter." }, { status: 422 });
	}

	const avatarUrl = (body.avatar_url || "").trim();
	if (avatarUrl.length > 0) {
		const check = validateUrl(avatarUrl);
		if (!check.isValid) {
			return Response.json({ error: `Avatar URL tidak valid: ${check.error}` }, { status: 422 });
		}
	}

	await saveDraftProfile(env.DB, {
		name,
		handle,
		avatar_url: avatarUrl,
		location_id: (body.location_id || "").trim(),
		location_en: (body.location_en || "").trim(),
		bio_id: (body.bio_id || "").trim(),
		bio_en: (body.bio_en || "").trim(),
	});

	return Response.json({
		status: "ok",
		message: "Draft profil berhasil disimpan.",
	});
}
