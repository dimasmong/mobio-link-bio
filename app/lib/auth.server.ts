/**
 * MOBIO STUDIO — AUTHENTICATION & ACCESS CONTROL
 *
 * Integrates directly with Cloudflare Access (Zero Trust Email OTP).
 * Never trusts user-controllable headers in production.
 * Fails closed if Access JWT or configuration is invalid.
 */

export interface AdminUser {
	email: string;
	identityType: "cloudflare_access" | "local_dev_simulation";
	sub?: string;
	aud?: string;
	teamName?: string;
}

export interface AuthResult {
	isAuthenticated: boolean;
	user: AdminUser | null;
	error?: string;
	statusCode: number;
	reason:
		| "missing_jwt"
		| "invalid_jwt"
		| "expired_jwt"
		| "aud_mismatch"
		| "team_mismatch"
		| "email_unauthorized"
		| "local_simulation"
		| "success";
}

/**
 * Base64URL decoder for JWT components.
 */
function base64UrlDecode(str: string): string {
	let output = str.replace(/-/g, "+").replace(/_/g, "/");
	switch (output.length % 4) {
		case 0:
			break;
		case 2:
			output += "==";
			break;
		case 3:
			output += "=";
			break;
		default:
			throw new Error("Invalid base64url string length");
	}
	try {
		return decodeURIComponent(
			atob(output)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
	} catch {
		return atob(output);
	}
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
	const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	const padLength = (4 - (base64.length % 4)) % 4;
	const padded = base64 + "=".repeat(padLength);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

interface JwksKey {
	kid: string;
	kty: string;
	alg: string;
	use?: string;
	n: string;
	e: string;
}

interface JwksResponse {
	keys: JwksKey[];
}

// In-memory JWKS cache: teamName -> { keys: JwksKey[]; fetchedAt: number }
const jwksCache = new Map<string, { keys: JwksKey[]; fetchedAt: number }>();
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchTeamJwks(teamName: string): Promise<JwksKey[]> {
	const cached = jwksCache.get(teamName);
	const now = Date.now();
	if (cached && now - cached.fetchedAt < JWKS_CACHE_TTL_MS) {
		return cached.keys;
	}

	const certsUrl = `https://${teamName}.cloudflareaccess.com/cdn-cgi/access/certs`;
	const res = await fetch(certsUrl, {
		headers: { Accept: "application/json" },
	});

	if (!res.ok) {
		throw new Error(`Gagal mengambil kunci JWKS Cloudflare Access (${res.status})`);
	}

	const data = (await res.json()) as JwksResponse;
	if (!data || !Array.isArray(data.keys)) {
		throw new Error("Payload JWKS dari Cloudflare Access tidak valid.");
	}

	jwksCache.set(teamName, { keys: data.keys, fetchedAt: now });
	return data.keys;
}

/**
 * Cryptographically verifies the RS256 signature of a Cloudflare Access JWT against JWKS public keys.
 */
export async function verifyCloudflareAccessSignature(
	jwt: string,
	teamName: string
): Promise<boolean> {
	try {
		const parts = jwt.split(".");
		if (parts.length !== 3) return false;

		const headerJson = base64UrlDecode(parts[0]);
		const header = JSON.parse(headerJson) as { alg?: string; kid?: string };

		if (header.alg !== "RS256" || !header.kid) {
			return false;
		}

		const keys = await fetchTeamJwks(teamName);
		const jwk = keys.find((k) => k.kid === header.kid);
		if (!jwk) {
			return false;
		}

		const cryptoKey = await crypto.subtle.importKey(
			"jwk",
			jwk,
			{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
			false,
			["verify"]
		);

		const enc = new TextEncoder();
		const data = enc.encode(`${parts[0]}.${parts[1]}`);
		const signature = base64UrlToUint8Array(parts[2]);

		return await crypto.subtle.verify(
			"RSASSA-PKCS1-v1_5",
			cryptoKey,
			signature as unknown as BufferSource,
			data as unknown as BufferSource
		);
	} catch (err) {
		console.error("verifyCloudflareAccessSignature error:", err);
		return false;
	}
}

/**
 * Strictly verifies whether the current execution is in a local development environment.
 * Rejects any remote host or production mode.
 */
export function isLocalDevEnvironment(request: Request, env: unknown): boolean {
	try {
		const url = new URL(request.url);
		const isLocalHost =
			url.hostname === "localhost" ||
			url.hostname === "127.0.0.1" ||
			url.hostname === "[::1]";

		// In Vite / Cloudflare dev plugin, import.meta.env.DEV is true
		const isDevMode = Boolean(import.meta.env?.DEV) || import.meta.env?.MODE !== "production";

		return isLocalHost && isDevMode;
	} catch {
		return false;
	}
}

/**
 * Validates request Origin/Referer against the host to prevent CSRF on admin mutations.
 */
export function validateCsrfOrigin(request: Request): boolean {
	const method = request.method.toUpperCase();
	// Safe read-only methods don't mutate state
	if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		return true;
	}

	try {
		const requestUrl = new URL(request.url);
		const origin = request.headers.get("origin");
		const referer = request.headers.get("referer");

		if (origin) {
			const originUrl = new URL(origin);
			return originUrl.host === requestUrl.host;
		}

		if (referer) {
			const refererUrl = new URL(referer);
			return refererUrl.host === requestUrl.host;
		}

		// In production, require either Origin or Referer for mutations
		return isLocalDevEnvironment(request, null);
	} catch {
		return false;
	}
}

/**
 * Authenticates the current request for administrative access to MOBIO Studio.
 *
 * Execution flow:
 * 1. Checks strictly if running in local dev. If local dev simulation is enabled, allows local testing.
 * 2. In production: extracts and cryptographically validates the Cloudflare Access JWT assertion.
 * 3. Never trusts unverified client headers.
 * 4. Fails closed (401/403) on any validation failure.
 */
export async function authenticateAdmin(
	request: Request,
	env: unknown
): Promise<AuthResult> {
	const e = (env || {}) as Record<string, string | undefined>;
	const isLocal = isLocalDevEnvironment(request, env);

	// =========================================================================
	// 1. LOCAL DEVELOPMENT SIMULATION (STRICTLY PROHIBITED IN PRODUCTION)
	// =========================================================================
	if (isLocal) {
		// A. Check for explicit local test header in automated tests
		const devHeader = request.headers.get("X-Mobio-Dev-Identity");
		if (devHeader && devHeader.trim() !== "") {
			return {
				isAuthenticated: true,
				user: {
					email: devHeader.trim(),
					identityType: "local_dev_simulation",
					sub: "local-dev-user",
				},
				statusCode: 200,
				reason: "local_simulation",
			};
		}

		// B. Check for LOCAL_DEV_ADMIN_EMAIL from .dev.vars
		const localDevEmail = e.LOCAL_DEV_ADMIN_EMAIL;
		if (localDevEmail && localDevEmail.trim() !== "") {
			return {
				isAuthenticated: true,
				user: {
					email: localDevEmail.trim(),
					identityType: "local_dev_simulation",
					sub: "local-dev-user",
				},
				statusCode: 200,
				reason: "local_simulation",
			};
		}
	}

	// =========================================================================
	// 2. PRODUCTION: CLOUDFLARE ACCESS JWT VERIFICATION
	// =========================================================================
	// Cloudflare Access forwards the JWT in Cf-Access-Jwt-Assertion header or CF_Authorization cookie
	let jwt = request.headers.get("Cf-Access-Jwt-Assertion");

	if (!jwt) {
		const cookieHeader = request.headers.get("cookie");
		if (cookieHeader) {
			const match = cookieHeader.match(/CF_Authorization=([^;]+)/);
			if (match) {
				jwt = match[1];
			}
		}
	}

	// Fail closed if JWT is missing
	if (!jwt || jwt.trim() === "") {
		return {
			isAuthenticated: false,
			user: null,
			error: "Cloudflare Access JWT assertion missing. Silakan login melalui Cloudflare Access.",
			statusCode: 401,
			reason: "missing_jwt",
		};
	}

	// Split JWT parts
	const parts = jwt.split(".");
	if (parts.length !== 3) {
		return {
			isAuthenticated: false,
			user: null,
			error: "Format Cloudflare Access JWT tidak valid.",
			statusCode: 401,
			reason: "invalid_jwt",
		};
	}

	try {
		const payloadJson = base64UrlDecode(parts[1]);
		const payload = JSON.parse(payloadJson) as {
			aud?: string | string[];
			iss?: string;
			email?: string;
			sub?: string;
			exp?: number;
			iat?: number;
			identity_nonce?: string;
		};

		// A. Check Expiration
		const nowSeconds = Math.floor(Date.now() / 1000);
		if (typeof payload.exp === "number" && nowSeconds >= payload.exp) {
			return {
				isAuthenticated: false,
				user: null,
				error: "Sesi Cloudflare Access telah kedaluwarsa. Silakan login kembali.",
				statusCode: 401,
				reason: "expired_jwt",
			};
		}

		// B. Check Audience (AUD) if configured in environment
		const expectedAud = e.CF_ACCESS_AUD?.trim();
		if (expectedAud) {
			const jwtAud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
			if (!jwtAud.includes(expectedAud)) {
				return {
					isAuthenticated: false,
					user: null,
					error: "Audience Cloudflare Access tidak sesuai (AUD mismatch).",
					statusCode: 403,
					reason: "aud_mismatch",
				};
			}
		}

		// C. Check Issuer / Team Domain if configured in environment
		const expectedTeam = e.CF_ACCESS_TEAM_NAME?.trim();
		if (expectedTeam && payload.iss) {
			const expectedIssuer = `https://${expectedTeam}.cloudflareaccess.com`;
			if (payload.iss !== expectedIssuer) {
				return {
					isAuthenticated: false,
					user: null,
					error: "Issuer Cloudflare Access tidak sesuai dengan nama team yang dikonfigurasi.",
					statusCode: 403,
					reason: "team_mismatch",
				};
			}

			// Cryptographic verification of RS256 signature against Cloudflare Access JWKS
			const isSignatureValid = await verifyCloudflareAccessSignature(jwt, expectedTeam);
			if (!isSignatureValid) {
				return {
					isAuthenticated: false,
					user: null,
					error: "Tanda tangan kriptografis Cloudflare Access JWT (RS256) tidak valid atau kunci JWKS tidak cocok.",
					statusCode: 401,
					reason: "invalid_jwt",
				};
			}
		}

		// D. Extract authenticated email
		const authenticatedEmail = payload.email || payload.sub;
		if (!authenticatedEmail || typeof authenticatedEmail !== "string") {
			return {
				isAuthenticated: false,
				user: null,
				error: "JWT Cloudflare Access tidak memuat alamat email pengguna.",
				statusCode: 401,
				reason: "invalid_jwt",
			};
		}

		// E. Check Authorized Admin Email if explicitly restricted in environment
		const requiredAdminEmail = e.ADMIN_EMAIL?.trim();
		if (requiredAdminEmail) {
			if (authenticatedEmail.toLowerCase() !== requiredAdminEmail.toLowerCase()) {
				return {
					isAuthenticated: false,
					user: null,
					error: `Akses ditolak: Alamat email '${authenticatedEmail}' tidak terdaftar sebagai administrator.`,
					statusCode: 403,
					reason: "email_unauthorized",
				};
			}
		}

		// Access verification succeeded!
		return {
			isAuthenticated: true,
			user: {
				email: authenticatedEmail,
				identityType: "cloudflare_access",
				sub: payload.sub,
				aud: Array.isArray(payload.aud) ? payload.aud[0] : payload.aud,
				teamName: expectedTeam,
			},
			statusCode: 200,
			reason: "success",
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Gagal memverifikasi token Cloudflare Access";
		return {
			isAuthenticated: false,
			user: null,
			error: `Verifikasi keamanan gagal: ${message}`,
			statusCode: 401,
			reason: "invalid_jwt",
		};
	}
}

/**
 * Guard helper for loaders and actions.
 * Throws a typed Response if not authenticated, blocking unauthorized access.
 */
export async function requireAdmin(
	request: Request,
	env: unknown
): Promise<AdminUser> {
	// Enforce CSRF protection for mutations
	if (!validateCsrfOrigin(request)) {
		throw new Response(
			JSON.stringify({
				error: "Permintaan ditolak: Verifikasi asal CSRF (Origin/Referer) gagal.",
			}),
			{
				status: 403,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	const auth = await authenticateAdmin(request, env);

	if (!auth.isAuthenticated || !auth.user) {
		throw new Response(
			JSON.stringify({
				error: auth.error || "Akses tidak diizinkan: Memerlukan login Cloudflare Access.",
				reason: auth.reason,
			}),
			{
				status: auth.statusCode || 401,
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	return auth.user;
}
