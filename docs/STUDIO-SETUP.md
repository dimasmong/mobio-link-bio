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
   npx wrangler d1 create mobio-db
   ```
3. Wrangler will output your database configuration, for example:
   ```json
   [[d1_databases]]
   binding = "DB"
   database_name = "mobio-db"
   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```
4. Open `wrangler.json` and replace `database_id` with your actual UUID from step 3:
   ```json
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "mobio-db",
       "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
       "migrations_dir": "migrations"
     }
   ]
   ```

---

### Step 3: Run Database Migrations

MOBIO Studio uses versioned SQLite migrations located in the `migrations/` directory.

1. **Apply migrations to your local development database:**
   ```bash
   npx wrangler d1 migrations apply mobio-db --local
   ```
2. **Apply migrations to your remote Cloudflare production database:**
   ```bash
   npx wrangler d1 migrations apply mobio-db --remote
   ```

This creates the core database tables and registry:
- `site_settings`: Global website preferences
- `profile` & `profile_draft`: Localized name, handle, avatar, avatar media reference, location, and bio
- `links` & `links_draft`: Ordered vertical links with first-party routing `/go/:linkId`
- `explore_items` & `explore_items_draft`: 10 flexible content models (projects, galleries, music, games, etc.)
- `contact_methods` & `contact_methods_draft`: Direct action cards (WhatsApp, Telegram, Email, Instagram, custom)
- `appearance_settings` & `appearance_settings_draft`: Liquid glass tokens, theme presets, cover banner, and fixed background
- `publish_metadata`: Version history and publication logs
- `click_events`: Privacy-first telemetry (indexes: `idx_click_events_time`, `idx_click_events_link_date`)
- `media_assets`: Metadata registry for files stored in Cloudflare R2

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

### Step 5: Click Monitor & Privacy-First Link Analytics

MOBIO Studio Phase 5 includes a built-in telemetry engine:
- **First-Party Redirects:** Links route through `/go/:linkId` with immediate HTTP 302 redirect and `Cache-Control: no-store, private`.
- **Zero Personally Identifiable Information (PII):** Raw IP addresses are **never** stored.
- **Privacy Hashing:** User agents are hashed into a 16-character SHA-256 fingerprint (`user_agent_hash`).
- **Referrer Sanitization:** Referrer URLs are stripped of sensitive query parameters and paths (only the host domain is logged).
- **Security Guard:** Non-existent links return 404. Open-redirect injection attempts are rejected.
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

### Step 8: Configure Environment Variables in `wrangler.json`

In `wrangler.json`:
```json
"vars": {
  "VALUE_FROM_CLOUDFLARE": "Hello from Cloudflare",
  "CF_ACCESS_TEAM_NAME": "your-team-name",
  "CF_ACCESS_AUD": "your-application-audience-aud-tag",
  "ADMIN_EMAIL": "your-email@domain.com"
}
```

> [!TIP]
> In production, MOBIO Studio uses the native Web Crypto API (`crypto.subtle`) to cryptographically verify the RS256 JWT signature against Cloudflare Access public certificates (`https://<team-name>.cloudflareaccess.com/cdn-cgi/access/certs`), caching the JWKS in memory for high-performance edge execution.
>
> You can also configure these variables securely in the Cloudflare Dashboard under **Workers & Pages** ➔ **Settings** ➔ **Variables and Secrets**.

---

### Step 9: Local Development & Testing

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

---

### Step 10: Deploying to Production

When you are ready to publish your changes:

```bash
# 1. Verify TypeScript types
npm run typecheck

# 2. Compile production build
npm run build

# 3. Deploy to Cloudflare Workers
npx wrangler deploy
```

---

## 🔒 Security Best Practices

1. **Cryptographic RS256 JWT Verification:** Tokens delivered via `Cf-Access-Jwt-Assertion` are cryptographically verified using public keys fetched from Cloudflare Access JWKS (`/cdn-cgi/access/certs`).
2. **Never commit `.dev.vars` or `.env` files:** They are already listed in `.gitignore`.
3. **Never commit real API keys or personal credentials:** MOBIO is designed to run with Zero Trust headers rather than hardcoded credentials.
4. **Fail-Closed Protection:** If the `Cf-Access-Jwt-Assertion` header is missing, corrupted, or expired, MOBIO Studio immediately denies access with an HTTP 401/403 status.
5. **CSRF Defense:** State-changing API endpoints automatically reject requests with mismatched `Origin` or `Referer` headers.
6. **Strict Magic-Byte Media Validation:** File uploads are inspected at the byte level to prevent disguised executable payloads from entering Cloudflare R2.
7. **Anti-Open-Redirect Guard:** First-party `/go/:linkId` redirects enforce safe URL schemes (`http:`, `https:`, `mailto:`, `tel:`) and reject malicious protocols (`javascript:`, `data:`).
