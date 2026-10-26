#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preflightScript = path.resolve(__dirname, "preflight-instance.mjs");
const wranglerBin = path.resolve(__dirname, "../node_modules/wrangler/bin/wrangler.js");

console.log("▶ [1/2] Running deployment preflight check for independent instance...");
const preflight = spawnSync(process.execPath, [preflightScript], {
	stdio: "inherit",
});

if (preflight.status !== 0) {
	console.error("\n❌ Deployment halted: Preflight validation failed.");
	console.error("   Fix the issues listed above in 'wrangler.instance.json' before deploying.\n");
	process.exit(preflight.status ?? 1);
}

console.log("▶ [2/2] Deploying independent MOBIO instance...");
const extraArgs = process.argv.slice(2);
const deploy = spawnSync(
	process.execPath,
	[wranglerBin, "deploy", "--config", "wrangler.instance.json", ...extraArgs],
	{
		stdio: "inherit",
		env: {
			...process.env,
			WRANGLER_CONFIG: "wrangler.instance.json",
		},
	}
);

process.exit(deploy.status ?? 0);
