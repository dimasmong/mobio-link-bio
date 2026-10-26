#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preflightScript = path.resolve(__dirname, "preflight-instance.mjs");
const defaultWranglerBin = path.resolve(__dirname, "../node_modules/wrangler/bin/wrangler.js");

export function validateDeployArgs(args) {
	const allowedFlags = new Set(["--dry-run"]);
	const forwarded = [];
	const seenFlags = new Set();

	for (const arg of args) {
		if (arg === "--") {
			return {
				valid: false,
				error: "Bare argument delimiter '--' is not supported in 'deploy:instance'.",
			};
		}

		// Reject any attempt to pass config overrides
		if (
			arg === "--config" ||
			arg.startsWith("--config=") ||
			arg === "-c" ||
			arg.startsWith("-c=")
		) {
			return {
				valid: false,
				error: `Configuration override '${arg}' is forbidden. 'deploy:instance' strictly targets 'wrangler.instance.json'.`,
			};
		}

		if (arg.startsWith("-")) {
			const flagName = arg.split("=")[0];
			if (!allowedFlags.has(flagName)) {
				return {
					valid: false,
					error: `Unsupported flag '${arg}'. 'deploy:instance' only accepts '--dry-run' or no arguments.`,
				};
			}
			if (arg.includes("=")) {
				return {
					valid: false,
					error: `Flag assignments like '${arg}' are not supported. Use '--dry-run' without '='.`,
				};
			}
			if (seenFlags.has(flagName)) {
				return {
					valid: false,
					error: `Duplicate flag '${flagName}' detected.`,
				};
			}
			seenFlags.add(flagName);
			forwarded.push(arg);
		} else {
			return {
				valid: false,
				error: `Positional argument '${arg}' is not supported. Deployment targets are defined exclusively in 'wrangler.instance.json'.`,
			};
		}
	}

	return { valid: true, forwarded };
}

export function runDeployInstance(argv = process.argv.slice(2), options = {}) {
	const spawn = options.spawnSyncFn || spawnSync;
	const preflightPath = options.preflightScript || preflightScript;
	const wranglerPath = options.wranglerBin || process.env.TEST_WRANGLER_BIN || defaultWranglerBin;

	// 1. Validate allowed arguments FIRST
	const argCheck = validateDeployArgs(argv);
	if (!argCheck.valid) {
		console.error(`\n❌ Argument Error: ${argCheck.error}\n`);
		return 1;
	}

	// 2. Run instance preflight
	console.log("▶ [1/2] Running deployment preflight check for independent instance...");
	const preflight = spawn(process.execPath, [preflightPath], {
		stdio: options.silent ? "pipe" : "inherit",
	});

	if (preflight.error) {
		console.error("\n❌ Deployment halted: Preflight execution error:", preflight.error.message);
		return 1;
	}

	if (preflight.signal) {
		console.error(`\n❌ Deployment halted: Preflight process terminated by signal ${preflight.signal}.`);
		return 1;
	}

	if (preflight.status !== 0) {
		console.error("\n❌ Deployment halted: Preflight validation failed.");
		console.error("   Fix the issues listed above in 'wrangler.instance.json' before deploying.\n");
		return preflight.status || 1;
	}

	// 3. Invoke Wrangler deployment with exact independent instance configuration
	console.log("▶ [2/2] Deploying independent MOBIO instance...");
	const deploy = spawn(
		process.execPath,
		[wranglerPath, "deploy", "--config", "wrangler.instance.json", ...argCheck.forwarded],
		{
			stdio: options.silent ? "pipe" : "inherit",
			env: {
				...process.env,
				...(options.env || {}),
				WRANGLER_CONFIG: "wrangler.instance.json",
			},
		}
	);

	if (deploy.error) {
		console.error("\n❌ Deployment failed: Wrangler process error:", deploy.error.message);
		return 1;
	}

	if (deploy.signal) {
		console.error(`\n❌ Deployment failed: Wrangler terminated by signal ${deploy.signal}.`);
		return 1;
	}

	if (deploy.status !== 0) {
		console.error(`\n❌ Deployment failed with exit code ${deploy.status}.`);
		return deploy.status || 1;
	}

	return 0;
}

const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectCli) {
	const code = runDeployInstance();
	process.exit(code);
}
