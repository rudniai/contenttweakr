# Task Board

## P0 — Critical / Do First

| # | Task | Status | Effort | Dependencies | Notes |
|---|------|--------|--------|--------------|-------|
| 1 | Remove dead API routes (`/scan/request`, `/opportunities` root) | TODO | S | None | Dead code |
| 2 | Remove unused `openai` dependency | TODO | S | None | |
| 3 | Extract constants (subreddits, keywords) into shared config | TODO | S | None | Duplicated in worker + execute route |
| 4 | Delete legacy files (`supabase-schema.sql`, `cleanup-plan.md`, `poll-and-scan.sh`) | TODO | S | None | Outdated |
| 5 | Add input validation to API routes | TODO | M | None | Sanitize user inputs |
| 6 | Break up `reddit-finder/page.tsx` into components | TODO | L | None | ~800 line monolith |

## P1 — Important / Do Next

| # | Task | Status | Effort | Dependencies | Notes |
|---|------|--------|--------|--------------|-------|
| 7 | Copy-to-clipboard for generated responses | TODO | S | None | |
| 8 | Response editing before use | TODO | M | None | Inline edit in UI |
| 9 | Reply tracking (mark opportunity as "responded") | TODO | M | DB migration | New column or table |
| 10 | User-configurable subreddit list | TODO | M | DB migration | Settings page needed |
| 11 | User-configurable keyword list | TODO | M | DB migration, #10 | Part of settings |
| 12 | Loading states and error boundaries | TODO | M | #6 | After component extraction |
| 13 | Bulk actions (hide/delete multiple) | TODO | M | #6 | UI + API changes |
| 14 | Scan history page | TODO | M | None | List past scans with results |
| 15 | Add `updated_at` to all tables | TODO | S | DB migration | For data hygiene |

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
