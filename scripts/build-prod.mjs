#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultReactRouterBin = path.resolve(__dirname, "../node_modules/@react-router/dev/bin.js");

export function runBuildProd(argv = process.argv.slice(2), options = {}) {
	const spawn = options.spawnSyncFn || spawnSync;
	const reactRouterPath = options.reactRouterBin || defaultReactRouterBin;

	console.log("▶ Building application for upstream production (targeting wrangler.json)...");
	const build = spawn(process.execPath, [reactRouterPath, "build", ...argv], {
		stdio: options.silent ? "pipe" : "inherit",
		env: {
			...process.env,
			...(options.env || {}),
			WRANGLER_CONFIG: "wrangler.json",
			BUILD_TARGET: "production",
		},
	});

	if (build.error) {
		console.error("\n❌ Production build failed: Process error:", build.error.message);
		return 1;
	}

	if (build.signal) {
		console.error(`\n❌ Production build failed: Terminated by signal ${build.signal}.`);
		return 1;
	}

	if (build.status !== 0) {
		console.error(`\n❌ Production build failed with exit code ${build.status}.`);
		return build.status || 1;
	}

	return 0;
}

const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectCli) {
	const code = runBuildProd();
	process.exit(code);
}
