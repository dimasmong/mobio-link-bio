# MOBIO Studio — Self-Hosted Setup Guide
## Cloudflare D1 Database & Cloudflare Access (Email OTP)

This guide walks you through deploying your own independent instance of **MOBIO Studio**, a self-hosted admin dashboard for your personal link-in-bio website.

Each installation is completely sovereign: it runs on your own Cloudflare account with your own Cloudflare D1 database and Cloudflare Access security policy.

---

## 📋 Architecture Overview

```text
[ Public Visitor ]  ───►  / (Public Homepage)   ───►  No Login (Always Public)
[ Public Visitor ]  ───►  /api/public/media/:id ───►  Cloudflare R2 (Published Only)
[ Admin / Owner  ]  ───►  /studio               ───►  Cloudflare Access (Email OTP)
                                                       │
                           ┌───────────────────────────┴───────────────────────────┐
                           ▼                                                       ▼
                 Cloudflare D1 Database                                  Cloudflare R2 Bucket
               (SQLite Edge Storage: DB)                              (Media Storage: MEDIA_BUCKET)
```

- **Public Website (`/`):** Accessible to anyone worldwide without login.
- **Admin Dashboard (`/studio` & `/api/studio/*`):** Protected by Cloudflare Access with One-Time PIN sent directly to your authorized administrator email.
- **Database:** Serverless SQLite at the edge via Cloudflare D1.
- **Media Storage:** Edge object storage via Cloudflare R2 (`MEDIA_BUCKET`) with magic byte signature verification, strict format allowlists, and HTTP Range support (`206 Partial Content`) for video streaming.

---

## 🚀 Step-by-Step Setup

### Step 1: Fork and Clone the Repository

1. Fork `mobio-link-bio` to your personal GitHub account.
2. Clone your forked repository locally:
   ```bash
   git clone https://github.com/<your-username>/mobio-link-bio.git
   cd mobio-link-bio
   npm install
   ```

---

### Step 2: Create Your Cloudflare D1 Database

1. Log in to your Cloudflare account via Wrangler CLI:
   ```bash
   npx wrangler login
   ```
2. Create your dedicated D1 database:
   ```bash
   npx wrangler d1 create mobio-studio-db
   ```
3. Wrangler will output your database configuration, for example:
   ```json
   [[d1_databases]]
   binding = "DB"
   database_name = "mobio-studio-db"
   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```
