# Deployment Guide

This guide covers production deployment strategies, continuous integration, zero-downtime releases, and health checks for **MOBIO Link Bio** on Cloudflare Workers.

---

## 📑 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Why No One-Click Deploy Button?](#2-why-no-one-click-deploy-button)
3. [Manual Deployment Workflow](#3-manual-deployment-workflow)
4. [Continuous Integration (GitHub Actions)](#4-continuous-integration-github-actions)
5. [Staging vs. Production](#5-staging-vs-production)
6. [Rollbacks & Version History](#6-rollbacks--version-history)
7. [Health & Monitoring](#7-health--monitoring)

---

## 1. Architecture Overview

MOBIO runs as a **Cloudflare Worker** utilizing modern **React Router v7 Framework Mode with Server-Side Rendering (SSR)**.

```mermaid
flowchart LR
    User[Visitor / Admin Browser] --> Edge[Cloudflare Global Edge]
    Edge --> Access{Route == /studio*?}
    Access -- Yes --> CF ये AccessAuth[Cloudflare Access Zero Trust OTP]
    CF AccessAuth -- Valid JWT --> Worker[MOBIO Edge Worker (SSR)]
    Access -- No (Public) --> Worker
    Worker --> D1[(Cloudflare D1 Database)]
    Worker --> R2[(Cloudflare R2 Storage)]
```

- **Edge SSR:** HTML streams instantly from Cloudflare's nearest edge location with sub-50ms Time to First Byte (TTFB).
- **Data Locality:** Cloudflare D1 provides low-latency SQLite query execution at the edge.
- **Media Delivery:** Cloudflare R2 serves uploaded assets without egress fees.

---

## 2. Why No One-Click Deploy Button?

Many projects provide a generic "Deploy with Workers" button. MOBIO deliberately avoids this for critical security and operational reasons:

1. **Zero Trust Access Requirement:** A one-click button cannot provision Cloudflare Zero Trust policies or configure one-time passcode (OTP) email rules. Providing a one-click deployment would either leave the Studio CMS unprotected or require an insecure default password.
2. **Database Migrations:** Cloudflare's automated deployment buttons cannot execute sequential schema migrations against D1 databases during initial provisioning.
3. **Sovereign Isolation:** Manual setup ensures that every self-hoster explicitly owns their D1 database UUID, R2 bucket, and secret keys with zero shared dependencies.

A guided, 10-minute manual setup guarantees that your deployment is **secure, fail-closed, and sovereign** from day one.

---

## 3. Deployment Workflows

### A. Independent Self-Hosted Deployment (Recommended Workflow)
For independent self-hosters deploying their own instance, always use the dedicated instance scripts or `--config wrangler.instance.json`:

```bash
# 1. Verify TypeScript types
npm run typecheck

# 2. Run automated preflight safety audit
npm run preflight:instance

# 3. Compile instance build
npm run build:instance

# 4. Apply migrations to your remote Cloudflare D1 database (runs preflight first)
npm run migrate:instance

# 5. Deploy to your personal Cloudflare Workers account (runs preflight first)
npm run deploy:instance
```

> [!WARNING]
> **Safety Warning for Self-Hosters:**
> Do **NOT** run `npx wrangler deploy` or `npm run deploy` without `--config`!
> The repository includes a tracked `wrangler.json` file which is reserved exclusively for the project maintainer's production deployment (`me.dimasmong.web.id`). Running unqualified deploy commands targets that production file instead of your own.
> Always use `npm run deploy:instance` or pass `--config wrangler.instance.json` explicitly.

#### Direct CLI Alternatives:
If you prefer running direct Wrangler commands:
```bash
# Apply migrations:
npx wrangler d1 migrations apply DB --remote --config wrangler.instance.json

# Deploy worker:
npx wrangler deploy --config wrangler.instance.json
```

### B. Upstream Production Deployment (Project Maintainer Only)
For the original project maintainer deploying `me.dimasmong.web.id`:

```bash
# 1. Run production preflight verification
npm run preflight:instance -- --prod

# 2. Compile production build
npm run typecheck
npm run build:prod

# 3. Apply upstream production migrations and deploy
npx wrangler d1 migrations apply DB --remote
npm run deploy
```

---

## 4. Continuous Integration (GitHub Actions)

You can automate deployment via GitHub Actions while keeping credentials safe.

### Required GitHub Repository Secrets:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Workers Scripts:Edit`, `D1:Edit`, and `R2:Edit` permissions.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found on any Cloudflare dashboard sidebar).

### Example Workflow: `.github/workflows/deploy.yml`

```yaml
name: Deploy MOBIO Link Bio

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Build SSR App
        run: npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --config wrangler.instance.json
```

> [!NOTE]
> For self-hosters running CI/CD, ensure your CI pipeline passes `--config wrangler.instance.json` (or creates `wrangler.instance.json` from secrets). Running unqualified `deploy` in CI defaults to the upstream maintainer's `wrangler.json`.

---

## 5. Staging vs. Production

To create a separate staging environment:

1. Create a staging D1 database (`mobio-studio-db-staging`) and R2 bucket (`mobio-media-staging`).
2. Add an `env.staging` block in your `wrangler.instance.json`:
   ```json
   "env": {
     "staging": {
       "name": "my-mobio-staging",
       "workers_dev": true,
       "d1_databases": [
         {
           "binding": "DB",
           "database_name": "mobio-studio-db-staging",
           "database_id": "STAGING_D1_ID",
           "migrations_dir": "migrations"
         }
       ]
     }
   }
   ```
3. Deploy to staging via:
   ```bash
   npx wrangler deploy --config wrangler.instance.json --env staging
   ```

---

## 6. Rollbacks & Version History

Cloudflare Workers automatically archives prior deployments:

1. **List Previous Deployments:**
   ```bash
   npx wrangler deployments list --config wrangler.instance.json
   ```
2. **Instant Rollback:**
   In the Cloudflare Dashboard under **Workers & Pages** ➔ **mobio-link-bio** ➔ **Deployments**, select any previous deployment and click **Rollback to this version**. Rollbacks take effect worldwide in milliseconds.

---

## 7. Health & Monitoring

MOBIO includes a dedicated public health check endpoint:

```bash
curl -I https://your-domain.com/api/public/health
```

Expected Response:
```http
HTTP/2 200 OK
content-type: application/json; charset=utf-8
cache-control: no-store, no-cache, must-revalidate

{"status":"ok","timestamp":"2026-10-27T02:00:00.000Z","version":"4.2.0"}
```

Use this endpoint with uptime monitoring services (e.g. UptimeRobot, Better Stack, Pingdom) to monitor service availability.
