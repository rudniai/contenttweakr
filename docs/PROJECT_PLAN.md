# Project Plan

## Product Overview

ContentTweakr is a Reddit marketing intelligence tool that:
1. Scans targeted subreddits for posts where a product/service could be naturally recommended
2. Scores opportunities by relevance and engagement potential
3. Generates authentic, context-aware responses using Claude AI
4. Tracks responses and manages the outreach pipeline

**Target user:** Solo founders, marketers, and small teams doing organic Reddit marketing.

---

## Architecture Summary

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Next.js UI  │────▸│  API Routes   │────▸│   Supabase    │
│  (React 18)  │◂────│  (Vercel)     │◂────│  (PostgreSQL) │
└─────────────┘     └──────┬───────┘     └───────────────┘
                           │                      ▲
                           ▼                      │
                    ┌──────────────┐               │
                    │  Claude API   │               │
                    │  (Anthropic)  │               │
                    └──────────────┘               │
                                                   │
                    ┌──────────────┐               │
                    │ Local Worker  │───────────────┘
                    │ (Node.js)    │──▸ Reddit JSON API
                    └──────────────┘
```

**Key pattern:** Polling-based job queue via `scan_requests` table. The local worker picks up pending jobs, scans Reddit, and writes results. The UI polls for completion.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | React 18 + Tailwind CSS 3.4 |
| Components | Radix UI + shadcn/ui pattern |
| Auth | Supabase Auth (email/password) |
| Database | Supabase (PostgreSQL) with RLS |
| AI | Anthropic Claude (Sonnet 4.5) |
| Deployment | Vercel (frontend + API) |
| Worker | Local Node.js script (tsx) |
| Icons | Lucide React |

---

## Current State vs Target State

| Feature | Current | Target |
|---------|---------|--------|
| Reddit scanning | Manual trigger, local worker | Scheduled cron, cloud worker |
| Subreddits | 16 hardcoded | User-configurable |
| Keywords | Hardcoded | User-configurable per product |
| AI responses | Generate + save | Generate + edit + copy + post |
| Reply tracking | None | Track replied posts |
| Platforms | Reddit only | Reddit + HN + Product Hunt |
| Users | Single admin | Multi-tenant with plans |
| Notifications | None | Email/webhook on new opportunities |
| Analytics | None | Dashboard with metrics |
| Testing | None | Unit + integration tests |
| UI structure | Monolithic page | Component-based |

---

## Phased Delivery Plan

### Phase 0: Stabilize (Current Sprint)
- Remove dead code and unused dependencies
- Extract monolithic page into components
- Add input validation to API routes
- Remove duplicate constants (subreddits, keywords)
- Clean up legacy files

### Phase 1: Core Polish
- User-configurable subreddits and keywords
- Response editing and copy-to-clipboard
- Reply tracking (mark as responded)
- Bulk actions on opportunities (hide, delete)
- Loading states and error boundaries
- Basic test coverage

### Phase 2: Automation
- Scheduled scanning (cron via Vercel or external)
- Email/webhook notifications for high-confidence opportunities
- Auto-refresh dashboard
- Scan history and comparison

### Phase 3: Scale
- Multi-user support with roles
- Usage quotas and rate limiting
- Analytics dashboard
- Hacker News + Product Hunt support
- Direct Reddit posting (OAuth integration)

### Phase 4: Growth
- Subscription billing
- Team collaboration features
- API access for power users
- Custom AI prompt tuning