4. In your independent instance configuration (`wrangler.instance.json`, copied from `wrangler.example.json`), configure your D1 binding:
   ```json
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "mobio-studio-db",
       "database_id": "your-d1-database-uuid-here",
       "migrations_dir": "migrations"
     }
   ]
   ```
   *(Note: The tracked `wrangler.json` is reserved for the upstream maintainer's production deployment. Independent instances must use `wrangler.instance.json`.)*

---

### Step 3: Run Database Migrations

MOBIO Studio uses versioned SQLite migrations located in the `migrations/` directory:
- `0001_initial_schema.sql`: Core tables, profile, links, contact methods, appearance tokens, publish metadata
- `0002_draft_publishing.sql`: Isolated draft staging for profile, links, and contact methods
- `0003_appearance_media.sql`: Cloudflare R2 media metadata registry, appearance draft/published tokens
- `0004_explore_editor.sql`: 10 flexible content models with draft isolation
- `0005_click_monitor.sql`: First-party link redirect telemetry table and query indexes
- `0006_minimal_privacy_clicks.sql`: Final security hardening — drops all user agent telemetry and country fields, enforcing strictly minimal, privacy-first click logging
- `0007_custom_icons.sql`: Custom icon system (`icon_type`, `icon_url`, `icon_media_id`) and expanded `media_assets` category constraint to support custom icon uploads (2 MiB limit, PNG/WebP transparency)

1. **Apply migrations to your local development database:**
   ```bash
   # Recommended safe script (validates preflight and binds wrangler.instance.json):
   npm run migrate:instance:local

   # Or direct Wrangler command with explicit config:
   npx wrangler d1 migrations apply DB --local --config wrangler.instance.json
   ```
2. **Apply migrations to your remote Cloudflare database:**
   ```bash
   # Recommended safe script (validates preflight guard before touching remote D1):
   npm run migrate:instance

   # Or direct Wrangler command with explicit config:
   npx wrangler d1 migrations apply DB --remote --config wrangler.instance.json
   ```

This creates the core database tables and registry:
- `site_settings`: Global website preferences
- `profile`: Localized name, handle, avatar, avatar media reference, location, and bio
- `links` & `links_draft`: Ordered vertical links with custom icons (`preset`, `upload`, `url`) and first-party routing `/go/:linkId`
- `explore_items` & `explore_items_draft`: 10 flexible content models (projects, galleries, music, games, etc.)
- `contact_methods` & `contact_methods_draft`: Direct action cards (WhatsApp, Telegram, Email, Instagram, custom)
- `appearance_settings`: Liquid glass tokens, theme presets, cover banner, and fixed background
- `publish_metadata`: Version history and publication logs
- `click_events`: Minimal privacy telemetry (columns: `id`, `link_id`, `clicked_at`, `referrer`; indexes: `idx_click_events_time`, `idx_click_events_link_date`)
- `media_assets`: Metadata registry for files stored in Cloudflare R2 (categories: `avatar`, `cover`, `background`, `general`, `icon`)

---

### Step 4: Explore Editor & 10 Flexible Content Models

MOBIO Studio Phase 4 introduces a polymorphic Explore Editor supporting 10 distinct content models:

| Block Type | Primary Fields | Public Representation |
| :--- | :--- | :--- |
| **Project** | Title, Subtitle, Description, URL, Badge | Showcase card with tags and live external link |
| **Gallery** | Title, Cover Image, Tag list | Image card opening full Liquid Glass Lightbox modal |
| **Image** | Title, Cover Image, Description | Single image card with full-screen zoom |
| **Video** | Title, Video URL, Cover Poster | Video card with direct media preview / launch |
| **Music** | Title, Artist / Subtitle, URL | Playlist / Track card with audio indicator |
| **Game** | Title, Genre Badge, Rating / Year, URL | Gaming card with rating stars and platform links |
| **Review** | Title, Rating, Reviewer note, URL | Card with star rating and testimonial badge |
| **Note** | Title, Content / Description, Tags | Markdown-styled mini thought or microblog post |
| **Link** | Title, Destination URL, Icon | Compact resource or external article link |
| **Custom** | Dynamic title, metadata JSON | Custom block for extensions and integrations |

All models feature bilingual support (ID/EN), drag-and-drop / sort order reordering, instant visibility toggle, item duplication, and referenced media protection.

---

### Step 5: Click Monitor & Minimal Privacy-First Link Analytics

MOBIO Studio includes a sovereign, privacy-by-design telemetry engine (hardened in Migration 0006):
- **First-Party Redirects:** Links route through `/go/:linkId` with immediate HTTP 302 redirect and `Cache-Control: no-store, no-cache, must-revalidate, private`.
- **Zero Personally Identifiable Information (Zero PII):** IP addresses are **never** logged or stored.
- **Zero Persistent Identifiers & Zero UA Telemetry:** No user agent strings, no user agent hashes, no device fingerprints, and no country codes are recorded. Each click is recorded purely as an anonymous temporal occurrence: `{ id, link_id, clicked_at, referrer }`.
- **Sanitized Referrer Domain:** Referrer headers are stripped down strictly to the origin hostname (e.g. `twitter.com`), completely discarding paths, search queries, or sensitive URL parameters.
- **Data Sovereignty & Reset:** The site owner can wipe all telemetry data at any time via the Studio Settings UI ("Reset Click Analytics") or via direct SQL (`DELETE FROM click_events;`).
- **Security Guard:** Non-existent links return 404. Open-redirect injection attempts via query parameters (e.g., `?url=...`) are completely ignored. Destination URLs are strictly pulled from the verified D1 database record.
- **Admin Dashboard:** Real-time metrics across 4 time horizons (`today`, `7d`, `30d`, `all`), daily activity bar chart, per-link leaderboard, and top referrers list.

---

### Step 6: Create Your Cloudflare R2 Media Bucket

MOBIO Studio uses Cloudflare R2 object storage to host your profile photos, cover banners, and animated background media.

1. **Create the production R2 bucket via Wrangler CLI:**
   ```bash
   npx wrangler r2 bucket create mobio-media-bucket
   ```
2. **Configure the R2 binding in `wrangler.json`:**
   ```json
   "r2_buckets": [
     {
       "binding": "MEDIA_BUCKET",
       "bucket_name": "mobio-media-bucket"
     }
   ]
   ```
3. **Generate updated TypeScript environment types:**
   ```bash
   npm run typegen
   ```

#### Permitted Media Formats & Limits:
- **Profile Avatar:** JPEG, PNG, WebP, AVIF up to **5 MiB**.
- **Cover Banner:** JPEG, PNG, WebP, AVIF up to **15 MiB**.
- **Background Image:** JPEG, PNG, WebP, AVIF up to **15 MiB**.
- **Background Video:** MP4 (h.264/AAC), WebM (VP9/Opus) up to **50 MiB**.
- *Strict Security:* Files are verified using byte-level magic signature detection. Executables, scripts, HTML, and SVG files are strictly rejected (HTTP 415). Draft media is kept private behind admin authentication; only published assets are served publicly with immutable caching.

---

### Step 7: Configure Cloudflare Access with Email OTP

Cloudflare Zero Trust Access protects `/studio` without requiring third-party authentication services, passwords, or external database users.

1. Go to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com).
2. Navigate to **Access** ➔ **Applications** ➔ **Add an application**.
3. Choose **Self-hosted**.
4. **Application Configuration:**
   - **Application name:** `MOBIO Studio`
   - **Session Duration:** `24 hours` (or your preference)
   - **Application domain:**
     - Subdomain / Domain: `yourdomain.com`
     - **Path:** `studio*` (matches `/studio` and all sub-routes)
   - *Important:* Do **NOT** protect the root domain `/` without a path, otherwise public visitors will be blocked from viewing your links!
