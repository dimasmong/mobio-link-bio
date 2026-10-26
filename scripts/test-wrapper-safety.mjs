#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { runDeployInstance, validateDeployArgs } from "./deploy-instance.mjs";
import { runMigrateInstance, validateMigrateArgs } from "./migrate-instance.mjs";
import { runBuildInstance } from "./build-instance.mjs";
import { runBuildProd } from "./build-prod.mjs";

console.log("============================================================");
console.log("MOBIO STUDIO — WRAPPER SCRIPTS SECURITY & RELIABILITY TESTS");
console.log("Testing Mocked Invocations, Argument Guards, & Failure Handling");
console.log("============================================================\n");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mobio-wrapper-test-"));
const mockPreflightScript = path.join(tmpDir, "mock-preflight.mjs");
const mockWranglerBin = path.join(tmpDir, "mock-wrangler.js");

try {
	// Create mock preflight script that passes by default
	fs.writeFileSync(mockPreflightScript, "process.exit(0);", "utf-8");
	// Create mock wrangler script
	fs.writeFileSync(mockWranglerBin, "process.exit(0);", "utf-8");

	// -------------------------------------------------------------
	// TEST 1: Valid deployment config with successful mocked Wrangler invocation
	// -------------------------------------------------------------
	console.log("TEST 1: Valid deployment with mocked Wrangler invocation...");
	{
		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args, opts });
			return { status: 0, error: null, signal: null };
		};

		const code = runDeployInstance([], {
			spawnSyncFn: mockSpawn,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.equal(code, 0, "runDeployInstance must exit 0 on success");
		assert.equal(calls.length, 2, "Expected 2 process invocations (preflight, then wrangler deploy)");
		assert.ok(calls[0].args[0].includes("mock-preflight"), "Call 1 must be preflight");
		assert.deepEqual(
			calls[1].args,
			[mockWranglerBin, "deploy", "--config", "wrangler.instance.json"],
			"Call 2 must execute wrangler deploy with exact wrangler.instance.json config"
		);
		assert.equal(calls[1].opts.env.WRANGLER_CONFIG, "wrangler.instance.json", "WRANGLER_CONFIG env var must be set to wrangler.instance.json");
		console.log("  ✓ Successfully invoked mocked deploy with exact arguments and exit code 0.");
	}

	// -------------------------------------------------------------
	// TEST 2: Missing instance config blocks deployment
	// -------------------------------------------------------------
	console.log("\nTEST 2: Missing instance config blocks deployment...");
	{
		const mockPreflightFailing = path.join(tmpDir, "preflight-fail-missing.mjs");
		fs.writeFileSync(mockPreflightFailing, "console.error('File not found'); process.exit(1);", "utf-8");

		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args });
			if (args[0].includes("preflight")) {
				return { status: 1, error: null, signal: null };
			}
			return { status: 0, error: null, signal: null };
		};

		const code = runDeployInstance([], {
			spawnSyncFn: mockSpawn,
			preflightScript: mockPreflightFailing,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.notEqual(code, 0, "Must exit non-zero when preflight detects missing instance config");
		assert.equal(calls.length, 1, "Wrangler must NEVER be invoked when preflight fails");
		console.log("  ✓ Missing instance config blocked deployment before Wrangler could be invoked.");
	}

	// -------------------------------------------------------------
	// TEST 3: Failed preflight blocks deployment
	// -------------------------------------------------------------
	console.log("\nTEST 3: Failed preflight validation blocks deployment...");
	{
		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args });
			// Preflight exits with validation failure code 1
			return { status: 1, error: null, signal: null };
		};

		const code = runDeployInstance([], {
			spawnSyncFn: mockSpawn,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.equal(code, 1, "Must propagate preflight non-zero failure code");
		assert.equal(calls.length, 1, "Wrangler must not be invoked after preflight failure");
		console.log("  ✓ Failed preflight halted deployment process.");
	}

	// -------------------------------------------------------------
	// TEST 4: Failed Wrangler child process returns nonzero
	// -------------------------------------------------------------
	console.log("\nTEST 4: Failed Wrangler child process returns nonzero...");
	{
		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args });
			if (args[0].includes("mock-preflight")) {
				return { status: 0, error: null, signal: null };
			}
			// Wrangler returns failure code 2
			return { status: 2, error: null, signal: null };
		};

		const code = runDeployInstance([], {
			spawnSyncFn: mockSpawn,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.equal(code, 2, "Must preserve and return Wrangler's non-zero exit code (2)");
		console.log("  ✓ Preserved non-zero Wrangler exit code (2).");
	}

	// -------------------------------------------------------------
	// TEST 5: Child process spawn error returns nonzero (null status handled safely)
	// -------------------------------------------------------------
	console.log("\nTEST 5: Child process spawn error returns nonzero (Finding A fix)...");
	{
		const mockSpawnError = (file, args, opts) => {
			if (args[0].includes("mock-preflight")) {
				return { status: 0, error: null, signal: null };
			}
			// Simulate spawn error (e.g. binary not found or permissions error) where status is null
			return { status: null, error: new Error("ENOENT: spawn failed"), signal: null };
		};

		const code = runDeployInstance([], {
			spawnSyncFn: mockSpawnError,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.notEqual(code, 0, "Spawn error with null status must NOT return 0 (success)");
		assert.equal(code, 1, "Spawn error must return failure exit code 1");

		// Test termination by signal with null status
		const mockSpawnSignal = (file, args, opts) => {
			if (args[0].includes("mock-preflight")) {
				return { status: 0, error: null, signal: null };
			}
			return { status: null, error: null, signal: "SIGTERM" };
		};

		const sigCode = runDeployInstance([], {
			spawnSyncFn: mockSpawnSignal,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.notEqual(sigCode, 0, "Signal termination with null status must NOT return 0 (success)");
		assert.equal(sigCode, 1, "Signal termination must return failure exit code 1");
		console.log("  ✓ Process spawn errors and signal kills with null status safely return non-zero.");
	}

	// -------------------------------------------------------------
	// TEST 6: Extra --config option is rejected
	// -------------------------------------------------------------
	console.log("\nTEST 6: Extra --config option is rejected...");
	{
		const res1 = validateDeployArgs(["--config", "evil.json"]);
		assert.equal(res1.valid, false, "--config must be rejected in validateDeployArgs");
		assert.ok(res1.error.includes("Configuration override '--config' is forbidden"));

		const resAlias = validateDeployArgs(["-c", "evil.json"]);
		assert.equal(resAlias.valid, false, "-c must be rejected in validateDeployArgs");

		const calls = [];
		const mockSpawn = () => calls.push(1);
		const code = runDeployInstance(["--config", "evil.json"], { spawnSyncFn: mockSpawn, silent: true });
		assert.notEqual(code, 0, "runDeployInstance must reject --config");
		assert.equal(calls.length, 0, "Neither preflight nor wrangler may be called on invalid args");
		console.log("  ✓ Extra --config flag correctly rejected.");
	}

	// -------------------------------------------------------------
	// TEST 7: Config override using --config=... is rejected
	// -------------------------------------------------------------
	console.log("\nTEST 7: Config override using --config=... is rejected...");
	{
		const res2 = validateDeployArgs(["--config=production.json"]);
		assert.equal(res2.valid, false, "--config=... must be rejected in validateDeployArgs");
		assert.ok(res2.error.includes("Configuration override '--config=production.json' is forbidden"));

		const resAliasEq = validateDeployArgs(["-c=production.json"]);
		assert.equal(resAliasEq.valid, false, "-c=... must be rejected in validateDeployArgs");

		const calls = [];
		const mockSpawn = () => calls.push(1);
		const code = runDeployInstance(["--config=production.json"], { spawnSyncFn: mockSpawn, silent: true });
		assert.notEqual(code, 0, "runDeployInstance must reject --config=...");
		assert.equal(calls.length, 0, "No child processes may be spawned on config override attempt");
		console.log("  ✓ Flag assignment --config=... correctly rejected.");
	}

	// -------------------------------------------------------------
	// TEST 8: Arbitrary deployment target override is rejected
	// -------------------------------------------------------------
	console.log("\nTEST 8: Arbitrary deployment target override is rejected...");
	{
		const res3 = validateDeployArgs(["mobio-link-bio"]);
		assert.equal(res3.valid, false, "Positional worker name must be rejected");
		assert.ok(res3.error.includes("Positional argument 'mobio-link-bio' is not supported"));

		const resBareDash = validateDeployArgs(["--"]);
		assert.equal(resBareDash.valid, false, "Bare '--' must be rejected");

		const resUnknown = validateDeployArgs(["--target", "worker2"]);
		assert.equal(resUnknown.valid, false, "Unknown flag must be rejected");

		const calls = [];
		const mockSpawn = () => calls.push(1);
		const code = runDeployInstance(["my-override-worker"], { spawnSyncFn: mockSpawn, silent: true });
		assert.notEqual(code, 0, "runDeployInstance must reject positional target override");
		assert.equal(calls.length, 0, "No child processes may be spawned on positional arg");
		console.log("  ✓ Positional target overrides and bare '--' correctly rejected.");
	}

	// -------------------------------------------------------------
	// TEST 9: Valid --local migration selects local mode
	// -------------------------------------------------------------
	console.log("\nTEST 9: Valid --local migration selects local mode...");
	{
		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args, opts });
			return { status: 0, error: null, signal: null };
		};

		const code = runMigrateInstance(["--local"], {
			spawnSyncFn: mockSpawn,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.equal(code, 0, "runMigrateInstance with --local must exit 0 on success");
		assert.equal(calls.length, 2, "Expected 2 process invocations (preflight, then wrangler d1 migrations)");
		assert.deepEqual(
			calls[1].args,
			[mockWranglerBin, "d1", "migrations", "apply", "DB", "--local", "--config", "wrangler.instance.json"],
			"Must execute wrangler d1 migrations apply DB --local --config wrangler.instance.json"
		);
		console.log("  ✓ Valid --local migration successfully selected local mode with exact arguments.");
	}

	// -------------------------------------------------------------
	// TEST 10: Valid --remote migration selects remote mode
	// -------------------------------------------------------------
	console.log("\nTEST 10: Valid --remote migration selects remote mode...");
	{
		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args, opts });
			return { status: 0, error: null, signal: null };
		};

		const code = runMigrateInstance(["--remote"], {
			spawnSyncFn: mockSpawn,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.equal(code, 0, "runMigrateInstance with --remote must exit 0 on success");
		assert.equal(calls.length, 2, "Expected 2 process invocations (preflight, then wrangler d1 migrations)");
		assert.deepEqual(
			calls[1].args,
			[mockWranglerBin, "d1", "migrations", "apply", "DB", "--remote", "--config", "wrangler.instance.json"],
			"Must execute wrangler d1 migrations apply DB --remote --config wrangler.instance.json"
		);
		console.log("  ✓ Valid --remote migration successfully selected remote mode with exact arguments.");
	}

	// -------------------------------------------------------------
	// TEST 11: Missing migration mode is rejected (Finding C fix)
	// -------------------------------------------------------------
	console.log("\nTEST 11: Missing migration mode is rejected...");
	{
		const res = validateMigrateArgs([]);
		assert.equal(res.valid, false, "Empty migration args must be invalid");
		assert.ok(res.error.includes("Migration mode is required. Specify either '--local'"));

		const calls = [];
		const mockSpawn = () => calls.push(1);
		const code = runMigrateInstance([], { spawnSyncFn: mockSpawn, silent: true });
		assert.notEqual(code, 0, "Missing mode must return nonzero error code");
		assert.equal(calls.length, 0, "No child processes may run when migration mode is missing");
		console.log("  ✓ Missing migration mode correctly rejected with explicit usage requirement.");
	}

	// -------------------------------------------------------------
	// TEST 12: Both migration modes are rejected (conflicting modes)
	// -------------------------------------------------------------
	console.log("\nTEST 12: Both migration modes are rejected (conflicting modes)...");
	{
		const res = validateMigrateArgs(["--local", "--remote"]);
		assert.equal(res.valid, false, "Both --local and --remote must be rejected");
		assert.ok(res.error.includes("Conflicting migration modes specified"));

		const resRev = validateMigrateArgs(["--remote", "--local"]);
		assert.equal(resRev.valid, false, "Both --remote and --local must be rejected");
		assert.ok(resRev.error.includes("Conflicting migration modes specified"));

		const calls = [];
		const mockSpawn = () => calls.push(1);
		const code = runMigrateInstance(["--local", "--remote"], { spawnSyncFn: mockSpawn, silent: true });
		assert.notEqual(code, 0, "Conflicting modes must return nonzero code");
		assert.equal(calls.length, 0, "No child processes may run on conflicting modes");
		console.log("  ✓ Conflicting migration modes (--local and --remote) correctly rejected.");
	}

	// -------------------------------------------------------------
	// TEST 13: Unsupported migration flags are rejected
	// -------------------------------------------------------------
	console.log("\nTEST 13: Unsupported migration flags are rejected...");
	{
		const resConfig = validateMigrateArgs(["--remote", "--config", "evil.json"]);
		assert.equal(resConfig.valid, false, "--config must be forbidden in migration");
		assert.ok(resConfig.error.includes("Configuration override '--config' is forbidden"));

		const resConfigEq = validateMigrateArgs(["--remote", "--config=evil.json"]);
		assert.equal(resConfigEq.valid, false, "--config=... must be forbidden in migration");

		const resDup = validateMigrateArgs(["--remote", "--remote"]);
		assert.equal(resDup.valid, false, "Duplicate flag must be rejected");
		assert.ok(resDup.error.includes("Duplicate migration flag '--remote' detected"));

		const resUnknown = validateMigrateArgs(["--remote", "--all"]);
		assert.equal(resUnknown.valid, false, "Unknown flag --all must be rejected");
		assert.ok(resUnknown.error.includes("Unsupported flag '--all'"));

		const resPos = validateMigrateArgs(["--remote", "other_database"]);
		assert.equal(resPos.valid, false, "Positional database name must be rejected");
		assert.ok(resPos.error.includes("Unexpected positional argument 'other_database'"));

		const calls = [];
		const mockSpawn = () => calls.push(1);
		const code = runMigrateInstance(["--remote", "--experimental"], { spawnSyncFn: mockSpawn, silent: true });
		assert.notEqual(code, 0, "Unsupported migration flag must exit nonzero");
		assert.equal(calls.length, 0, "No child processes may run on unsupported flag");
		console.log("  ✓ Unsupported migration flags, config overrides, and positional arguments rejected.");
	}

	// -------------------------------------------------------------
	// TEST 14: Failed migration preflight blocks Wrangler
	// -------------------------------------------------------------
	console.log("\nTEST 14: Failed migration preflight blocks Wrangler...");
	{
		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args });
			// Preflight exits with failure code 1
			return { status: 1, error: null, signal: null };
		};

		const code = runMigrateInstance(["--remote"], {
			spawnSyncFn: mockSpawn,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.equal(code, 1, "Must propagate non-zero code on preflight failure");
		assert.equal(calls.length, 1, "Wrangler must NEVER be invoked after preflight failure");
		console.log("  ✓ Failed migration preflight stopped execution before Wrangler was called.");
	}

	// -------------------------------------------------------------
	// TEST 15: Failed Wrangler migration returns nonzero
	// -------------------------------------------------------------
	console.log("\nTEST 15: Failed Wrangler migration returns nonzero...");
	{
		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args });
			if (args[0].includes("mock-preflight")) {
				return { status: 0, error: null, signal: null };
			}
			// Wrangler migration exits with code 5
			return { status: 5, error: null, signal: null };
		};

		const code = runMigrateInstance(["--remote"], {
			spawnSyncFn: mockSpawn,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.equal(code, 5, "Must return Wrangler's exact exit code (5)");

		// Test migration spawn error with null status
		const mockSpawnError = (file, args, opts) => {
			if (args[0].includes("mock-preflight")) {
				return { status: 0, error: null, signal: null };
			}
			return { status: null, error: new Error("Migration execution failure"), signal: null };
		};

		const errCode = runMigrateInstance(["--local"], {
			spawnSyncFn: mockSpawnError,
			preflightScript: mockPreflightScript,
			wranglerBin: mockWranglerBin,
			silent: true,
		});

		assert.notEqual(errCode, 0, "Migration spawn error with null status must return nonzero");
		assert.equal(errCode, 1, "Spawn error must return failure exit code 1");
		console.log("  ✓ Failed Wrangler migrations and spawn errors correctly return nonzero exit codes.");
	}

	// -------------------------------------------------------------
	// TEST 16: Normal production build still succeeds
	// -------------------------------------------------------------
	console.log("\nTEST 16: Normal production build still succeeds...");
	{
		const calls = [];
		const mockSpawn = (file, args, opts) => {
			calls.push({ file, args, opts });
			return { status: 0, error: null, signal: null };
		};

		const code = runBuildProd([], {
			spawnSyncFn: mockSpawn,
			silent: true,
		});

		assert.equal(code, 0, "runBuildProd must succeed with exit code 0");
		assert.equal(calls.length, 1, "Expected 1 build execution");
		assert.equal(calls[0].opts.env.WRANGLER_CONFIG, "wrangler.json", "Must target wrangler.json");
		assert.equal(calls[0].opts.env.BUILD_TARGET, "production", "Must set BUILD_TARGET=production");
		console.log("  ✓ Production build successfully targets wrangler.json with BUILD_TARGET=production.");
	}

	// -------------------------------------------------------------
	// TEST 17: Build instance arguments safety
	// -------------------------------------------------------------
	console.log("\nTEST 17: Build instance rejects config override arguments...");
	{
		const calls = [];
		const mockSpawn = () => calls.push(1);
		const code = runBuildInstance(["--config", "evil.json"], {
			spawnSyncFn: mockSpawn,
			silent: true,
		});
		assert.notEqual(code, 0, "runBuildInstance must reject --config");
		assert.equal(calls.length, 0, "No child processes may run on config override attempt");
		console.log("  ✓ Build instance safely rejects configuration override arguments.");
	}
} finally {
	fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("\n============================================================");
console.log("ALL 17 WRAPPER SCRIPT SECURITY & RELIABILITY TESTS PASSED! 🎉");
console.log("============================================================\n");
