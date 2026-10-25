import { execSync } from "child_process";
import { authenticateAdmin, isLocalDevEnvironment, validateCsrfOrigin } from "../app/lib/auth.server.js";

const BASE_URL = process.env.TEST_URL || "http://localhost:5173";

function makeJwt(header, payload, sig = "dummy-sig") {
	const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
	return `${b64(header)}.${b64(payload)}.${Buffer.from(sig).toString("base64url")}`;
}

async function runSecurityHardeningTests() {
	console.log("============================================================");
	console.log("MOBIO STUDIO — FINAL SECURITY HARDENING AUDIT");
	console.log("Comprehensive Negative Tests, Header Spoofing & Auth Guard");
	console.log("============================================================\n");

	const report = {
		unauthenticatedApiBlocked: {},
		csrfOriginValidation: false,
		forgedHeaderRejection: false,
		openRedirectProtection: false,
		minimalPrivacyTelemetryD1: false,
		unitTestsFailClosedAuth: false,
	};

	// -------------------------------------------------------------------------
	// 1. ALL STUDIO API ENDPOINTS REJECT UNAUTHENTICATED REQUESTS
	// -------------------------------------------------------------------------
	console.log("TEST 1: Verifying ALL 17 Studio API Endpoints Fail-Closed (No Auth)...");
	const endpoints = [
		{ path: "/api/studio/status", method: "GET" },
		{ path: "/api/studio/profile", method: "GET" },
		{ path: "/api/studio/profile", method: "POST", body: JSON.stringify({ name: "Hacked" }) },
		{ path: "/api/studio/links", method: "GET" },
		{ path: "/api/studio/links", method: "POST", body: JSON.stringify({ title_id: "Hacked" }) },
		{ path: "/api/studio/contact", method: "GET" },
		{ path: "/api/studio/contact", method: "POST", body: JSON.stringify({ value: "Hacked" }) },
		{ path: "/api/studio/explore", method: "GET" },
		{ path: "/api/studio/explore", method: "POST", body: JSON.stringify({ title_id: "Hacked" }) },
		{ path: "/api/studio/appearance", method: "GET" },
		{ path: "/api/studio/appearance", method: "POST", body: JSON.stringify({ palette: "hacked" }) },
		{ path: "/api/studio/media", method: "GET" },
		{ path: "/api/studio/media/00000000-0000-0000-0000-000000000000/preview", method: "GET" },
		{ path: "/api/studio/publish", method: "POST", body: JSON.stringify({}) },
		{ path: "/api/studio/discard", method: "POST", body: JSON.stringify({}) },
		{ path: "/api/studio/analytics", method: "GET" },
		{ path: "/api/studio/analytics", method: "DELETE" },
	];

	let allEndpointsBlocked = true;
	for (const ep of endpoints) {
		try {
			const res = await fetch(`${BASE_URL}${ep.path}`, {
				method: ep.method,
				headers: { "Content-Type": "application/json" },
				body: ep.body,
			});
			const isBlocked = res.status === 401 || res.status === 403;
			report.unauthenticatedApiBlocked[`${ep.method} ${ep.path}`] = {
				status: res.status,
				passed: isBlocked,
			};
			if (!isBlocked) {
				console.error(`  ❌ FAILED: ${ep.method} ${ep.path} returned HTTP ${res.status}`);
				allEndpointsBlocked = false;
			}
		} catch (err) {
			console.error(`  ❌ ERROR querying ${ep.method} ${ep.path}:`, err.message);
			allEndpointsBlocked = false;
		}
	}

	if (allEndpointsBlocked) {
		console.log("  ✅ All 17 route/method combinations correctly rejected unauthorized access (HTTP 401/403).");
	}

	// -------------------------------------------------------------------------
	// 2. FORGED-HEADER ATTACK & DEV-IDENTITY SPOOFING
	// -------------------------------------------------------------------------
	console.log("\nTEST 2: Testing Forged Header Attacks & Dev-Identity Spoofing...");
	try {
		// Attempt A: Send proxy forwarded host header claiming to be forwarded from another host
		const proxySpoofRes = await fetch(`${BASE_URL}/api/studio/status`, {
			headers: {
				"X-Forwarded-Host": "attacker.com",
				"X-Mobio-Dev-Identity": "attacker@evil.com",
			},
		});
		const proxySpoofBlocked = proxySpoofRes.status === 401 || proxySpoofRes.status === 403;

		// Attempt B: Send proto spoofing
		const protoSpoofRes = await fetch(`${BASE_URL}/api/studio/status`, {
			headers: {
				"X-Forwarded-Proto": "https",
				"X-Mobio-Dev-Identity": "attacker@evil.com",
			},
		});
		const protoSpoofBlocked = protoSpoofRes.status === 401 || protoSpoofRes.status === 403;

		if (proxySpoofBlocked && protoSpoofBlocked) {
			console.log("  ✅ Forged forwarded headers correctly blocked from triggering local development bypass.");
			report.forgedHeaderRejection = true;
		} else {
			console.error("  ❌ Forged header test failed:", { proxySpoofBlocked, protoSpoofBlocked });
		}
	} catch (err) {
		console.error("  ❌ Error in forged-header test:", err.message);
	}

	// -------------------------------------------------------------------------
	// 3. CSRF ORIGIN / REFERER ENFORCEMENT ON MUTATIONS
	// -------------------------------------------------------------------------
	console.log("\nTEST 3: Testing CSRF Protection on Mutations...");
	try {
		// Attempt cross-site mutation with untrusted foreign origin
		const csrfRes = await fetch(`${BASE_URL}/api/studio/links`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "https://malicious-evil-attacker.com",
				"X-Mobio-Dev-Identity": "admin@localhost.local",
			},
			body: JSON.stringify({
				title_id: "CSRF Injected Link",
				title_en: "CSRF Injected Link",
				url: "https://example.com",
			}),
		});

		const isCsrfRejected = csrfRes.status === 403;
		console.log(`  CSRF Attack Response Status: ${csrfRes.status} (Expected 403)`);

		if (isCsrfRejected) {
			console.log("  ✅ CSRF cross-origin mutation blocked with HTTP 403.");
			report.csrfOriginValidation = true;
		} else {
			console.error("  ❌ CSRF attack succeeded or returned unexpected status:", csrfRes.status);
		}
	} catch (err) {
		console.error("  ❌ Error testing CSRF protection:", err.message);
	}

	// -------------------------------------------------------------------------
	// 4. OPEN-REDIRECT PREVENTION & QUERY PARAMETER OVERRIDE IMMUNITY
	// -------------------------------------------------------------------------
	console.log("\nTEST 4: Testing Open-Redirect & Parameter Override Immunity...");
	const testLinkId = `sec-test-${Date.now()}`;
	const legitimateDest = "https://example.com/safe-destination";

	try {
		// Insert a test link directly into D1
		execSync(
			`npx.cmd wrangler d1 execute mobio-db --local --command "INSERT INTO links (id, title_id, title_en, url, platform, icon, sort_order, is_enabled, created_at, updated_at) VALUES ('${testLinkId}', 'Sec Test', 'Sec Test', '${legitimateDest}', 'website', 'globe', 999, 1, datetime('now'), datetime('now'));"`,
			{ encoding: "utf8" }
		);

		// 4A: Attempt open-redirect via query param injection: /go/:linkId?url=https://evil.com
		const redirectRes = await fetch(`${BASE_URL}/go/${testLinkId}?url=https://evil-attacker.com&target=https://evil-attacker.com`, {
			redirect: "manual",
		});
		const locationHeader = redirectRes.headers.get("location");
		const cacheControl = redirectRes.headers.get("cache-control");

		const isStrictRedirect = locationHeader === legitimateDest;
		const isNoStore = cacheControl?.includes("no-store");

		// 4B: Non-existent link ID -> 404
		const nonExistentRes = await fetch(`${BASE_URL}/go/non-existent-link-uuid-12345`, {
			redirect: "manual",
		});
		const is404 = nonExistentRes.status === 404;

		if (isStrictRedirect && isNoStore && is404) {
			console.log("  ✅ Open-redirect attempt safely ignored. Destination strictly pulled from D1.");
			console.log("  ✅ Non-existent link returned 404. Cache-Control set to no-store.");
			report.openRedirectProtection = true;
		} else {
			console.error("  ❌ Open redirect check failed:", { isStrictRedirect, locationHeader, isNoStore, is404 });
		}
	} catch (err) {
		console.error("  ❌ Error testing open-redirect:", err.message);
	} finally {
		// Clean up test link
		try {
			execSync(
				`npx.cmd wrangler d1 execute mobio-db --local --command "DELETE FROM links WHERE id='${testLinkId}'; DELETE FROM click_events WHERE link_id='${testLinkId}';"`,
				{ encoding: "utf8" }
			);
		} catch {}
	}

	// -------------------------------------------------------------------------
	// 5. MINIMAL PRIVACY TELEMETRY D1 SCHEMA AUDIT
	// -------------------------------------------------------------------------
	console.log("\nTEST 5: Auditing D1 click_events Table for Zero PII & Zero UA Hashes...");
	try {
		const pragmaOutput = execSync(
			'npx.cmd wrangler d1 execute mobio-db --local --command "PRAGMA table_info(click_events);"',
			{ encoding: "utf8" }
		);

		const hasUserAgentHash = pragmaOutput.includes("user_agent_hash");
		const hasCountry = pragmaOutput.includes("country");
		const hasLinkId = pragmaOutput.includes("link_id");
		const hasClickedAt = pragmaOutput.includes("clicked_at");
		const hasReferrer = pragmaOutput.includes("referrer");

		if (!hasUserAgentHash && !hasCountry && hasLinkId && hasClickedAt && hasReferrer) {
			console.log("  ✅ Table click_events confirmed minimal: zero user_agent_hash, zero country, strictly link_id, clicked_at, referrer, id.");
			report.minimalPrivacyTelemetryD1 = true;
		} else {
			console.error("  ❌ Column audit failed: persistent identifier fields detected:", { hasUserAgentHash, hasCountry });
		}
	} catch (err) {
		console.error("  ❌ Error inspecting D1 schema:", err.message);
	}

	// -------------------------------------------------------------------------
	// 6. UNIT TESTS: FAIL-CLOSED AUTHENTICATION & JWT CLAIMS
	// -------------------------------------------------------------------------
	console.log("\nTEST 6: Running Direct Unit Tests for Fail-Closed Auth & Claims...");
	try {
		let unitSuccess = true;

		// 6.1: isLocalDevEnvironment rejects if CF_ACCESS_TEAM_NAME is present
		const devReq = new Request("http://localhost:5173/studio", { method: "GET" });
		const envWithProdVars = { CF_ACCESS_TEAM_NAME: "myteam", CF_ACCESS_AUD: "myaud" };
		const localBlockedWithProdVars = !isLocalDevEnvironment(devReq, envWithProdVars);
		if (!localBlockedWithProdVars) {
			console.error("  ❌ isLocalDevEnvironment allowed bypass when CF_ACCESS_TEAM_NAME is configured!");
			unitSuccess = false;
		} else {
			console.log("  ✅ isLocalDevEnvironment strictly returns false if CF_ACCESS variables are configured.");
		}

		// 6.2: isLocalDevEnvironment rejects if request hostname is not localhost
		const remoteReq = new Request("https://my-mobio-domain.com/studio", { method: "GET" });
		if (isLocalDevEnvironment(remoteReq, {})) {
			console.error("  ❌ isLocalDevEnvironment allowed bypass for remote host!");
			unitSuccess = false;
		} else {
			console.log("  ✅ isLocalDevEnvironment rejects remote domain requests.");
		}

		// 6.3: authenticateAdmin fails closed when JWT is missing in production
		const noAuthProdRes = await authenticateAdmin(remoteReq, envWithProdVars);
		if (noAuthProdRes.isAuthenticated || noAuthProdRes.statusCode !== 401 || noAuthProdRes.reason !== "missing_jwt") {
			console.error("  ❌ authenticateAdmin did not fail-closed with 401 missing_jwt on unauthenticated request:", noAuthProdRes);
			unitSuccess = false;
		} else {
			console.log("  ✅ authenticateAdmin returns 401 missing_jwt when no JWT is provided in production.");
		}

		// 6.4: authenticateAdmin fails closed with 500 team_mismatch if JWT is sent but CF_ACCESS config is missing
		const dummyJwt = makeJwt({ alg: "RS256", kid: "k1" }, { sub: "user@test.com" });
		const jwtReqWithoutConfig = new Request("https://my-mobio-domain.com/studio", {
			headers: { "Cf-Access-Jwt-Assertion": dummyJwt },
		});
		const missingConfigRes = await authenticateAdmin(jwtReqWithoutConfig, {});
		if (missingConfigRes.isAuthenticated || missingConfigRes.statusCode !== 500 || missingConfigRes.reason !== "team_mismatch") {
			console.error("  ❌ authenticateAdmin did not fail-closed with 500 when JWT is provided without server config:", missingConfigRes);
			unitSuccess = false;
		} else {
			console.log("  ✅ authenticateAdmin returns 500 fail-closed if production JWT is received without server config.");
		}

		// 6.5: authenticateAdmin rejects malformed JWT
		const malformedReq = new Request("https://my-mobio-domain.com/studio", {
			headers: { "Cf-Access-Jwt-Assertion": "not.a.valid.jwt.string" },
		});
		const malformedRes = await authenticateAdmin(malformedReq, envWithProdVars);
		if (malformedRes.isAuthenticated || malformedRes.statusCode !== 401 || malformedRes.reason !== "invalid_jwt") {
			console.error("  ❌ authenticateAdmin did not reject malformed JWT with 401 invalid_jwt:", malformedRes);
			unitSuccess = false;
		} else {
			console.log("  ✅ authenticateAdmin rejects malformed JWT with 401 invalid_jwt.");
		}

		// 6.6: authenticateAdmin rejects expired JWT
		const expiredPayload = {
			aud: "myaud",
			iss: "https://myteam.cloudflareaccess.com",
			email: "admin@example.com",
			sub: "admin@example.com",
			exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
		};
		const expiredJwt = makeJwt({ alg: "RS256", kid: "k1" }, expiredPayload);
		const expiredReq = new Request("https://my-mobio-domain.com/studio", {
			headers: { "Cf-Access-Jwt-Assertion": expiredJwt },
		});
		const expiredRes = await authenticateAdmin(expiredReq, envWithProdVars);
		if (expiredRes.isAuthenticated || expiredRes.statusCode !== 401 || expiredRes.reason !== "expired_jwt") {
			console.error("  ❌ authenticateAdmin did not reject expired JWT with 401 expired_jwt:", expiredRes);
			unitSuccess = false;
		} else {
			console.log("  ✅ authenticateAdmin rejects expired JWT with 401 expired_jwt.");
		}

		// 6.7: authenticateAdmin rejects AUD mismatch
		const wrongAudPayload = {
			aud: "different-aud",
			iss: "https://myteam.cloudflareaccess.com",
			email: "admin@example.com",
			sub: "admin@example.com",
			exp: Math.floor(Date.now() / 1000) + 3600,
		};
		const wrongAudJwt = makeJwt({ alg: "RS256", kid: "k1" }, wrongAudPayload);
		const wrongAudReq = new Request("https://my-mobio-domain.com/studio", {
			headers: { "Cf-Access-Jwt-Assertion": wrongAudJwt },
		});
		const wrongAudRes = await authenticateAdmin(wrongAudReq, envWithProdVars);
		if (wrongAudRes.isAuthenticated || wrongAudRes.statusCode !== 403 || wrongAudRes.reason !== "aud_mismatch") {
			console.error("  ❌ authenticateAdmin did not reject AUD mismatch with 403 aud_mismatch:", wrongAudRes);
			unitSuccess = false;
		} else {
			console.log("  ✅ authenticateAdmin rejects AUD mismatch with 403 aud_mismatch.");
		}

		// 6.8: authenticateAdmin rejects Team / ISS mismatch
		const wrongIssPayload = {
			aud: "myaud",
			iss: "https://wrongteam.cloudflareaccess.com",
			email: "admin@example.com",
			sub: "admin@example.com",
			exp: Math.floor(Date.now() / 1000) + 3600,
		};
		const wrongIssJwt = makeJwt({ alg: "RS256", kid: "k1" }, wrongIssPayload);
		const wrongIssReq = new Request("https://my-mobio-domain.com/studio", {
			headers: { "Cf-Access-Jwt-Assertion": wrongIssJwt },
		});
		const wrongIssRes = await authenticateAdmin(wrongIssReq, envWithProdVars);
		if (wrongIssRes.isAuthenticated || wrongIssRes.statusCode !== 403 || wrongIssRes.reason !== "team_mismatch") {
			console.error("  ❌ authenticateAdmin did not reject ISS mismatch with 403 team_mismatch:", wrongIssRes);
			unitSuccess = false;
		} else {
			console.log("  ✅ authenticateAdmin rejects ISS mismatch with 403 team_mismatch.");
		}

		// 6.9: authenticateAdmin rejects unverified cryptographic signature (fake/unsigned JWT)
		const forgedSigPayload = {
			aud: "myaud",
			iss: "https://myteam.cloudflareaccess.com",
			email: "admin@example.com",
			sub: "admin@example.com",
			exp: Math.floor(Date.now() / 1000) + 3600,
		};
		const forgedSigJwt = makeJwt({ alg: "RS256", kid: "untrusted-kid" }, forgedSigPayload, "forged-signature-bytes");
		const forgedSigReq = new Request("https://my-mobio-domain.com/studio", {
			headers: { "Cf-Access-Jwt-Assertion": forgedSigJwt },
		});
		const forgedSigRes = await authenticateAdmin(forgedSigReq, envWithProdVars);
		if (forgedSigRes.isAuthenticated || forgedSigRes.statusCode !== 401 || forgedSigRes.reason !== "invalid_jwt") {
			console.error("  ❌ authenticateAdmin did not reject forged signature with 401 invalid_jwt:", forgedSigRes);
			unitSuccess = false;
		} else {
			console.log("  ✅ authenticateAdmin rejects invalid cryptographic signature with 401 invalid_jwt.");
		}

		// 6.10: validateCsrfOrigin unit checks
		const sameOriginReq = new Request("https://my-mobio.com/api/studio/profile", {
			method: "POST",
			headers: { Origin: "https://my-mobio.com" },
		});
		const crossOriginReq = new Request("https://my-mobio.com/api/studio/profile", {
			method: "POST",
			headers: { Origin: "https://evil.com" },
		});
		const getReq = new Request("https://my-mobio.com/api/studio/profile", {
			method: "GET",
			headers: { Origin: "https://evil.com" },
		});

		if (!validateCsrfOrigin(sameOriginReq)) {
			console.error("  ❌ validateCsrfOrigin rejected matching origin!");
			unitSuccess = false;
		}
		if (validateCsrfOrigin(crossOriginReq)) {
			console.error("  ❌ validateCsrfOrigin accepted mismatched origin!");
			unitSuccess = false;
		}
		if (!validateCsrfOrigin(getReq)) {
			console.error("  ❌ validateCsrfOrigin rejected safe GET method!");
			unitSuccess = false;
		}

		if (unitSuccess) {
			console.log("  ✅ CSRF origin validation unit checks passed for matching, cross-origin, and safe GET.");
			report.unitTestsFailClosedAuth = true;
		}
	} catch (err) {
		console.error("  ❌ Error in auth unit tests:", err);
	}

	// -------------------------------------------------------------------------
	// FINAL RESULTS
	// -------------------------------------------------------------------------
	console.log("\n============================================================");
	console.log("SECURITY HARDENING AUDIT SUMMARY");
	console.log("============================================================");
	console.log(JSON.stringify(report, null, 2));

	const allPassed =
		allEndpointsBlocked &&
		report.forgedHeaderRejection &&
		report.csrfOriginValidation &&
		report.openRedirectProtection &&
		report.minimalPrivacyTelemetryD1 &&
		report.unitTestsFailClosedAuth;

	if (allPassed) {
		console.log("\n🎉 ALL SECURITY HARDENING TESTS PASSED SUCCESSFULLY!\n");
		process.exit(0);
	} else {
		console.error("\n❌ SOME SECURITY HARDENING TESTS FAILED.\n");
		process.exit(1);
	}
}

runSecurityHardeningTests().catch((err) => {
	console.error("Fatal test error:", err);
	process.exit(1);
});
