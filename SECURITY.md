# Security Policy

The security and privacy of **MOBIO Link Bio** and its self-hosted instances are paramount. This document outlines our security policies, supported versions, and how to responsibly report vulnerabilities.

---

## 🛡️ Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| **v4.x (Latest)** | ✅ Yes | Actively maintained (Cloudflare Access, D1, R2, Full Bilingual) |
| < v4.0 | ❌ No | Deprecated legacy releases |

Self-hosters are strongly encouraged to keep their deployments up to date with the latest release.

---

## 🔒 Security Architecture Highlights

MOBIO is built with a **fail-closed, defense-in-depth** security model:

1. **Zero Trust Authentication:**
   - Administrative endpoints (`/studio*` and `/api/studio/*`) require Cloudflare Access.
   - Production requests must provide a cryptographically valid `Cf-Access-Jwt-Assertion`.
   - The edge Worker cryptographically verifies the **RS256** signature against Cloudflare's public JWKS certificates, validates the Audience (`aud`), checks Issuer (`iss`), and enforces expiration (`exp`).
   - If configuration (`CF_ACCESS_TEAM_NAME` or `CF_ACCESS_AUD`) is missing or invalid, all studio routes **fail closed** with HTTP 401/403/500.

2. **Local Simulation Isolation:**
   - Local simulation headers (`X-Mobio-Dev-Identity`) are restricted strictly to loopback addresses (`localhost`, `127.0.0.1`, `[::1]`) in non-production builds.
   - Any request bearing reverse-proxy forwarding headers (`x-forwarded-for`, `x-forwarded-host`, `forwarded`) or accessing remote hosts is automatically disqualified from local dev simulation.

3. **CSRF & Mutation Guards:**
   - All state-altering HTTP methods (`POST`, `PUT`, `DELETE`) validate `Origin` and `Referer` headers against the host.

4. **Privacy-Preserving Telemetry:**
   - Click telemetry (`/go/:linkId`) collects zero Personally Identifiable Information (PII).
   - Raw IP addresses and persistent tracking cookies are never stored.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within MOBIO Link Bio, **please DO NOT open a public issue or discussion**.

Instead, report it responsibly through one of the following private channels:

1. **GitHub Private Vulnerability Reporting (Preferred):**
   - Go to the **Security** tab of the repository.
   - Click **Report a vulnerability** to submit an advisory privately to the maintainers.

2. **Direct Contact:**
   - If GitHub private reporting is unavailable, contact the project maintainer via the profile link on [GitHub (@dimasmong)](https://github.com/dimasmong).

### Please Include in Your Report:
- A clear description of the vulnerability.
- Step-by-step instructions to reproduce the issue (proof of concept).
- Potential impact on self-hosted instances.
- Any suggested remediations or patches.

### Our Commitment:
- We will acknowledge receipt of your vulnerability report within 48 hours.
- We will provide an estimated timeline for remediation.
- We will credit you in the release notes (if desired) once a security patch is published.
