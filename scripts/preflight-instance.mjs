import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function validateConfiguration(configPath, isProd = false) {
	const errors = [];
	const warnings = [];

	if (!fs.existsSync(configPath)) {
		const filename = path.basename(configPath);
		if (filename === "wrangler.instance.json") {
			return {
				success: false,
				errors: [
					"Instance configuration file not found: 'wrangler.instance.json'.\n" +
					"  To set up your independent instance:\n" +
					"    1. Copy example:  copy wrangler.example.json wrangler.instance.json (Windows)\n" +
					"                      cp wrangler.example.json wrangler.instance.json (macOS/Linux)\n" +
					"    2. Edit wrangler.instance.json with your own Cloudflare D1 UUID and R2 bucket name.\n" +
					"    3. See docs/INSTALLATION.md for step-by-step guidance."
				],
				warnings,
				config: null,
			};
		}
		return {
			success: false,
			errors: [`Configuration file not found: '${configPath}'`],
			warnings,
			config: null,
		};
	}

	let rawContent;
	try {
		rawContent = fs.readFileSync(configPath, "utf-8");
	} catch (err) {
		return {
			success: false,
			errors: [`Unable to read configuration file '${configPath}': ${err.message}`],
			warnings,
			config: null,
		};
	}

	let config;
	try {
		config = JSON.parse(rawContent);
	} catch (err) {
		return {
			success: false,
			errors: [`Failed to parse '${path.basename(configPath)}' as valid JSON: ${err.message}`],
			warnings,
			config: null,
		};
	}

	if (!config || typeof config !== "object" || Array.isArray(config)) {
		return {
			success: false,
			errors: ["Root configuration must be a valid JSON object."],
			warnings,
			config: null,
		};
	}

	// 1. Audit Worker Name (field: 'name')
	if (!config.name || typeof config.name !== "string" || !config.name.trim()) {
		errors.push("Missing or empty 'name' field. Provide a valid Cloudflare Worker name.");
	} else {
		const nameTrimmed = config.name.trim();
		// Cloudflare Worker name rules: 1-63 chars, alphanumeric, hyphens, underscores, cannot start with hyphen
		const workerNameRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,62}$/;
		if (!workerNameRegex.test(nameTrimmed)) {
			errors.push(
				`Invalid Worker name '${nameTrimmed}'. Worker name must be 1-63 alphanumeric characters, hyphens, or underscores, and cannot start with a hyphen.`
			);
		}
		if (!isProd && nameTrimmed.toLowerCase() === "mobio-link-bio") {
			errors.push(
				"Worker name cannot be the original production Worker name ('mobio-link-bio'). Please specify your own unique Worker name in 'name' (e.g. 'my-mobio-bio')."
			);
		}
	}

	// 2. Audit D1 Database Configuration (field: 'd1_databases')
	if (!config.d1_databases || !Array.isArray(config.d1_databases) || config.d1_databases.length === 0) {
		errors.push("Missing 'd1_databases' configuration array. At least one D1 database binding is required.");
	} else {
		const dbBindings = config.d1_databases.filter((d) => d && typeof d === "object" && d.binding === "DB");
		if (dbBindings.length === 0) {
			errors.push("Missing D1 database binding named 'DB'. Please add a binding with 'binding': 'DB'.");
		} else if (dbBindings.length > 1) {
			errors.push("Duplicate D1 binding 'DB' detected. There must be exactly one 'DB' binding.");
		} else {
			const dbBinding = dbBindings[0];

			// Validate database_name
			if (!dbBinding.database_name || typeof dbBinding.database_name !== "string" || !dbBinding.database_name.trim()) {
				errors.push("Missing or empty 'database_name' in D1 binding 'DB'.");
			} else if (dbBinding.database_name.includes("YOUR_D1_DATABASE_NAME")) {
				errors.push("Placeholder database_name detected. Specify your Cloudflare D1 database name in 'database_name'.");
			}

			// Validate database_id
			if (!dbBinding.database_id || typeof dbBinding.database_id !== "string" || !dbBinding.database_id.trim()) {
				errors.push("Missing 'database_id' in D1 binding 'DB'. Specify your Cloudflare D1 database UUID.");
			} else {
				const dbId = dbBinding.database_id.trim();
				if (dbId.includes("YOUR_D1_DATABASE_ID")) {
					errors.push(
						`Placeholder database_id detected: '${dbId}'. Replace with your actual Cloudflare D1 UUID from: npx wrangler d1 create <name>`
					);
				} else {
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					if (!uuidRegex.test(dbId)) {
						errors.push(
							`Malformed D1 database_id '${dbId}'. Must be a valid UUID (e.g. xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx).`
						);
					}
					if (!isProd && dbId.toLowerCase() === "00e8060a-0372-4b1a-8de3-84f9905edf51") {
						errors.push(
							"Original production D1 database UUID ('00e8060a-0372-4b1a-8de3-84f9905edf51') detected in instance configuration. You must create and use your own independent D1 database."
						);
					}
				}
			}
		}
	}

	// 3. Audit R2 Bucket Configuration (field: 'r2_buckets')
	if (!config.r2_buckets || !Array.isArray(config.r2_buckets) || config.r2_buckets.length === 0) {
		errors.push("Missing 'r2_buckets' configuration array. At least one R2 bucket binding is required.");
	} else {
		const r2Bindings = config.r2_buckets.filter((r) => r && typeof r === "object" && r.binding === "MEDIA_BUCKET");
		if (r2Bindings.length === 0) {
			errors.push("Missing R2 bucket binding named 'MEDIA_BUCKET'. Please add a binding with 'binding': 'MEDIA_BUCKET'.");
		} else if (r2Bindings.length > 1) {
			errors.push("Duplicate R2 binding 'MEDIA_BUCKET' detected. There must be exactly one 'MEDIA_BUCKET' binding.");
		} else {
			const r2Binding = r2Bindings[0];

			// Validate bucket_name
			if (!r2Binding.bucket_name || typeof r2Binding.bucket_name !== "string" || !r2Binding.bucket_name.trim()) {
				errors.push("Missing or empty 'bucket_name' in R2 binding 'MEDIA_BUCKET'.");
			} else {
				const bName = r2Binding.bucket_name.trim();
				if (bName.includes("YOUR_R2_BUCKET_NAME")) {
					errors.push(
						`Placeholder bucket_name detected: '${bName}'. Replace with your actual Cloudflare R2 bucket name from: npx wrangler r2 bucket create <name>`
					);
				} else if (!isProd && bName.toLowerCase() === "mobio-media-bucket") {
					errors.push(
						"Original production R2 bucket name ('mobio-media-bucket') detected in instance configuration. You must create and use your own independent R2 bucket."
					);
				}
			}
		}
	}

	// 4. Audit Custom Domain Routing (field: 'routes')
	if (config.routes !== undefined) {
		if (!Array.isArray(config.routes)) {
			errors.push("Invalid 'routes' configuration: 'routes' must be an array of route objects.");
		} else {
			config.routes.forEach((r, idx) => {
				if (!r || typeof r !== "object" || Array.isArray(r)) {
					errors.push(`Invalid route definition at index ${idx}: expected an object with a string 'pattern' property.`);
				} else if (!r.pattern || typeof r.pattern !== "string" || !r.pattern.trim()) {
					errors.push(`Missing or invalid 'pattern' in route definition at index ${idx}.`);
				} else if (!isProd && /dimasmong\.web\.id/i.test(r.pattern)) {
					errors.push(
						`Original production domain '${r.pattern}' detected in instance configuration routes. Independent instances must use their own custom domain or remove routes to use *.workers.dev.`
					);
				}
			});
		}
	}

	// 5. Cross-Check Conflicting Binding Names
	const allBindingNames = [];
	if (Array.isArray(config.d1_databases)) {
		config.d1_databases.forEach((d) => d?.binding && allBindingNames.push({ name: d.binding, type: "d1" }));
	}
	if (Array.isArray(config.r2_buckets)) {
		config.r2_buckets.forEach((r) => r?.binding && allBindingNames.push({ name: r.binding, type: "r2" }));
	}
	if (Array.isArray(config.kv_namespaces)) {
		config.kv_namespaces.forEach((k) => k?.binding && allBindingNames.push({ name: k.binding, type: "kv" }));
	}

	const bindingMap = new Map();
	for (const item of allBindingNames) {
		if (bindingMap.has(item.name)) {
			const existing = bindingMap.get(item.name);
			if (existing.type !== item.type) {
				errors.push(`Conflicting binding name '${item.name}' declared in both ${existing.type} and ${item.type}.`);
			}
		} else {
			bindingMap.set(item.name, item);
		}
	}

	return {
		success: errors.length === 0,
		errors,
		warnings,
		config,
	};
}

