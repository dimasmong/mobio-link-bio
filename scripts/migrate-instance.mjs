#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preflightScript = path.resolve(__dirname, "preflight-instance.mjs");
const wranglerBin = path.resolve(__dirname, "../node_modules/wrangler/bin/wrangler.js");

const args = process.argv.slice(2);
const isRemote = args.includes("--remote") || !args.includes("--local");
const targetMode = isRemote ? "--remote" : "--local";

console.log(`▶ [1/2] Running migration preflight check (${targetMode})...`);
const preflight = spawnSync(process.execPath, [preflightScript], {
	stdio: "inherit",
});

if (preflight.status !== 0) {
	console.error(`\n❌ Instance migration halted: Preflight validation failed.`);
	console.error("   Fix the issues listed above in 'wrangler.instance.json' before applying migrations.\n");
	process.exit(preflight.status ?? 1);
}

console.log(`▶ [2/2] Applying D1 migrations (${targetMode}) for independent instance...`);
const extraArgs = args.filter((a) => a !== "--remote" && a !== "--local");
const migrate = spawnSync(
	process.execPath,
	[
		wranglerBin,
		"d1",
		"migrations",
		"apply",
		"DB",
		targetMode,
		"--config",
		"wrangler.instance.json",
		...extraArgs,
	],
	{
		stdio: "inherit",
		env: {
			...process.env,
			WRANGLER_CONFIG: "wrangler.instance.json",
		},
	}
);

process.exit(migrate.status ?? 0);
