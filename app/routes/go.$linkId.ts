import type { Route } from "./+types/go.$linkId";
import { recordClickEvent } from "../lib/analytics.server";
import { validateUrl } from "../lib/db.server";

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;
	const linkId = params.linkId?.trim();

	if (!linkId) {
		return new Response("ID tautan tidak valid.", {
			status: 400,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}

	if (!env?.DB) {
		return new Response("Database tidak terhubung.", {
			status: 503,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}

	// 1. Resolve destination from published links table
	let linkRecord: { id: string; url: string; is_enabled: number } | null = null;
	try {
		linkRecord = await env.DB
			.prepare("SELECT id, url, is_enabled FROM links WHERE id = ? LIMIT 1;")
			.bind(linkId)
			.first<{ id: string; url: string; is_enabled: number }>();
	} catch (err: unknown) {
		console.error("Gagal membaca tautan dari database:", err);
		return new Response("Kesalahan membaca tautan.", { status: 500 });
	}

	// 2. Reject if link does not exist or is disabled
	if (!linkRecord || !linkRecord.is_enabled) {
		return new Response(
			"Tautan tidak ditemukan, sedang dinonaktifkan, atau belum dipublikasikan.",
			{
				status: 404,
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"Cache-Control": "no-store, private",
				},
			}
		);
	}

	// 3. Strict protocol validation & open-redirect prevention
	// Only use the URL from the database, never from query parameters
	const validation = validateUrl(linkRecord.url);
	if (!validation.isValid || !validation.normalizedUrl) {
		return new Response("URL tujuan tautan tidak aman.", {
			status: 400,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}

	const destinationUrl = validation.normalizedUrl;

	// 4. Asynchronously record click telemetry
	try {
		const referrer = request.headers.get("referer") || "";
		const userAgent = request.headers.get("user-agent") || "";
		const country = (request as unknown as { cf?: { country?: string } }).cf?.country || "";

		// We record the click event into D1
		await recordClickEvent(env.DB, {
			linkId,
			referrer,
			userAgent,
			country,
		});
	} catch (err: unknown) {
		console.warn("Failed recording click event:", err);
	}

	// 5. Return HTTP 302 Redirect with no-store cache headers
	return new Response(null, {
		status: 302,
		headers: {
			Location: destinationUrl,
			"Cache-Control": "no-store, no-cache, must-revalidate, private",
			Pragma: "no-cache",
			Expires: "0",
		},
	});
}
