import type { Route } from "./+types/api.public.telemetry";
import { recordPageView, recordInteractionEvent } from "../lib/analytics.server";

export async function action({ request, context }: Route.ActionArgs) {
	if (request.method.toUpperCase() !== "POST") {
		return Response.json({ error: "Metode tidak diizinkan." }, { status: 405 });
	}

	const env = context.cloudflare?.env;
	if (!env?.DB) {
		return Response.json({ error: "Database tidak tersedia." }, { status: 503 });
	}

	try {
		let body: {
			type?: "page_view" | "interaction";
			category?: "explore" | "contact";
			page?: string;
			targetId?: string;
			sessionKey?: string;
			sessionId?: string;
		} = {};

		try {
			body = await request.json();
		} catch {
			return Response.json({ error: "Payload JSON tidak valid." }, { status: 400 });
		}

		const referrer = request.headers.get("referer") || "";
		const userAgent = request.headers.get("user-agent") || "";

		// 1. Handle actual interaction click (Explore item/card click or Contact method click)
		if (body.type === "interaction" || body.category === "explore" || body.category === "contact") {
			const category = body.category === "contact" ? "contact" : "explore";
			await recordInteractionEvent(env.DB, {
				category,
				targetId: body.targetId,
				referrer,
			});

			return Response.json(
				{ status: "ok", type: "interaction", category },
				{
					headers: {
						"Cache-Control": "private, no-store, no-cache, must-revalidate",
					},
				}
			);
		}

		// 2. Handle website page view (Home, Explore tab visit, Contact tab visit)
		const page = body.page || "home";
		const sessionKey = body.sessionKey || body.sessionId || "";

		if (!sessionKey || typeof sessionKey !== "string" || sessionKey.length < 8) {
			return Response.json({ error: "Kunci sesi tidak valid." }, { status: 400 });
		}

		await recordPageView(env.DB, {
			page,
			sessionKey,
			referrer,
			userAgent,
		});

		return Response.json(
			{ status: "ok", type: "page_view", page },
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
