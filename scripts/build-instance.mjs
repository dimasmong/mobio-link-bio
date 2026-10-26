#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preflightScript = path.resolve(__dirname, "preflight-instance.mjs");
const defaultReactRouterBin = path.resolve(__dirname, "../node_modules/@react-router/dev/bin.js");

export function runBuildInstance(argv = process.argv.slice(2), options = {}) {
	const spawn = options.spawnSyncFn || spawnSync;
	const preflightPath = options.preflightScript || preflightScript;
	const reactRouterPath = options.reactRouterBin || defaultReactRouterBin;

	for (const arg of argv) {
		if (
			arg === "--config" ||
			arg.startsWith("--config=") ||
			arg === "-c" ||
			arg.startsWith("-c=")
		) {
			console.error(`\n❌ Argument Error: Configuration override '${arg}' is forbidden. 'build:instance' strictly targets 'wrangler.instance.json'.\n`);
			return 1;
		}
	}

	console.log("▶ [1/2] Running instance build preflight check...");
	const preflight = spawn(process.execPath, [preflightPath], {
		stdio: options.silent ? "pipe" : "inherit",
	});

	if (preflight.error) {
		console.error("\n❌ Instance build halted: Preflight execution error:", preflight.error.message);
		return 1;
	}

	if (preflight.signal) {
		console.error(`\n❌ Instance build halted: Preflight process terminated by signal ${preflight.signal}.`);
		return 1;
	}

	if (preflight.status !== 0) {
		console.error("\n❌ Instance build halted: Preflight validation failed.");
		console.error("   Fix the issues listed above in 'wrangler.instance.json' before building.\n");
		return preflight.status || 1;
	}

	console.log("▶ [2/2] Building application for independent instance...");
	const build = spawn(process.execPath, [reactRouterPath, "build", ...argv], {
		stdio: options.silent ? "pipe" : "inherit",
		env: {
			...process.env,
			...(options.env || {}),
			WRANGLER_CONFIG: "wrangler.instance.json",
		},
	});

	if (build.error) {
		console.error("\n❌ Instance build failed: Process error:", build.error.message);
		return 1;
	}

	if (build.signal) {
		console.error(`\n❌ Instance build failed: Terminated by signal ${build.signal}.`);
		return 1;
	}

	if (build.status !== 0) {
		console.error(`\n❌ Instance build failed with exit code ${build.status}.`);
		return build.status || 1;
	}

	return 0;
}

const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectCli) {
	const code = runBuildInstance();
	process.exit(code);
}
