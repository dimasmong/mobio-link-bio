# Complete Self-Hosting & Installation Guide

This guide walks you step-by-step through setting up, configuring, and deploying your own sovereign, self-hosted **MOBIO Link Bio** instance on your personal Cloudflare account.

---

## 📑 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Fork & Clone the Repository](#2-fork--clone-the-repository)
3. [Install Project Dependencies](#3-install-project-dependencies)
4. [Authenticate Cloudflare Wrangler](#4-authenticate-cloudflare-wrangler)
5. [Provision Cloudflare Resources (D1 & R2)](#5-provision-cloudflare-resources-d1--r2)
6. [Create Your Isolated Instance Configuration (`wrangler.instance.json`)](#6-create-your-isolated-instance-configuration-wranglerinstancejson)
7. [Apply Database Migrations (0001 – 0011)](#7-apply-database-migrations-0001--0011)
8. [Configure Cloudflare Access (Zero Trust Security)](#8-configure-cloudflare-access-zero-trust-security)
9. [Configure Cloudflare Worker Secrets](#9-configure-cloudflare-worker-secrets)
10. [Local Development Verification](#10-local-development-verification)
11. [Deploy to Cloudflare Workers](#11-deploy-to-cloudflare-workers)
12. [First-Time Studio Setup & Publishing](#12-first-time-studio-setup--publishing)
13. [Next Steps](#13-next-steps)

---

## 1. Prerequisites

Before starting, ensure you have:

- **Node.js:** v20.x or v22.x LTS (Node.js 24 is also supported). Verify via `node -v`.
- **npm:** v10.x or higher. Verify via `npm -v`.
- **Git:** Installed on your computer.
- **GitHub Account:** To fork and maintain your repository.
- **Cloudflare Account:** Free tier is 100% sufficient. [Sign up for free](https://dash.cloudflare.com/sign-up) if you don't have one.

---

## 2. Fork & Clone the Repository

1. Navigate to [https://github.com/dimasmong/mobio-link-bio](https://github.com/dimasmong/mobio-link-bio).
2. Click the **Fork** button in the upper right corner to create a copy under your GitHub account.
3. Clone your fork to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mobio-link-bio.git
   cd mobio-link-bio
   ```

---

## 3. Install Project Dependencies

Install the verified Node.js packages:

```bash
npm install
```

---

## 4. Authenticate Cloudflare Wrangler

Authorize Cloudflare's CLI tool (`wrangler`) with your personal Cloudflare account:

```bash
npx wrangler login
```

A browser window will open. Click **Allow** to grant Wrangler access to your Cloudflare account.

---

## 5. Provision Cloudflare Resources (D1 & R2)

> [!IMPORTANT]
> The following commands create dedicated, isolated serverless resources in **your personal Cloudflare account**. They do not interact with or affect any other user's instance.

### A. Create Your Cloudflare D1 Database
Run:
```bash
npx wrangler d1 create mobio-studio-db
```

Wrangler will output details similar to:
```text
✅ Successfully created DB 'mobio-studio-db'!

[[d1_databases]]
binding = "DB"
database_name = "mobio-studio-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
📋 **Save the `database_id` UUID.** You will need it in Step 6.

### B. Create Your Cloudflare R2 Media Bucket
Run:
```bash
npx wrangler r2 bucket create mobio-media-bucket
```
Wrangler will confirm creation:
```text
Creating bucket 'mobio-media-bucket'...
✨ Success!
```

---

## 6. Create Your Isolated Instance Configuration (`wrangler.instance.json`)

> [!WARNING]
> **DO NOT EDIT OR OVERWRITE `wrangler.json`!**  
> The repository includes a tracked `wrangler.json` file which is reserved exclusively for the project maintainer's production deployment (`me.dimasmong.web.id`). Editing it can cause Git merge conflicts when syncing upstream updates or result in accidental deployment errors.

Instead, create your own local instance configuration file from the provided template:

### Step 1: Copy the Template File
- **Windows Command Prompt (CMD):**
  ```cmd
  copy wrangler.example.json wrangler.instance.json
  ```
- **PowerShell / macOS / Linux:**
  ```bash
  cp wrangler.example.json wrangler.instance.json
  ```

> 🔒 **Git Protection:** `wrangler.instance.json` is already included in `.gitignore`. Your personal database IDs, bucket names, and worker settings will remain strictly private on your computer and will never be committed to Git.

### Step 2: Configure Your Settings
Open `wrangler.instance.json` in your code editor:

1. **Worker Name:** Choose a name for your worker (e.g. `"my-link-bio"`):
   ```json
   "name": "my-link-bio"
   ```
2. **D1 Database ID:** Replace `"YOUR_D1_DATABASE_ID"` with the UUID generated in Step 5A:
   ```json
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "mobio-studio-db",
       "database_id": "PASTE_YOUR_D1_DATABASE_ID_HERE",
       "migrations_dir": "migrations"
     }
   ]
   ```
3. **R2 Bucket Name:** Ensure `bucket_name` matches your created bucket (default `"mobio-media-bucket"`):
   ```json
   "r2_buckets": [
     {
       "binding": "MEDIA_BUCKET",
       "bucket_name": "mobio-media-bucket"
     }
   ]
   ```
4. **Target Subdomain / Domain:**
   - By default, `"workers_dev": true` is enabled, allowing you to deploy immediately to a free Cloudflare subdomain (e.g., `https://my-link-bio.your-subdomain.workers.dev`).
   - If you want to use a custom domain, see [docs/CONFIGURATION.md](CONFIGURATION.md#4-custom-domain-setup).

### Step 3: Run Configuration Preflight Check
Verify that your configuration is valid and free of placeholders:
```bash
node scripts/preflight-instance.mjs
```
Expected output:
```text
✅ Preflight check PASSED for 'wrangler.instance.json'!
Ready for safe migrations and deployment. 🚀
```

---

## 7. Apply Database Migrations (0001 – 0011)

MOBIO Link Bio maintains 11 additive, idempotent database migrations that set up your draft/publish schemas, appearance tables, media assets, categories, and privacy-safe click telemetry.

Always pass `--config wrangler.instance.json` to ensure operations target your personal resources:

### A. Apply Migrations Locally (for `npm run dev`)
```bash
# Recommended safe script (preflight-guarded):
npm run migrate:instance:local

# Or direct Wrangler command with explicit config:
npx wrangler d1 migrations apply DB --local --config wrangler.instance.json
```
Select `Yes` when prompted. This initializes your local SQLite storage.

### B. Apply Migrations to Your Remote Cloudflare D1 Database
> [!IMPORTANT]
> This command applies the schema migrations to **your remote Cloudflare D1 database** created in Step 5A.

```bash
# Recommended safe script (verifies preflight guard before touching remote D1):
npm run migrate:instance

# Or direct Wrangler command with explicit config:
npx wrangler d1 migrations apply DB --remote --config wrangler.instance.json
```
Wrangler will list the 11 migrations (`0001_initial_schema.sql` through `0011_interaction_events.sql`). Confirm with `y` to apply.

---

## 8. Configure Cloudflare Access (Zero Trust Security)

MOBIO Studio (`/studio*` and `/api/studio/*`) is protected by **Cloudflare Access Zero Trust**. This ensures that only you can access the administrative CMS using one-time passcodes (Email OTP).

### Step 1: Open Cloudflare One
1. Go to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. If this is your first time, create a free Zero Trust team name (e.g., `my-team-123`).
3. Note your **Team Name** (`my-team-123`).

### Step 2: Add an Access Application
1. In the Zero Trust dashboard sidebar, navigate to **Access** ➔ **Applications**.
2. Click **Add an application** ➔ select **Self-hosted**.
3. Fill in the application details:
   - **Application name:** `MOBIO Studio`
   - **Session Duration:** `24 hours` (or your preference)
   - **Application domain:**
     - Subdomain / Domain: your worker's domain (e.g. `bio.yourdomain.com` or `my-link-bio.your-subdomain.workers.dev`)
     - Path: `studio`
4. Click **Next**.

### Step 3: Add an Access Policy
1. **Policy name:** `Admin Only`
2. **Action:** `Allow`
3. Under **Configure rules**:
   - **Selector:** `Emails`
   - **Value:** Enter your personal administrator email address (e.g. `you@yourdomain.com`).
4. Click **Next** ➔ click **Add application**.

### Step 4: Copy the Application AUD Tag
1. After the application is created, click **View** or **Edit** on your new `MOBIO Studio` application.
2. In the **Overview** tab, find the **Audience (AUD) tag** (a 64-character hexadecimal string).
3. 📋 **Copy this AUD tag.**

---

## 9. Configure Cloudflare Worker Secrets

Production deployments enforce **fail-closed** cryptographic JWT verification. Cloudflare Access parameters are stored in encrypted Worker Secrets so they are never exposed in Git or client bundles.

Run these three commands targeting your instance configuration:

```bash
# 1. Your Cloudflare Zero Trust Team Name (from Step 8.1)
npx wrangler secret put CF_ACCESS_TEAM_NAME --config wrangler.instance.json

# 2. Your Application Audience (AUD) Tag (from Step 8.4)
npx wrangler secret put CF_ACCESS_AUD --config wrangler.instance.json

# 3. Your Admin Email Whitelist (from Step 8.3)
npx wrangler secret put ADMIN_EMAIL --config wrangler.instance.json
```

When prompted, paste the respective value for each secret.

---

## 10. Local Development Verification

Test that your application runs smoothly locally:

1. Copy `.dev.vars.example` to `.dev.vars`:
   ```bash
   # Windows CMD:
   copy .dev.vars.example .dev.vars

   # PowerShell / Bash:
   cp .dev.vars.example .dev.vars
   ```
2. Open `.dev.vars` and set your local admin simulation identity:
   ```ini
   LOCAL_DEV_ADMIN_EMAIL="admin@localhost.local"
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
   *(Note: The build engine automatically detects `wrangler.instance.json` and binds your local D1/R2 storage).*
4. Open [http://localhost:5173](http://localhost:5173) to see the public site (starts with clean default content).
5. Open [http://localhost:5173/studio](http://localhost:5173/studio) to verify that MOBIO Studio loads in local simulation mode.

---

## 11. Deploy to Cloudflare Workers

Build and deploy your application to your personal Cloudflare Workers account:

```bash
# 1. Run automated preflight guard to audit configuration
npm run preflight:instance

# 2. Run typecheck to guarantee type safety
npm run typecheck

# 3. Build the independent instance application bundle
npm run build:instance

# 4. Deploy your independent Worker (automatically executes preflight first)
npm run deploy:instance
```

> [!WARNING]
> **Safety Warning for Self-Hosters:**
> Do **NOT** run `npx wrangler deploy` or `npm run deploy` without `--config`!
> The repository includes a tracked `wrangler.json` file which is reserved exclusively for the project maintainer's production deployment (`me.dimasmong.web.id`). Running unqualified deploy commands targets that production file instead of your own.
>
> Direct Wrangler commands bypass the automated safety wrappers and preflight checks, and therefore are **not recommended for beginners**.
> Always use `npm run deploy:instance` (which strictly permits only `--dry-run` or no arguments, preventing configuration overrides) and `npm run migrate:instance` (which strictly requires explicit target modes).

*(Direct CLI alternative for advanced users: `npx wrangler deploy --config wrangler.instance.json`)*

Wrangler will output your live URL:
```text
Uploaded my-link-bio (3.21 sec)
Deployed my-link-bio triggers (0.50 sec)
  https://my-link-bio.your-subdomain.workers.dev (or https://bio.yourdomain.com)
Current Version ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 12. First-Time Studio Setup & Publishing

1. Visit `https://your-domain.com/studio` in your browser.
2. Cloudflare Access will prompt you to enter your administrator email.
3. Enter your email, retrieve the 6-digit OTP code sent to your inbox, and submit.
4. You are now inside your private **MOBIO Studio**:
   - **Profile Tab:** Set your Display Name, Handle, Bio, and upload your profile photo.
   - **Links Tab:** Add your personal social and portfolio links.
   - **Appearance Studio:** Choose from 30 color presets, 20 layouts, 10 card styles, and 24 typography fonts.
   - **Explore Tab:** Add projects, galleries, music, or notes.
   - **Contact Tab:** Add direct WhatsApp, Telegram, or Email action cards.
5. Click **Preview Draft** to review your draft in a new tab.
6. When satisfied, click **Publish Changes** in the header.
7. Open your public website (`https://your-domain.com/`) — your new sovereign Link in Bio is live!

---

## 13. Next Steps

- Consult [docs/CONFIGURATION.md](CONFIGURATION.md) for custom domain setup and appearance engine details.
- Consult [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) if you encounter any errors during setup.
- Consult [docs/SECURITY.md](../SECURITY.md) for detailed security architecture and policies.
