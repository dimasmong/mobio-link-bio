# MOBIO Studio — Self-Hosted Setup Guide
## Cloudflare D1 Database & Cloudflare Access (Email OTP)

This guide walks you through deploying your own independent instance of **MOBIO Studio**, a self-hosted admin dashboard for your personal link-in-bio website.

Each installation is completely sovereign: it runs on your own Cloudflare account with your own Cloudflare D1 database and Cloudflare Access security policy.

---

## 📋 Architecture Overview

```text
[ Public Visitor ]  ───►  / (Public Homepage)   ───►  No Login (Always Public)
[ Admin / Owner  ]  ───►  /studio               ───►  Cloudflare Access (Email OTP)
                                                       │
                                                       ▼
                                              Cloudflare D1 Database
                                           (SQLite Edge Storage: DB)
```

- **Public Website (`/`):** Accessible to anyone worldwide without login.
- **Admin Dashboard (`/studio` & `/api/studio/*`):** Protected by Cloudflare Access with One-Time PIN sent directly to your authorized administrator email.
- **Database:** Serverless SQLite at the edge via Cloudflare D1.

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

This creates the 8 core tables:
- `site_settings`: Global website preferences
- `profile`: Localized name, handle, avatar, location, and bio
- `links`: Ordered vertical links
- `explore_items`: Projects, photo galleries, playlists, and notes
- `contact_methods`: Direct action cards (WhatsApp, Telegram, Email, Instagram)
- `appearance_settings`: Liquid glass themes, cover banner, and fixed background
- `publish_metadata`: Version history and publication logs
- `click_events`: Privacy-friendly link click telemetry

---

### Step 4: Configure Cloudflare Access with Email OTP

Cloudflare Zero Trust Access protects `/studio` without requiring third-party authentication services or passwords.

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

### Step 5: Configure Environment Variables in `wrangler.json`

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
> Alternatively, you can configure these variables securely in the Cloudflare Dashboard under **Workers & Pages** ➔ **Settings** ➔ **Variables and Secrets**.

---

### Step 6: Local Development & Testing

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

### Step 7: Deploying to Production

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

1. **Never commit `.dev.vars` or `.env` files:** They are already listed in `.gitignore`.
2. **Never commit real API keys or personal credentials:** MOBIO is designed to run with Zero Trust headers rather than hardcoded credentials.
3. **Fail-Closed Protection:** If the `Cf-Access-Jwt-Assertion` header is missing, corrupted, or expired, MOBIO Studio immediately denies access with an HTTP 401/403 status.
4. **CSRF Defense:** State-changing API endpoints automatically reject requests with mismatched `Origin` or `Referer` headers.
