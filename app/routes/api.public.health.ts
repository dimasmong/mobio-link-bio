import type { Route } from "./+types/api.public.health";

export function loader({ request }: Route.LoaderArgs) {
	if (request.method !== "GET") {
		return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
			status: 405,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Allow": "GET",
				"Cache-Control": "no-store",
			},
		});
	}

	return new Response(
		JSON.stringify({
			status: "ok",
			service: "Personal Link Bio",
			mode: "fun-mvp",
			timestamp: new Date().toISOString(),
		}),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Cache-Control": "no-store",
			},
		},
	);
}
