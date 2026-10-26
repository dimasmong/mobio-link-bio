import fs from "node:fs";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Select instance configuration if available, otherwise fall back to production wrangler.json
const configPath =
	process.env.WRANGLER_CONFIG ||
	(fs.existsSync("./wrangler.instance.json")
		? "./wrangler.instance.json"
		: undefined);

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