5. **Add an Application Path for APIs:**
   - In the same application or as a second route: add `api/studio*`.
6. **Access Policy Configuration:**
   - **Policy name:** `Admin Only`
   - **Action:** `Allow`
   - **Configure rules:**
     - Selector: `Emails`
     - Value: `<your-personal-email@domain.com>`
   - **Login Methods:** Check `One-time PIN` (Email OTP).
7. **Obtain your Audience Tag (AUD):**
   - Click on your newly created application ➔ **Overview**.
   - Copy the **Application Audience (AUD) Tag**.
8. **Obtain your Team Domain Name:**
   - Go to **Settings** ➔ **Custom Pages** or your Zero Trust URL (e.g., `https://<your-team-name>.cloudflareaccess.com`).

---

### Step 8: Configure Production Runtime Secrets

To ensure credentials are never exposed in Git or source code, MOBIO Studio uses encrypted Cloudflare Worker Secrets for all Zero Trust parameters:

```bash
# 1. Set your Cloudflare Access Team Name
npx wrangler secret put CF_ACCESS_TEAM_NAME
# Prompt: Enter a secret value: winter-leaf-1dc9

# 2. Set your Cloudflare Access Application AUD tag
npx wrangler secret put CF_ACCESS_AUD
# Prompt: Enter a secret value: <paste your application AUD tag>

# 3. Set your authorized administrator email
npx wrangler secret put ADMIN_EMAIL
# Prompt: Enter a secret value: <paste your admin email>
```

> [!TIP]
> In production, MOBIO Studio uses the native Web Crypto API (`crypto.subtle`) to cryptographically verify the RS256 JWT signature against Cloudflare Access public certificates (`https://<team-name>.cloudflareaccess.com/cdn-cgi/access/certs`), caching the JWKS in memory for high-performance edge execution.
>
> You can also manage these variables securely in the Cloudflare Dashboard under **Workers & Pages** ➔ **mobio-link-bio** ➔ **Settings** ➔ **Variables and Secrets**. Do NOT commit secrets directly into `wrangler.json` or source control.

---

### Step 9: Local Development & Verification

1. For local development, copy `.dev.vars.example` to `.dev.vars`:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
2. Set your test admin email:
   ```text
   LOCAL_DEV_ADMIN_EMAIL="admin@localhost.local"
   ```
3. Run the local dev server:
   ```bash
   npm run dev
   ```
