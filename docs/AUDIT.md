# Repository Audit

**Date:** 2026-03-23
**Branch:** main
**Last commit:** `4a6f07d` feat: Replace templates with AI-generated responses

---

## 1. Project Overview

**ContentTweakr** (formerly "Reddit Intel") is a Next.js 14 SaaS app that finds Reddit marketing opportunities and generates AI-powered responses using Claude. It uses Supabase for auth/data and deploys on Vercel.

---

## 2. Source Structure (`src/app/`)

### Pages
| Route | File | Status |
|-------|------|--------|
| `/` | `page.tsx` | Login page (email/password via Supabase) |
| `/dashboard` | `dashboard/page.tsx` | Redirects to `/dashboard/reddit-finder` |
| `/dashboard/reddit-finder` | `dashboard/reddit-finder/page.tsx` | Main UI (client component, ~800 lines) |

### Layouts
| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout (dark theme, fonts, metadata) |
| `dashboard/layout.tsx` | Minimal dashboard wrapper |

### Observations
- The entire app UI lives in a single monolithic client component (`reddit-finder/page.tsx`)
- No component extraction — scanning, results, response generation all in one file
- No loading/error boundaries
- No shared layout navigation or sidebar

---

## 3. API Routes

| Method | Route | Purpose | Status |
|--------|-------|---------|--------|
| POST | `/api/reddit/scan/trigger` | Create scan request | Working |
| GET | `/api/reddit/scan/status/[id]` | Poll scan progress | Working |
| POST | `/api/reddit/scan/execute` | Execute scan (service role) | Working (unused — local worker preferred) |
| POST | `/api/reddit/scan/request` | Duplicate of trigger | Dead code |
| GET | `/api/reddit/opportunities` | Direct Reddit scan (legacy) | Dead code |
| GET | `/api/reddit/opportunities/saved` | Load saved opportunities | Working |
| POST | `/api/reddit/opportunities/hide` | Hide/unhide opportunity | Working |
| POST | `/api/reddit/generate-response` | Generate Claude response | Working |

### Issues
- `/scan/request` is a duplicate of `/scan/trigger` — should be removed
- `/opportunities` (root GET) is legacy and not used in current flow
- No rate limiting on any endpoint
- No input validation beyond basic auth checks
- Service role key passed via Authorization header (functional but non-standard)

---

## 4. Supabase Migrations

| Migration | Purpose |
|-----------|---------|
| `001_opportunities.sql` | Initial `opportunities` + `generated_responses` tables with RLS |
| `002_opportunities_and_responses.sql` | Schema revision (adds `post_date`, recreates tables) |
| `003_scan_requests.sql` | Job queue table for async scanning |
| `004_add_hidden_column.sql` | Adds `hidden` boolean to opportunities |

### Tables
- **opportunities** — Reddit posts scored as marketing opportunities
- **generated_responses** — AI-generated reply text linked to opportunities
- **scan_requests** — Job queue (pending → processing → completed/failed)

### Observations
- RLS is properly configured on all tables
- Migration 002 recreates tables from 001 (not incremental) — works but fragile
- No `updated_at` timestamps on any table
- No `scan_id` foreign key on opportunities (can't link results back to specific scan)
- Legacy `supabase-schema.sql` in root is outdated

---

## 5. Worker Script

**File:** `scripts/local-scanner.ts`

### How it works
1. Polls `scan_requests` table every 30 seconds for `status = 'pending'`
2. Claims job by setting status to `'processing'`
3. Fetches Reddit JSON from 16 hardcoded subreddits
4. Filters posts by keyword matching and question patterns
5. Scores opportunities (0-100 confidence)
6. Saves top 20 to `opportunities` table
7. Updates scan_request to `'completed'` or `'failed'`

### Rate limiting
- 3-6 second random delay between subreddit fetches
- Exponential backoff on 429 errors (up to 3 retries)

### Run command
```bash
npm run scan
# or: npx tsx scripts/local-scanner.ts
```

### Observations
- Must run locally — Vercel serverless times out on long scans
- No graceful shutdown handling
- Subreddit list is hardcoded (also duplicated in execute route)
- Keyword list is hardcoded (also duplicated in execute route)
- No deduplication across scans (relies on UNIQUE constraint, which raises errors)
- Shell script `poll-and-scan.sh` references non-existent paths — dead code

---

## 6. Components

| Component | Purpose |
|-----------|---------|
| `ui/button.tsx` | CVA button with variants (shadcn/ui pattern) |
| `ui/tabs.tsx` | Radix UI tabs wrapper |

### Observations
- Only 2 UI components extracted — most UI is inline in the page component
- Standard shadcn/ui setup but barely used
- No shared components for cards, badges, modals, forms, etc.

---

## 7. Libraries & Utilities

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client (cookie-based) |
| `lib/supabase/middleware.ts` | Session refresh |
| `lib/utils.ts` | `cn()` classname merge utility |
| `middleware.ts` | Auth guard for `/dashboard/*` routes |

---

## 8. Dependencies

### Active
- Next.js 14.2.35, React 18
- @supabase/ssr + @supabase/supabase-js
- @anthropic-ai/sdk (Claude API)
- Tailwind CSS 3.4 + tailwindcss-animate
- Radix UI (slot, tabs)
- class-variance-authority, clsx, tailwind-merge
- lucide-react (icons)

### Unused
- **openai** — installed but not imported anywhere in source code

---

## 9. What's Missing vs Full Spec

### Not implemented
- [ ] Scheduled/cron scanning (manual trigger only)
- [ ] Reply tracking (which posts user responded to)
- [ ] Sentiment analysis (skip toxic threads)
- [ ] Duplicate/answered detection
- [ ] Hacker News support
- [ ] Product Hunt support
- [ ] Webhook/email notifications
- [ ] Analytics dashboard
- [ ] User settings/preferences page
- [ ] Multi-user support (admin-only currently)
- [ ] Rate limiting / usage quotas
- [ ] Response copy-to-clipboard
- [ ] Response editing before posting
- [ ] Direct Reddit posting integration

### Partially implemented
- [x] AI response generation (works, but responses not editable)
- [x] Response persistence (saves to DB, loads on page refresh)
- [x] Opportunity hiding (works, but no bulk actions)

### Technical debt
- [ ] Monolithic page component needs decomposition
- [ ] Dead API routes to remove (`/scan/request`, `/opportunities` root)
- [ ] Duplicated constants (subreddits, keywords) between worker and API
- [ ] No error boundaries or loading states
- [ ] No input validation/sanitization
- [ ] No test coverage
- [ ] Unused `openai` dependency
- [ ] Outdated `supabase-schema.sql` and `cleanup-plan.md` in root
- [ ] `poll-and-scan.sh` references non-existent paths

---

## 10. Security Observations

- Supabase RLS properly enforced on all tables
- Auth middleware guards dashboard routes
- Service role key properly server-side only
- **Concerns:**
  - No CSRF protection on API routes
  - No rate limiting
  - No input sanitization on scan parameters
  - `.env.local` and `.env.production` are in the repo (should be gitignored)
