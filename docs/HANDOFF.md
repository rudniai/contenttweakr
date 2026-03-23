# Handoff Guide

## Running Locally

### Prerequisites
- Node.js 18+
- npm
- Supabase project (with tables created via migrations)
- Anthropic API key

### Setup

```bash
# Clone and install
git clone <repo-url>
cd contenttweakr
npm install

# Configure environment
cp .env.example .env.local
# Fill in all required values (see docs/DEPLOYMENT.md for full list)
```

### Run Database Migrations

Apply migrations in order against your Supabase project (via Supabase dashboard SQL editor or CLI):

```
supabase/migrations/001_opportunities.sql
supabase/migrations/002_opportunities_and_responses.sql
supabase/migrations/003_scan_requests.sql
supabase/migrations/004_add_hidden_column.sql
```

### Start the App

```bash
# Terminal 1: Next.js dev server
npm run dev
# → http://localhost:3000

# Terminal 2: Scanner worker (required for scanning to work)
npm run scan
```

Both must be running. The web app creates scan requests; the worker executes them.

### Login

Create a user in Supabase Auth dashboard (Authentication → Users → Add User). Then login at `http://localhost:3000`.

---

## How the Worker Works

```
1. Worker starts → polls scan_requests every 30s
2. Finds pending request → sets status to 'processing'
3. Fetches /r/{subreddit}/new.json for 16 subreddits
   - 3-6s random delay between requests (rate limiting)
   - Retries on 429 with exponential backoff
4. Filters posts by keywords and question patterns
5. Scores each post (0-100 confidence)
6. Saves top 20 opportunities to DB (upserts by user_id + url)
7. Updates scan_request: status='completed', result_count=N
8. On error: status='failed', error=message
```

**Run:** `npm run scan` (uses `tsx` to run TypeScript directly)

**Stops:** Ctrl+C (no graceful shutdown — just kills the process)

---

## Deployment Checklist

Before deploying, verify:

1. **Build passes locally**: `npm run build` completes without errors
2. **Environment variables** are set in Vercel dashboard (see [DEPLOYMENT.md](./DEPLOYMENT.md))
3. **Database migrations** have been applied to the Supabase project
4. **Supabase Auth** has at least one user created
5. **Resend** domain is verified (if using email notifications)
6. **CRON_SECRET** is set (required for scheduled scans)

---

## How to Test Features

### Reddit Opportunity Scanning
1. Go to Dashboard → Reddit Finder
2. Click "Scan Now" to trigger a scan
3. Wait for results (check scan history for status)
4. Verify opportunities appear with confidence scores

### AI Response Generation
1. Find an opportunity in Reddit Finder
2. Click "Generate Response"
3. Verify a contextual reply is generated

### Email Notifications
1. Go to Dashboard → Settings
2. Enable email notifications and save
3. Click "Send Test Email"
4. Check your inbox for the test notification

### Scheduled Scanning (Cron)
1. Verify `CRON_SECRET` is set in Vercel env vars
2. After deploy, check Vercel dashboard → Cron Jobs
3. Cron runs every 6 hours (`0 */6 * * *`)
4. Check scan history to confirm automated scans appear

### Analytics Dashboard
1. Run a few scans to generate data
2. Go to Dashboard → Analytics
3. Verify charts show scan history and opportunity trends

---

## Known Issues & Limitations

### Functional
- **Worker must run locally** — No cloud worker deployment. Scanning doesn't work without it.
- **Single user only** — Auth exists but no signup flow. Admin creates accounts manually.

### Technical
- **Monolithic UI** — `reddit-finder/page.tsx` is large. Consider splitting into components.
- **In-memory rate limiting** — Resets on redeploy. Use Upstash Redis for persistence.
- **No test coverage** — Zero automated tests.

### Data
- **No deduplication logic** — Relies on DB UNIQUE constraint; duplicate inserts log errors.
- **No `updated_at` columns** — Can't track when records were last modified.
