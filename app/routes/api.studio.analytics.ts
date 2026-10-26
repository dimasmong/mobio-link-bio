import type { Route } from "./+types/api.studio.analytics";
import { requireAdmin } from "../lib/auth.server";
import { getStudioAnalyticsSummary, resetClickEvents, resetVisitorEvents } from "../lib/analytics.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const url = new URL(request.url);
	const rawRange = url.searchParams.get("range") || "7d";
	const range = (["today", "7d", "30d", "all"].includes(rawRange) ? rawRange : "7d") as
		| "today"
		| "7d"
		| "30d"
		| "all";

	const summary = await getStudioAnalyticsSummary(env.DB, range);
	return Response.json({ status: "ok", analytics: summary });
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare?.env;
	await requireAdmin(request, env);

	if (!env?.DB) {
		return Response.json({ error: "Database D1 tidak terhubung." }, { status: 503 });
	}

	const method = request.method.toUpperCase();
	if (method === "DELETE") {
		const url = new URL(request.url);
		const target = url.searchParams.get("target") || "all";
		if (target === "visitors") {
			await resetVisitorEvents(env.DB);
			return Response.json({ status: "ok", message: "Data kunjungan berhasil direset." });
		} else if (target === "clicks") {
			await resetClickEvents(env.DB);
			return Response.json({ status: "ok", message: "Data klik analitik berhasil direset." });
		} else {
			await Promise.all([resetClickEvents(env.DB), resetVisitorEvents(env.DB)]);
			return Response.json({ status: "ok", message: "Seluruh data analitik berhasil direset." });
		}
	}

	return Response.json({ error: `Metode HTTP '${method}' tidak diizinkan.` }, { status: 405 });
}
