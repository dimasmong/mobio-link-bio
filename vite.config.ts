import fs from "node:fs";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Resolve Wrangler configuration path:
// 1. Explicit WRANGLER_CONFIG environment variable takes top precedence
// 2. Explicit BUILD_TARGET=production forces production wrangler.json (undefined for cloudflare plugin)
// 3. Local wrangler.instance.json if present
// 4. Default fallback to production wrangler.json (undefined for cloudflare plugin)
function resolveWranglerConfig(): string | undefined {
	if (process.env.WRANGLER_CONFIG) {
		return process.env.WRANGLER_CONFIG;
	}
	if (
		process.env.BUILD_TARGET === "production" ||
		process.env.BUILD_TARGET === "prod"
	) {
		return "./wrangler.json";
	}
	if (fs.existsSync("./wrangler.instance.json")) {
		return "./wrangler.instance.json";
	}
	return undefined;
}

const configPath = resolveWranglerConfig();

export default defineConfig({
	plugins: [
		cloudflare({
			configPath,
			viteEnvironment: { name: "ssr" },
		}),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
	],
});
