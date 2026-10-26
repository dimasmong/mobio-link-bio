#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preflightScript = path.resolve(__dirname, "preflight-instance.mjs");
const reactRouterBin = path.resolve(__dirname, "../node_modules/@react-router/dev/bin.js");

console.log("▶ [1/2] Running instance build preflight check...");
const preflight = spawnSync(process.execPath, [preflightScript], {
	stdio: "inherit",
});

if (preflight.status !== 0) {
	console.error("\n❌ Instance build halted: Preflight validation failed.");
	console.error("   Fix the issues listed above in 'wrangler.instance.json' before building.\n");
	process.exit(preflight.status ?? 1);
}

console.log("▶ [2/2] Building application for independent instance...");
const extraArgs = process.argv.slice(2);
const build = spawnSync(process.execPath, [reactRouterBin, "build", ...extraArgs], {
	stdio: "inherit",
	env: {
		...process.env,
		WRANGLER_CONFIG: "wrangler.instance.json",
	},
});

process.exit(build.status ?? 0);
