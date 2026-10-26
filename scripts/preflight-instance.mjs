import fs from "node:fs";
import path from "node:path";

console.log("============================================================");
console.log("MOBIO STUDIO — INSTANCE DEPLOYMENT PREFLIGHT CHECK");
console.log("Verifying Independent Cloudflare Configuration & Safety");
console.log("============================================================\n");

const args = process.argv.slice(2);
const targetConfig = args.includes("--prod") ? "wrangler.json" : "wrangler.instance.json";
const configPath = path.resolve(process.cwd(), targetConfig);

if (!fs.existsSync(configPath)) {
	if (targetConfig === "wrangler.instance.json") {
		console.error("❌ ERROR: Instance configuration file not found!");
		console.error("   Missing: wrangler.instance.json\n");
		console.error("To set up your independent instance:");
		console.error("  1. Copy the example configuration template:");
		console.error("     Windows CMD:        copy wrangler.example.json wrangler.instance.json");
		console.error("     PowerShell / Bash:  cp wrangler.example.json wrangler.instance.json");
		console.error("  2. Open wrangler.instance.json and configure your personal Cloudflare resources.");
		console.error("  3. Follow docs/INSTALLATION.md for step-by-step instructions.\n");
		process.exit(1);
	} else {
		console.error(`❌ ERROR: Configuration file '${targetConfig}' not found!\n`);
		process.exit(1);
	}
}

let config;
try {
	config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} catch (err) {
	console.error(`❌ ERROR: Failed to parse '${targetConfig}' as valid JSON:`, err.message);
	process.exit(1);
}

const errors = [];
const warnings = [];

// 1. Audit D1 Database Configuration
if (!config.d1_databases || !Array.isArray(config.d1_databases) || config.d1_databases.length === 0) {
	errors.push("Missing 'd1_databases' binding block.");
} else {
	const dbBinding = config.d1_databases.find((d) => d.binding === "DB");
	if (!dbBinding) {
		errors.push("Missing D1 database binding named 'DB'.");
	} else {
		if (!dbBinding.database_id || dbBinding.database_id.includes("YOUR_D1_DATABASE_ID")) {
			errors.push(
				"Placeholder database_id detected: '" +
					dbBinding.database_id +
					"'. Replace with your actual Cloudflare D1 UUID from: npx wrangler d1 create <name>"
			);
		}
		if (targetConfig === "wrangler.instance.json" && dbBinding.database_id === "00e8060a-0372-4b1a-8de3-84f9905edf51") {
			errors.push(
				"You are using the original project owner's production D1 database ID. Please generate your own personal D1 database!"
			);
		}
	}
}

// 2. Audit R2 Bucket Configuration
if (!config.r2_buckets || !Array.isArray(config.r2_buckets) || config.r2_buckets.length === 0) {
	errors.push("Missing 'r2_buckets' binding block.");
} else {
	const r2Binding = config.r2_buckets.find((r) => r.binding === "MEDIA_BUCKET");
	if (!r2Binding) {
		errors.push("Missing R2 bucket binding named 'MEDIA_BUCKET'.");
	} else {
		if (!r2Binding.bucket_name || r2Binding.bucket_name.includes("YOUR_R2_BUCKET_NAME")) {
			errors.push(
				"Placeholder bucket_name detected: '" +
					r2Binding.bucket_name +
					"'. Replace with your actual Cloudflare R2 bucket name from: npx wrangler r2 bucket create <name>"
			);
		}
	}
}

// 3. Audit Custom Domain Routing
if (targetConfig === "wrangler.instance.json" && config.routes) {
	const hasProductionDomain = config.routes.some(
		(r) => typeof r.pattern === "string" && r.pattern.includes("dimasmong.web.id")
	);
	if (hasProductionDomain) {
		errors.push(
			"Production domain 'me.dimasmong.web.id' detected in instance configuration. Use your own custom domain or remove routes to use *.workers.dev."
		);
	}
}

// Print Findings
if (errors.length > 0) {
	console.error(`❌ Preflight check FAILED with ${errors.length} error(s) in '${targetConfig}':\n`);
	errors.forEach((err, idx) => console.error(`  ${idx + 1}. ${err}`));
	console.error("\nPlease correct these settings in your configuration before deploying.\n");
	process.exit(1);
}

if (warnings.length > 0) {
	console.warn(`⚠️ Warnings in '${targetConfig}':\n`);
	warnings.forEach((warn, idx) => console.warn(`  ${idx + 1}. ${warn}`));
	console.log("");
}

console.log(`✅ Preflight check PASSED for '${targetConfig}'!`);
console.log(`   Worker Name:  ${config.name}`);
console.log(`   D1 Database:  ${config.d1_databases[0].database_name} (${config.d1_databases[0].database_id})`);
console.log(`   R2 Bucket:    ${config.r2_buckets[0].bucket_name}`);
console.log(`   Worker Target:${config.workers_dev ? " workers.dev subdomain" : " custom domain routes"}`);
console.log("\nReady for safe migrations and deployment. 🚀\n");
