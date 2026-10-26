# Local Development Guide

This guide explains how to set up, run, test, and contribute to **MOBIO Link Bio** on your local machine.

---

## 📑 Table of Contents

1. [Local Environment Setup](#1-local-environment-setup)
2. [How Edge Emulation Works](#2-how-edge-emulation-works)
3. [Local Database & Migrations](#3-local-database--migrations)
4. [Testing Suite](#4-testing-suite)
5. [Code Style & Architecture Conventions](#5-code-style--architecture-conventions)
6. [Working with Internationalization (i18n)](#6-working-with-internationalization-i18n)
7. [Adding New Themes & Layout Presets](#7-adding-new-themes--layout-presets)

---

## 1. Local Environment Setup

### Prerequisites
- **Node.js:** v20.x, v22.x LTS, or v24.x
- **npm:** v10.x or higher

### Initial Setup
```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/mobio-link-bio.git
cd mobio-link-bio

# 2. Install dependencies
npm install

# 3. Create your isolated local instance configuration
# Windows CMD:
copy wrangler.example.json wrangler.instance.json
# PowerShell / macOS / Linux:
cp wrangler.example.json wrangler.instance.json

# 4. Create local development variables file
# Windows CMD:
copy .dev.vars.example .dev.vars
# PowerShell / macOS / Linux:
cp .dev.vars.example .dev.vars

# 5. Apply migrations to your local SQLite database
npx wrangler d1 migrations apply DB --local --config wrangler.instance.json

# 6. Start the local development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

---

## 2. How Edge Emulation Works

MOBIO uses `@cloudflare/vite-plugin` paired with Vite's Environment API:

- In development (`npm run dev`), Cloudflare's open-source `workerd` runtime emulates Cloudflare Workers directly within the Vite dev server.
- `vite.config.ts` dynamically detects `wrangler.instance.json` when present, binding your personal local D1 database and R2 storage seamlessly. If absent, it defaults safely to `wrangler.json`.
- Bindings like `context.cloudflare.env.DB` and `context.cloudflare.env.MEDIA_BUCKET` are fully operational locally.
- Server-side loaders and actions execute in the emulated worker environment, mirroring production behavior with high fidelity.

---

## 3. Local Database & Migrations

Local D1 data is persisted inside `.wrangler/state/v3/d1/`.

### Applying Migrations Locally
```bash
npx wrangler d1 migrations apply DB --local
```

### Inspecting Local Data
To run raw SQL queries against your local development database:
```bash
npx wrangler d1 execute DB --local --command "SELECT * FROM profile;"
```

### Resetting Local Database
To start with a fresh local database:
```bash
# Delete the local state directory (does NOT affect production)
rm -rf .wrangler/state/v3/d1

# Re-apply all migrations
npx wrangler d1 migrations apply DB --local
```

---

## 4. Testing Suite

MOBIO includes comprehensive automated verification suites:

### 1. Static Typecheck
```bash
npm run typecheck
```
Generates Wrangler runtime types and validates TypeScript code under strict mode.

### 2. Full Production Build
```bash
npm run build
```
Compiles both the Vite SSR edge server bundle and client hydration assets.

### 3. Fresh D1 Database Migration Test
```bash
node scripts/test-fresh-d1-migration.mjs
```
Applies migrations 0001 through 0011 to a clean in-memory database and validates schemas, tables, and privacy guarantees.

### 4. Bilingual Integration Verification
```bash
node scripts/test-v4-2-i18n.mjs
```
Simulates full user journeys verifying English defaults, dynamic Indonesian switching, SSR cookie persistence, and Studio dashboard localization.

### 5. Security Hardening Audit
```bash
npx tsx scripts/test-security-hardening.mjs
```
Runs 17 API fail-closed negative tests, forged header spoofing rejection, CSRF origin verification, and RS256 JWKS signature validation.

---

## 5. Code Style & Architecture Conventions

- **React Router v7 Framework Mode:** Always use route module loaders and actions (`+types/route_name`) for server-side logic.
- **Tailwind CSS v4:** Styles are defined in `app/app.css` using modern CSS variables and Tailwind directives (`@import "tailwindcss"`).
- **Fail-Closed Security:** Never bypass authentication checks or trust client-supplied headers without server-side cryptographic verification.
- **Documentation Integrity:** Preserve existing code comments and architectural explanations.

---

## 6. Working with Internationalization (i18n)

All user-facing strings belong in [`app/lib/i18n.ts`](../app/lib/i18n.ts).

### Adding a New String
1. Open `app/lib/i18n.ts`.
2. Add the key under the appropriate category (`nav`, `public`, `studio`, or `common`):
   ```typescript
   en: {
     myFeature: {
       title: "My Feature",
     },
   },
   id: {
     myFeature: {
       title: "Fitur Saya",
     },
   },
   ```
3. Use `TRANSLATIONS[lang].myFeature.title` in components.
4. For database content fields (`title_id`, `title_en`), use `getLocalizedText(data, lang)`.

---

## 7. Adding New Themes & Layout Presets

- **Themes:** Configured in `app/lib/theme.ts`. Define `--theme-mode` (`dark` or `light`), specular highlights, background refractions, and accent colors.
- **Layouts:** Configured in `app/lib/presets.ts`. Define alignment, max-width, and card arrangements.
- **Typography:** Configured in `app/lib/fonts.ts`. Provide font family, Google Font URL, and CSS font weights.
