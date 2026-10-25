import fs from "fs";
import path from "path";

const SCAN_DIRS = ["app", "workers", "docs", "scripts", "public"];
const SCAN_FILES = [
	"package.json",
	"react-router.config.ts",
	"vite.config.ts",
	"wrangler.json",
	"tsconfig.json",
	"tsconfig.cloudflare.json",
	"tsconfig.node.json",
	"README.md",
	"PERSONALIZATION-GUIDE.md",
	".gitignore",
];

const SECRET_PATTERNS = [
	{ type: "Private Key", regex: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY/i },
	{ type: "API / Secret Assignment", regex: /(?:api[_-]?key|client[_-]?secret|auth[_-]?token|secret[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i },
	{ type: "Password Assignment", regex: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/i },
	{ type: "Cloudflare Credential", regex: /(?:CLOUDFLARE_API_TOKEN|CF_API_KEY|CF_ACCOUNT_ID)\s*[:=]\s*['"][^'"]+['"]/i },
	{ type: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/ },
	{ type: "GitHub Personal Access Token", regex: /gh[pousr]_[0-9a-zA-Z]{36}/ },
	{ type: "Generic Bearer Token", regex: /bearer\s+[a-zA-Z0-9_\-\.]{25,}/i },
];

function getAllFiles(dirPath, arrayOfFiles = []) {
	if (!fs.existsSync(dirPath)) return arrayOfFiles;
	const files = fs.readdirSync(dirPath);

	for (const file of files) {
		const fullPath = path.join(dirPath, file);
		if (fs.statSync(fullPath).isDirectory()) {
			if (!["node_modules", ".git", ".wrangler", ".react-router", "build", "test-artifacts"].includes(file)) {
				getAllFiles(fullPath, arrayOfFiles);
			}
		} else {
			if (!file.match(/\.(png|jpg|jpeg|gif|ico|webp|svg)$/i)) {
				arrayOfFiles.push(fullPath);
			}
		}
	}
	return arrayOfFiles;
}

const filesToScan = [];
for (const dir of SCAN_DIRS) {
	getAllFiles(dir, filesToScan);
}
for (const file of SCAN_FILES) {
	if (fs.existsSync(file)) filesToScan.push(file);
}

const findings = [];

for (const filePath of filesToScan) {
	const content = fs.readFileSync(filePath, "utf-8");
	const lines = content.split(/\r?\n/);

	for (let i = 0; i < lines.Count || i < lines.length; i++) {
		const line = lines[i];
		for (const pattern of SECRET_PATTERNS) {
			if (pattern.regex.test(line)) {
				// Record ONLY path, line number, and type. NEVER record or print the line content.
				findings.push({
					path: filePath.replace(/\\/g, "/"),
					line: i + 1,
					type: pattern.type,
				});
			}
		}
	}
}

console.log(`Audited ${filesToScan.length} files across the codebase.`);
if (findings.length === 0) {
	console.log("SAFE_AUDIT_RESULT: ZERO_SECRETS_FOUND");
	console.log("No passwords, tokens, API keys, or private credentials detected.");
} else {
	console.log(`ALERT: Found ${findings.length} potential secret match(es):`);
	console.table(findings);
}
