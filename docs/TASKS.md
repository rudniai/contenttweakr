# Task Board

## P0 — Critical / Do First

| # | Task | Status | Effort | Dependencies | Notes |
|---|------|--------|--------|--------------|-------|
| 1 | Remove dead API routes (`/scan/request`, `/opportunities` root) | DONE | S | None | Dead code |
| 2 | Remove unused `openai` dependency | DONE | S | None | |
| 3 | Extract constants (subreddits, keywords) into shared config | DONE | S | None | `src/lib/reddit/config.ts` |
| 4 | Delete legacy files (`supabase-schema.sql`, `cleanup-plan.md`, `poll-and-scan.sh`) | DONE | S | None | Deleted |
| 5 | Add input validation to API routes | DONE | M | None | Zod schemas in `src/lib/validations/` |
| 6 | Break up `reddit-finder/page.tsx` into components | DONE | L | None | Extracted ScanControls, OpportunityCard, OpportunityList, Filters |

## P1 — Important / Do Next

| # | Task | Status | Effort | Dependencies | Notes |
|---|------|--------|--------|--------------|-------|
| 7 | Copy-to-clipboard for generated responses | DONE | S | None | Async with error handling |
| 8 | Response editing before use | DONE | M | None | Inline edit with save/cancel, restore original |
| 9 | Reply tracking (mark opportunity as "responded") | DONE | M | DB migration | `replied_at` column, mark-replied API, filter in UI |
| 10 | User-configurable subreddit list | DONE | M | DB migration | Settings page with tag input UI |
| 11 | User-configurable keyword list | DONE | M | DB migration, #10 | Part of settings page |
| 12 | Loading states and error boundaries | DONE | M | #6 | ErrorBoundary, ErrorAlert, loading skeletons |
| 13 | Bulk actions (hide/delete multiple) | DONE | M | #6 | Select all, bulk hide/replied/delete with confirmation |
| 14 | Scan history page | DONE | M | None | History page, scan_id FK, nav bar |
| 15 | Add `updated_at` to all tables | DONE | S | DB migration | Migration 007, auto-update triggers |

## P2 — Nice to Have / Later

| # | Task | Status | Effort | Dependencies | Notes |
|---|------|--------|--------|--------------|-------|
| 16 | Scheduled scanning (cron) | DONE | L | Worker hosting | Vercel cron every 6h, user-configurable frequency |
| 17 | Email notifications for high-confidence opps | DONE | L | #16 | Resend integration, configurable threshold, test endpoint |
| 18 | Sentiment analysis (skip toxic threads) | DONE | M | None | Keyword-based sentiment scoring, skip toxic threads setting |
| 19 | Hacker News support | DONE | L | Architecture | HN API client, scorer, platform filter, settings toggle |
| 20 | Product Hunt support | BLOCKED | L | Architecture | Requires Product Hunt API approval + complex OAuth |
| 21 | Analytics dashboard | DONE | L | Data collection | Server component, date range filter, platform/subreddit breakdown |
| 22 | Multi-user / multi-tenant | TODO | XL | Auth overhaul | Billing, roles, quotas |
| 23 | Direct Reddit posting (OAuth) | TODO | XL | Reddit app registration | Complex OAuth flow |
| 24 | Test coverage (unit + integration) | DONE | L | None | 98 tests: scoring, config/validation, API routes, components |
| 25 | Rate limiting on API routes | DONE | M | None | In-memory sliding window, per-user throttling |
| 26 | Robust worker daemon | DONE | M | None | Auto-restart, logging, PID management, heartbeat monitoring |
| 27 | Opus response generation | DONE | M | None | Model selector (Sonnet/Opus), model badge on responses |
| 28 | Delete/regenerate responses | DONE | M | None | Delete API, trash icon, regenerate button, confirmation dialog |

## Already Complete

| # | Task | Status | Notes |
|---|------|--------|-------|
| ✓ | Supabase auth (email/password) | DONE | Login page + middleware guard |
| ✓ | Reddit scanning (16 subreddits) | DONE | Local worker + API route |
| ✓ | Opportunity scoring (0-100) | DONE | Keyword + pattern matching |
| ✓ | AI response generation (Claude) | DONE | Sonnet 4.5, saves to DB |
| ✓ | Opportunity hiding | DONE | Hide/unhide with toggle |
| ✓ | Scan job queue (async workflow) | DONE | scan_requests table + polling |
| ✓ | RLS on all tables | DONE | User-scoped data access |
| ✓ | Dark theme UI | DONE | Tailwind + custom styles |
| ✓ | Response persistence | DONE | Saves to DB, loads on refresh |
| ✓ | Worker daemon | DONE | Auto-restart, heartbeat, health API |
| ✓ | Opus model support | DONE | Model selector, badge, stored in DB |
| ✓ | Delete/regenerate responses | DONE | Delete API, regenerate, confirmation |

---

**Effort key:** S = hours, M = 1-2 days, L = 3-5 days, XL = 1+ weeks
