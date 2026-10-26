# Troubleshooting & FAQ Guide

This guide covers common issues, error messages, and verified solutions when self-hosting **MOBIO Link Bio**.

---

## 📑 Common Issues

1. [Wrangler Authentication Failed](#1-wrangler-authentication-failed)
2. [D1 Database ID is Missing or Invalid](#2-d1-database-id-is-missing-or-invalid)
3. [D1 Migration Failed](#3-d1-migration-failed)
4. [R2 Media Bucket Unavailable](#4-r2-media-bucket-unavailable)
5. [Studio Returns HTTP 401 Unauthorized](#5-studio-returns-http-401-unauthorized)
6. [Studio Returns HTTP 403 Forbidden](#6-studio-returns-http-403-forbidden)
7. [Studio Returns HTTP 500 Fail-Closed Error](#7-studio-returns-http-500-fail-closed-error)
8. [Media Upload Fails](#8-media-upload-fails)
9. [Draft Preview Does Not Load](#9-draft-preview-does-not-load)
10. [Website Displays a Blank Page](#10-website-displays-a-blank-page)
11. [Build or TypeScript Typecheck Errors](#11-build-or-typescript-typecheck-errors)

---

## 1. Wrangler Authentication Failed

### Symptoms:
Running `npx wrangler d1 ...` or `npm run deploy:instance` outputs:
`Error: Not logged in. Please run wrangler login.`

### Solution:
1. Run:
   ```bash
   npx wrangler login
   ```
2. If your browser does not open automatically, copy the URL printed in the terminal into your browser.
3. Verify authentication:
   ```bash
   npx wrangler whoami
   ```

---

## 2. D1 Database ID is Missing or Invalid

### Symptoms:
`Error: D1_ERROR: database_id is required` or `Resource not found`.

### Cause:
Your `wrangler.instance.json` is missing or contains an unreplaced placeholder (`YOUR_D1_DATABASE_ID`).

### Solution:
1. List your personal D1 databases:
   ```bash
   npx wrangler d1 list
   ```
2. Copy the UUID of your database (e.g. `mobio-studio-db`).
3. Open `wrangler.instance.json` and paste the UUID into the `database_id` field under `d1_databases`.
4. Run the preflight guard to confirm:
   ```bash
   node scripts/preflight-instance.mjs
   ```

---

## 3. D1 Migration Failed

### Symptoms:
`Error: D1_ERROR: table already exists` or migration fails partway through.

### Cause:
Migrations were applied out of order or executed without specifying `--config wrangler.instance.json`.

### Solution:
1. Check migration status on your personal database:
   ```bash
   npx wrangler d1 migrations list DB --remote --config wrangler.instance.json
   ```
2. In local development, you can safely reset local state by deleting `.wrangler/state/v3/d1` and re-running:
   ```bash
   npx wrangler d1 migrations apply DB --local --config wrangler.instance.json
   ```
3. > [!CAUTION]
   > **NEVER** delete or drop tables from a remote D1 database. MOBIO migrations (0001 through 0011) use `IF NOT EXISTS` guards and are safe to re-run.

---

## 4. R2 Media Bucket Unavailable

### Symptoms:
`Error: Cannot read properties of undefined (reading 'MEDIA_BUCKET')` or image uploads fail.

### Solution:
1. Verify bucket existence in your personal account:
   ```bash
   npx wrangler r2 bucket list
   ```
2. Ensure the bucket name in `wrangler.instance.json` matches your created bucket:
   ```json
   "r2_buckets": [
     {
       "binding": "MEDIA_BUCKET",
       "bucket_name": "mobio-media-bucket"
     }
   ]
   ```

---

## 5. Studio Returns HTTP 401 Unauthorized

### Symptoms:
Visiting `/studio` shows:
`Cloudflare Access JWT assertion missing. Silakan login melalui Cloudflare Access.`

### Cause:
1. **In Production:** You navigated to `/studio` directly without passing through a Cloudflare Access Zero Trust login screen.
2. **In Local Development:** `.dev.vars` is missing `LOCAL_DEV_ADMIN_EMAIL`.

### Solution:
- **Production:** Ensure your Cloudflare Access Application covers the path `studio*`. Always access Studio via your configured domain so Access injects the required `Cf-Access-Jwt-Assertion` header.
- **Local Dev:** Ensure `.dev.vars` exists and contains `LOCAL_DEV_ADMIN_EMAIL="admin@localhost.local"`.

---

## 6. Studio Returns HTTP 403 Forbidden

### Symptoms:
`Akses ditolak: Alamat email 'xyz@example.com' tidak terdaftar sebagai administrator.`

### Cause:
You have configured an `ADMIN_EMAIL` secret in your Worker, and the email you used to log in via Cloudflare Access does not match the whitelist.

### Solution:
1. Update your admin email whitelist:
   ```bash
   npx wrangler secret put ADMIN_EMAIL
   ```
2. Enter the exact email address you use to log in.
3. Or delete the secret if you want any user allowed by your Cloudflare Access policy to enter:
   ```bash
   npx wrangler secret delete ADMIN_EMAIL
   ```

---

## 7. Studio Returns HTTP 500 Fail-Closed Error

### Symptoms:
`Konfigurasi server Cloudflare Access belum lengkap (CF_ACCESS_TEAM_NAME atau CF_ACCESS_AUD belum diatur). Akses ditolak secara fail-closed demi keamanan.`

### Cause:
Production requests detected a JWT, but the Worker has not been configured with your Cloudflare Zero Trust Team Name and Application AUD tag.

### Solution:
Set both required secrets via Wrangler targeting your instance configuration:
```bash
npx wrangler secret put CF_ACCESS_TEAM_NAME --config wrangler.instance.json
npx wrangler secret put CF_ACCESS_AUD --config wrangler.instance.json
```
See [docs/INSTALLATION.md](INSTALLATION.md#step-8-configure-cloudflare-access-zero-trust-security) for instructions on where to find these values.

---

## 8. Media Upload Fails

### Symptoms:
Uploading an avatar or cover in MOBIO Studio displays "Upload failed" or 413 Payload Too Large.

### Solution:
1. Check image file size: MOBIO recommends images under 5MB for optimal mobile loading speeds.
2. Supported formats: JPEG, PNG, WebP, SVG, and GIF.
3. Ensure your Cloudflare R2 bucket exists and is bound in `wrangler.instance.json`.

---

## 9. Draft Preview Does Not Load

### Symptoms:
Clicking **Preview Draft** opens `/studio/preview` and displays an error or redirects.

### Solution:
Draft preview requires active administrator authentication. Ensure your Cloudflare Access application policy covers both `studio` and `studio/*`.

---

## 10. Website Displays a Blank Page

### Symptoms:
Public website loads a white/blank screen.

### Solution:
1. Check browser console (`F12`) for hydration errors.
2. Check Worker logs in Cloudflare:
   ```bash
   npx wrangler tail
   ```
3. If D1 has no published record, MOBIO automatically renders fallback content from `app/data/profile.ts`. Ensure `app/data/profile.ts` is intact.

---

## 11. Build or TypeScript Typecheck Errors

### Symptoms:
`npm run build` or `npm run typecheck` fails.

### Solution:
1. Regenerate Worker and React Router types:
   ```bash
   npm run typegen
   ```
2. Ensure you are on Node.js v20+ or v22+:
   ```bash
   node -v
   ```
3. Run a clean install:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
