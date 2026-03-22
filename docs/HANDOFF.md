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
# Fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   ANTHROPIC_API_KEY
#   AI_MODEL (optional, defaults to claude-sonnet-4-5-20250514)
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

## How to Deploy

### Vercel (Frontend + API)

1. Connect repo to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `AI_MODEL`
3. Deploy (auto-deploys on push to main)

### Worker (Manual)

The worker must run separately — it cannot run on Vercel free tier due to timeouts.

**Options:**
- Run `npm run scan` on your local machine while using the app
- Deploy to a VPS (e.g., Railway, Fly.io, DigitalOcean) with a process manager
- Use Vercel Pro tier (300s timeout) and trigger via `/api/reddit/scan/execute`

---

## Known Issues & Limitations

### Functional
- **Worker must run locally** — No cloud worker deployment. Scanning doesn't work without it.
- **No scheduled scanning** — Must manually trigger each scan from the UI.
- **No reply tracking** — Can't mark which opportunities you've already responded to.
- **No copy button** — Must manually select and copy generated responses.
- **Single user only** — Auth exists but no signup flow. Admin creates accounts manually.

### Technical
- **Monolithic UI** — `reddit-finder/page.tsx` is ~800 lines. Hard to maintain.
- **Duplicate constants** — Subreddit and keyword lists exist in both `local-scanner.ts` and `scan/execute/route.ts`.
- **Dead code** — `/api/reddit/scan/request` and `/api/reddit/opportunities` routes are unused.
- **No tests** — Zero test coverage.
- **No input validation** — API routes don't validate/sanitize inputs.
- **No error boundaries** — Unhandled errors crash the page.
- **Unused dependency** — `openai` package installed but not used.

### Data
- **No deduplication logic** — Relies on DB UNIQUE constraint; duplicate inserts log errors.
- **No `updated_at` columns** — Can't track when records were last modified.
- **No scan-to-opportunity link** — Opportunities don't reference which scan found them.
