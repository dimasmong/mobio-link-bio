import type { Route } from "./+types/api.studio.discard";
import { requireAdmin } from "../lib/auth.server";
import { discardAllDrafts } from "../lib/db.server";

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	if (request.method.toUpperCase() !== "POST") {
		return Response.json({ error: "Method not allowed. Gunakan POST." }, { status: 405 });
	}

	try {
		await discardAllDrafts(env.DB);
		return Response.json({
			status: "ok",
			message: "Seluruh perubahan draft berhasil dibatalkan dan direset ke versi publik saat ini.",
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Gagal membatalkan perubahan draft.";
		return Response.json({ error: message }, { status: 500 });
	}
}