4. Visit [http://localhost:5173/studio](http://localhost:5173/studio) in your browser.
5. Visit [http://localhost:5173](http://localhost:5173) to verify your public link-in-bio homepage.

> [!IMPORTANT]
> **Authentication Verification Disclosure:**
> Automated local tests use development identity emulation (`isLocalDevEnvironment`). In local development, requests to loopback addresses (`localhost`, `127.0.0.1`) without production environment variables can authenticate via `LOCAL_DEV_ADMIN_EMAIL` or `X-Mobio-Dev-Identity`.
>
> In production, this bypass is **physically disabled and unreachable**: any production build (`PROD=true`), any non-localhost host, any presence of `CF_ACCESS_TEAM_NAME`, or any proxy forwarding headers (`X-Forwarded-Proto`, non-localhost `X-Forwarded-Host`) completely deactivates the local bypass. Production instances **strictly demand** valid, cryptographically signed Cloudflare Access RS256 JWT tokens. Real Cloudflare Access Email OTP delivery must be configured and tested through your Cloudflare Zero Trust dashboard upon remote deployment.

---

### Step 10: Deploying to Production

When you are ready to build and publish your independent MOBIO instance:

```bash
# 1. Run automated preflight guard to audit your wrangler.instance.json
npm run preflight:instance

# 2. Verify TypeScript types
npm run typecheck

# 3. Compile instance build
npm run build:instance

# 4. Deploy your independent Worker (automatically verifies preflight first)
npm run deploy:instance
```

> [!WARNING]
> **Deployment Safety Notice for Self-Hosters:**
> Do **NOT** run `npx wrangler deploy` or `npm run deploy` without explicit configuration!
> The repository tracks an upstream maintainer configuration file (`wrangler.json`) targeting `me.dimasmong.web.id`. Running unqualified deploy commands targets that upstream production file instead of your own.
>
> Direct Wrangler commands bypass the safety wrappers and preflight validation, and are **not recommended for beginners**.
> Always use `npm run deploy:instance` (or pass `--config wrangler.instance.json` explicitly) to guarantee deployment to your personal Cloudflare Worker.

*(For the original repository maintainer only, deploying to upstream production uses `npm run build:prod` and `npm run deploy`.)*

---

## 🔒 Security Best Practices

1. **Cryptographic RS256 JWT Verification:** Tokens delivered via `Cf-Access-Jwt-Assertion` are cryptographically verified using public keys fetched from Cloudflare Access JWKS (`/cdn-cgi/access/certs`).
2. **Hardened Fail-Closed Development Bypass:** The local simulation guard (`isLocalDevEnvironment`) strictly verifies that the environment is in development mode and bound to direct loopback. Forged forwarded headers (`X-Forwarded-Host: attacker.com`, `X-Forwarded-Proto: https`) or configured production variables (`CF_ACCESS_TEAM_NAME`, `CF_ACCESS_AUD`) immediately disable the simulation mode and enforce production JWT verification.
3. **Never commit `.dev.vars` or `.env` files:** They are already listed in `.gitignore`.
4. **Never commit real API keys or personal credentials:** MOBIO is designed to run with Zero Trust headers rather than hardcoded credentials.
5. **Fail-Closed Protection:** If the `Cf-Access-Jwt-Assertion` header is missing, corrupted, expired, or AUD/ISS fails to match, MOBIO Studio immediately denies access with HTTP 401/403.
6. **Strict CSRF Defense:** State-changing API endpoints automatically reject mutations with mismatched `Origin` or `Referer` headers.
7. **Strict Magic-Byte Media Validation:** File uploads are inspected at the byte level to prevent disguised executable payloads from entering Cloudflare R2.
8. **Anti-Open-Redirect Guard:** First-party `/go/:linkId` redirects enforce safe URL schemes (`http:`, `https:`, `mailto:`, `tel:`) and reject malicious protocols (`javascript:`, `data:`). Target destinations are strictly resolved from D1 and never accepted via query parameter overrides.
9. **Zero PII & Minimal Privacy Telemetry:** Click analytics contain zero visitor IP addresses, zero user-agent hashes, zero device fingerprints, and zero country codes. Referrers are stripped to pure domain origins. Site owners retain complete sovereign control to purge all analytics data at any time.
