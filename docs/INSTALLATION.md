# Complete Self-Hosting & Installation Guide

This guide walks you step-by-step through setting up, configuring, and deploying your own sovereign, self-hosted **MOBIO Link Bio** instance on your personal Cloudflare account.

---

## 📑 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Fork & Clone the Repository](#2-fork--clone-the-repository)
3. [Install Project Dependencies](#3-install-project-dependencies)
4. [Authenticate Cloudflare Wrangler](#4-authenticate-cloudflare-wrangler)
5. [Provision Cloudflare Resources (D1 & R2)](#5-provision-cloudflare-resources-d1--r2)
6. [Configure Your Wrangler Settings](#6-configure-your-wrangler-settings)
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

Authorize Cloudflare's CLI tool (`wrangler`) with your Cloudflare account:

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
📋 **Save the `database_id` UUID.** You will need it in the next step.

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

## 6. Configure Your Wrangler Settings

If you cloned the repository, `wrangler.example.json` is provided as a clean reference.

1. Open `wrangler.json` (or copy from `wrangler.example.json`):
2. Replace the placeholder database ID with your own `database_id` generated in Step 5A:
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
3. Verify that your R2 bucket name matches what you created in Step 5B:
   ```json
   "r2_buckets": [
     {
       "binding": "MEDIA_BUCKET",
       "bucket_name": "mobio-media-bucket"
     }
   ]
   ```
4. Custom Domain (Optional):
   - If you want to deploy initially to Cloudflare's free `*.workers.dev` subdomain, set `"workers_dev": true` and remove the `routes` block.
   - If you have an active custom domain in your Cloudflare account, configure:
     ```json
     "routes": [
       {
         "pattern": "bio.yourdomain.com",
         "custom_domain": true
       }
     ]
     ```

---

## 7. Apply Database Migrations (0001 – 0011)

MOBIO Link Bio maintains 11 additive, idempotent database migrations that set up your draft/publish schemas, appearance tables, media assets, categories, and privacy-safe click telemetry.

### A. Apply Migrations to Your Local Development Environment
```bash
npx wrangler d1 migrations apply DB --local
```
Select `Yes` when prompted. This initializes your local SQLite storage for `npm run dev`.

### B. Apply Migrations to Your Remote Cloudflare D1 Database
> [!WARNING]
> This command modifies your **remote Cloudflare D1 database**. Ensure you have configured your own `database_id` in `wrangler.json`.

```bash
npx wrangler d1 migrations apply DB --remote
```
Wrangler will display the 11 migrations (`0001_initial_schema.sql` through `0011_interaction_events.sql`). Confirm with `y` to apply.

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
     - Subdomain / Domain: your worker's domain (e.g. `bio.yourdomain.com` or `mobio-link-bio.your-subdomain.workers.dev`)
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

Run these three commands in your terminal:

```bash
# 1. Your Cloudflare Zero Trust Team Name (from Step 8.1)
npx wrangler secret put CF_ACCESS_TEAM_NAME

# 2. Your Application Audience (AUD) Tag (from Step 8.4)
npx wrangler secret put CF_ACCESS_AUD

# 3. Your Admin Email Whitelist (from Step 8.3)
npx wrangler secret put ADMIN_EMAIL
```

When prompted, paste the respective value for each secret.

---

## 10. Local Development Verification

Before deploying, test that your application runs smoothly locally:

1. Copy `.dev.vars.example` to `.dev.vars`:
   ```bash
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
4. Open [http://localhost:5173](http://localhost:5173) to see the public site (starts with clean default content).
5. Open [http://localhost:5173/studio](http://localhost:5173/studio) to verify that MOBIO Studio loads in local simulation mode.

---

## 11. Deploy to Cloudflare Workers

Build and deploy your application to Cloudflare Workers:

```bash
# 1. Run typecheck to guarantee type safety
npm run typecheck

# 2. Build the production React Router SSR bundles
npm run build

# 3. Deploy to your Cloudflare account
npx wrangler deploy
```

Wrangler will output your live URL:
```text
Uploaded mobio-link-bio (3.21 sec)
Deployed mobio-link-bio triggers (0.50 sec)
  https://bio.yourdomain.com (or https://my-mobio-link-bio.your-name.workers.dev)
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
