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
| 10 | User-configurable subreddit list | TODO | M | DB migration | Settings page needed |
| 11 | User-configurable keyword list | TODO | M | DB migration, #10 | Part of settings |
| 12 | Loading states and error boundaries | DONE | M | #6 | ErrorBoundary, ErrorAlert, loading skeletons |
| 13 | Bulk actions (hide/delete multiple) | DONE | M | #6 | Select all, bulk hide/replied/delete with confirmation |
| 14 | Scan history page | DONE | M | None | History page, scan_id FK, nav bar |
| 15 | Add `updated_at` to all tables | DONE | S | DB migration | Migration 007, auto-update triggers |

## P2 — Nice to Have / Later

| # | Task | Status | Effort | Dependencies | Notes |
|---|------|--------|--------|--------------|-------|
| 16 | Scheduled scanning (cron) | TODO | L | Worker hosting | Vercel cron or external |
| 17 | Email notifications for high-confidence opps | TODO | L | #16 | Email provider needed |
| 18 | Sentiment analysis (skip toxic threads) | TODO | M | None | Claude or rule-based |
| 19 | Hacker News support | TODO | L | Architecture | New scanner module |
| 20 | Product Hunt support | TODO | L | Architecture | New scanner module |
| 21 | Analytics dashboard | TODO | L | Data collection | Track response rates, etc. |
| 22 | Multi-user / multi-tenant | TODO | XL | Auth overhaul | Billing, roles, quotas |
| 23 | Direct Reddit posting (OAuth) | TODO | XL | Reddit app registration | Complex OAuth flow |
| 24 | Test coverage (unit + integration) | TODO | L | None | Start with API routes |
| 25 | Rate limiting on API routes | TODO | M | None | Per-user throttling |

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

---

**Effort key:** S = hours, M = 1-2 days, L = 3-5 days, XL = 1+ weeks
