#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reactRouterBin = path.resolve(__dirname, "../node_modules/@react-router/dev/bin.js");

console.log("▶ Building application for upstream production (targeting wrangler.json)...");
const extraArgs = process.argv.slice(2);
const build = spawnSync(process.execPath, [reactRouterBin, "build", ...extraArgs], {
	stdio: "inherit",
	env: {
		...process.env,
		WRANGLER_CONFIG: "wrangler.json",
		BUILD_TARGET: "production",
	},
});

process.exit(build.status ?? 0);