// CLI Execution Support
const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectCli) {
	console.log("============================================================");
	console.log("MOBIO STUDIO — INSTANCE DEPLOYMENT PREFLIGHT CHECK");
	console.log("Verifying Independent Cloudflare Configuration & Safety");
	console.log("============================================================\n");

	const args = process.argv.slice(2);
	const isProd = args.includes("--prod");

	// Allow custom config path via --config <path> or --config=<path>
	let targetConfig = isProd ? "wrangler.json" : "wrangler.instance.json";
	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--config" && args[i + 1]) {
			targetConfig = args[i + 1];
			i++;
		} else if (args[i].startsWith("--config=")) {
			targetConfig = args[i].slice("--config=".length);
		}
	}

	const configPath = path.resolve(process.cwd(), targetConfig);
	const result = validateConfiguration(configPath, isProd);

	if (!result.success) {
		console.error(`❌ Preflight check FAILED with ${result.errors.length} error(s) in '${targetConfig}':\n`);
		result.errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
		console.error("\nPlease correct these settings before deploying.\n");
		process.exit(1);
	}

	if (result.warnings.length > 0) {
		console.warn(`⚠️ Warnings in '${targetConfig}':\n`);
		result.warnings.forEach((warn, idx) => console.warn(`  ${idx + 1}. ${warn}`));
		console.log("");
	}

	const cfg = result.config;
	console.log(`✅ Preflight check PASSED for '${targetConfig}'!`);
	console.log(`   Worker Name:  ${cfg.name}`);
	console.log(`   D1 Database:  ${cfg.d1_databases[0].database_name} (${cfg.d1_databases[0].database_id})`);
	console.log(`   R2 Bucket:    ${cfg.r2_buckets[0].bucket_name}`);
	console.log(`   Worker Target:${cfg.workers_dev ? " *.workers.dev subdomain" : " custom domain routes"}`);
	console.log("\nReady for safe migrations and deployment. 🚀\n");
}
