import type { Route } from "./+types/api.studio.publish";
import { requireAdmin } from "../lib/auth.server";
import { publishAllDrafts, getPublishMetadata } from "../lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const metadata = await getPublishMetadata(env.DB);
	return Response.json({ status: "ok", metadata });
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare?.env;
	const admin = await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	if (request.method.toUpperCase() !== "POST") {
		return Response.json({ error: "Method not allowed. Gunakan POST." }, { status: 405 });
	}

	try {
		const result = await publishAllDrafts(env.DB, admin.email || "admin");
		return Response.json({
			status: "ok",
			message: "Seluruh perubahan draft berhasil dipublikasikan ke publik.",
			...result,
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Gagal mempublikasikan perubahan.";
		return Response.json({ error: message }, { status: 500 });
	}
}
