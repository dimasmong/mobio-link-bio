# Contributing to MOBIO Link Bio

Thank you for your interest in contributing to **MOBIO Link Bio**! We welcome bug reports, feature requests, documentation improvements, and code contributions from the community.

---

## 🔒 Security First

**NEVER** share private credentials, Cloudflare API tokens, secret keys, or production configuration in issues, discussions, or pull requests.
If you believe you have discovered a security vulnerability, please follow the guidelines in [SECURITY.md](SECURITY.md) to report it privately and responsibly.

---

## 📋 Code of Conduct

By participating in this project, you agree to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all contributors with respect and professionalism.

---

## 🐛 Reporting Bugs

Before submitting a bug report:
1. Search existing [GitHub Issues](https://github.com/dimasmong/mobio-link-bio/issues) to ensure the issue has not already been reported.
2. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for common setup and deployment questions.
3. If reporting a new issue, use the **Bug Report** template and provide:
   - A clear and descriptive title.
   - Exact steps to reproduce the behavior.
   - Operating system and Node.js version.
   - Relevant terminal output or logs (with any private tokens redacted).

---

## 💡 Suggesting Features & Enhancements

We welcome creative ideas to expand themes, presets, layout configurations, and self-hosted functionality!
1. Check existing issues or discussions before submitting a feature request.
2. Use the **Feature Request** template to outline:
   - The problem your proposal solves.
   - The proposed solution and design considerations.
   - Potential impact on existing self-hosted instances.

---

## 💻 Development Workflow

### Prerequisites
- **Node.js:** v20.x or v22.x LTS (tested up to v24.x)
- **npm:** v10.x or higher
- **Cloudflare Account:** Required for Cloudflare Workers, D1, and R2

### Getting Started Locally
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mobio-link-bio.git
   cd mobio-link-bio
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy local environment variables:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Quality Assurance

Before submitting any Pull Request, ensure that all verification suites pass:

```bash
# 1. Typecheck & Cloudflare Workers Typegen
npm run typecheck

# 2. Production SSR & Client Build
npm run build

# 3. Fresh D1 Database Migration Verification
node scripts/test-fresh-d1-migration.mjs

# 4. Bilingual Verification Suite
node scripts/test-v4-2-i18n.mjs

# 5. Security Hardening Suite (Fail-Closed Auth & Anti-Spoofing)
npx tsx scripts/test-security-hardening.mjs
```

---

## 📤 Submitting a Pull Request

1. Create a descriptive branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes with clear, semantic commit messages (e.g. `feat:`, `fix:`, `docs:`, `refactor:`).
3. Do not commit `.dev.vars`, `.env`, temporary test artifacts, or credentials.
4. Ensure all unit and integration tests pass.
5. Push to your fork and submit a Pull Request to the upstream repository.
6. Complete all checklist items in the [Pull Request Template](.github/pull_request_template.md).
