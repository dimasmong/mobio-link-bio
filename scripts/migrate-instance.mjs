#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preflightScript = path.resolve(__dirname, "preflight-instance.mjs");
const defaultWranglerBin = path.resolve(__dirname, "../node_modules/wrangler/bin/wrangler.js");

export function validateMigrateArgs(args) {
	let mode = null;
	const seenFlags = new Set();

	for (const arg of args) {
		if (arg === "--") {
			return {
				valid: false,
				error: "Bare argument delimiter '--' is not supported in 'migrate:instance'.",
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
				error: `Configuration override '${arg}' is forbidden. 'migrate:instance' strictly targets 'wrangler.instance.json'.`,
			};
		}

		if (arg === "--local" || arg === "--remote") {
			if (seenFlags.has(arg)) {
				return {
					valid: false,
					error: `Duplicate migration flag '${arg}' detected.`,
				};
			}
			if (mode !== null && mode !== arg) {
				return {
					valid: false,
					error: "Conflicting migration modes specified. Choose either '--local' or '--remote', not both.",
				};
			}
			seenFlags.add(arg);
			mode = arg;
		} else if (arg.startsWith("-")) {
			return {
				valid: false,
				error: `Unsupported flag '${arg}'. 'migrate:instance' only accepts '--local' or '--remote'.`,
			};
		} else {
			return {
				valid: false,
				error: `Unexpected positional argument '${arg}'. Database binding is strictly fixed to 'DB' in 'wrangler.instance.json'.`,
			};
		}
	}

	if (!mode) {
		return {
			valid: false,
			error: "Migration mode is required. Specify either '--local' (local SQLite) or '--remote' (Cloudflare D1).",
		};
	}

	return { valid: true, mode };
}

export function runMigrateInstance(argv = process.argv.slice(2), options = {}) {
	const spawn = options.spawnSyncFn || spawnSync;
	const preflightPath = options.preflightScript || preflightScript;
	const wranglerPath = options.wranglerBin || process.env.TEST_WRANGLER_BIN || defaultWranglerBin;

	// 1. Validate requested mode FIRST
	const modeCheck = validateMigrateArgs(argv);
	if (!modeCheck.valid) {
		console.error(`\n❌ Argument Error: ${modeCheck.error}\n`);
		return 1;
	}

	const targetMode = modeCheck.mode;

	// 2. Run instance preflight
	console.log(`▶ [1/2] Running migration preflight check (${targetMode})...`);
	const preflight = spawn(process.execPath, [preflightPath], {
		stdio: options.silent ? "pipe" : "inherit",
	});

	if (preflight.error) {
		console.error("\n❌ Instance migration halted: Preflight execution error:", preflight.error.message);
		return 1;
	}

	if (preflight.signal) {
		console.error(`\n❌ Instance migration halted: Preflight process terminated by signal ${preflight.signal}.`);
		return 1;
	}

	if (preflight.status !== 0) {
		console.error("\n❌ Instance migration halted: Preflight validation failed.");
		console.error("   Fix the issues listed above in 'wrangler.instance.json' before applying migrations.\n");
		return preflight.status || 1;
	}

	// 3. Invoke Wrangler migrations for DB binding with explicit instance config and selected mode
	console.log(`▶ [2/2] Applying D1 migrations (${targetMode}) for independent instance...`);
	const migrate = spawn(
		process.execPath,
		[
			wranglerPath,
			"d1",
			"migrations",
			"apply",
			"DB",
			targetMode,
			"--config",
			"wrangler.instance.json",
		],
		{
			stdio: options.silent ? "pipe" : "inherit",
			env: {
				...process.env,
				...(options.env || {}),
				WRANGLER_CONFIG: "wrangler.instance.json",
			},
		}
	);

	if (migrate.error) {
		console.error("\n❌ Instance migration failed: Wrangler process error:", migrate.error.message);
		return 1;
	}

	if (migrate.signal) {
		console.error(`\n❌ Instance migration failed: Wrangler terminated by signal ${migrate.signal}.`);
		return 1;
	}

	if (migrate.status !== 0) {
		console.error(`\n❌ Instance migration failed with exit code ${migrate.status}.`);
		return migrate.status || 1;
	}

	return 0;
}

const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectCli) {
	const code = runMigrateInstance();
	process.exit(code);
}
