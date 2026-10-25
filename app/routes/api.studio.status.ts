import type { Route } from "./+types/api.studio.status";
import { requireAdmin } from "../lib/auth.server";
import { getDatabaseStatus } from "../lib/db.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare?.env;

	// Require authenticated administrator
	const user = await requireAdmin(request, env);

	// Query D1 database status
	const dbStatus = await getDatabaseStatus(env?.DB);

	return Response.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		authenticatedUser: {
			email: user.email,
			identityType: user.identityType,
		},
		database: {
			isConfigured: dbStatus.isConfigured,
			isReady: dbStatus.isReady,
			tablesCount: dbStatus.tablesCount,
			tables: dbStatus.tables,
			systemCounts: dbStatus.systemCounts,
			error: dbStatus.error,
		},
	});
}
