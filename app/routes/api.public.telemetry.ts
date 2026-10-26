import type { Route } from "./+types/api.public.telemetry";
import { recordPageView } from "../lib/analytics.server";

export async function action({ request, context }: Route.ActionArgs) {
	if (request.method.toUpperCase() !== "POST") {
		return Response.json({ error: "Metode tidak diizinkan." }, { status: 405 });
	}

	const env = context.cloudflare?.env;
	if (!env?.DB) {
		return Response.json({ error: "Database tidak tersedia." }, { status: 503 });
	}

	try {
		let body: { page?: string; sessionKey?: string } = {};
		try {
			body = await request.json();
		} catch {
			return Response.json({ error: "Payload JSON tidak valid." }, { status: 400 });
		}

		const page = body.page || "home";
		const sessionKey = body.sessionKey || (body as { sessionId?: string }).sessionId || "";

		if (!sessionKey || typeof sessionKey !== "string" || sessionKey.length < 8) {
			return Response.json({ error: "Kunci sesi tidak valid." }, { status: 400 });
		}

		const referrer = request.headers.get("referer") || "";
		const userAgent = request.headers.get("user-agent") || "";

		await recordPageView(env.DB, {
			page,
			sessionKey,
			referrer,
			userAgent,
		});

		return Response.json(
			{ status: "ok" },
			{
				headers: {
					"Cache-Control": "private, no-store, no-cache, must-revalidate",
				},
			}
		);
	} catch (err: unknown) {
		console.warn("Telemetry recording error:", err);
		return Response.json({ error: "Gagal mencatat telemetri." }, { status: 500 });
	}
}
