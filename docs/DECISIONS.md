# Architectural Decisions

## ADR-1: Local Worker Instead of Vercel Serverless

**Decision:** Reddit scanning runs via a local Node.js script (`scripts/local-scanner.ts`) rather than Vercel API routes.

**Rationale:** Vercel free tier has a 10-30 second function timeout. Scanning 16 subreddits with 3-6 second rate-limiting delays takes 60-120 seconds. The local worker has no timeout constraints.

**Trade-offs:**
- (+) No timeout issues, reliable scanning
- (+) Easy to debug locally
- (-) Requires a running machine (no fully serverless deployment)
- (-) Not suitable for multi-user production without a hosted worker

**Status:** Active. Future options: Vercel Pro (300s timeout), Railway/Fly.io worker, or Supabase Edge Functions.

---

## ADR-2: Polling-Based Job Queue via Supabase

**Decision:** Use a `scan_requests` table as a job queue. UI creates pending records, worker polls for them, UI polls for completion.

**Rationale:** Simple, no additional infrastructure. Supabase is already in the stack. Avoids needing Redis, SQS, or a message broker.

**Trade-offs:**
- (+) Zero additional dependencies
- (+) Built-in persistence and auditability
- (-) 30-second polling interval adds latency
- (-) No push notifications (requires Supabase Realtime to improve)

**Status:** Active. Could upgrade to Supabase Realtime subscriptions for instant updates.

---

## ADR-3: Reddit JSON API (No OAuth)

**Decision:** Fetch Reddit data via public JSON endpoints (`reddit.com/r/{sub}/new.json`) without OAuth.

**Rationale:** No Reddit app registration needed. Simpler setup. Sufficient for read-only scanning.

**Trade-offs:**
- (+) No API key management
- (+) Works immediately
- (-) Rate limited more aggressively (hence 3-6s delays)
- (-) Cannot post replies programmatically
- (-) Limited to public subreddits

**Status:** Active. Reddit OAuth needed for Phase 3 (direct posting).

---

## ADR-4: Claude Sonnet for Response Generation

**Decision:** Use Claude Sonnet 4 (`claude-sonnet-4-20250514`) for generating Reddit responses, configurable via `AI_MODEL` env var.

**Rationale:** Sonnet balances quality and cost. Opus available for higher quality if needed.

**Trade-offs:**
- (+) Good quality responses at lower cost
- (+) Model easily swappable via env var
- (-) Sonnet occasionally produces less nuanced responses

**Status:** Active.

---

## ADR-5: Supabase Auth (Admin-Only)

**Decision:** Email/password auth via Supabase. No public signup — admin creates accounts.

**Rationale:** Single-user tool initially. No need for registration flow, password reset, or social login.

**Trade-offs:**
- (+) Minimal auth code
- (+) RLS ties data to authenticated user
- (-) No self-service onboarding
- (-) Must add registration flow for multi-user

**Status:** Active. Will need expansion for multi-tenant.

---

## ADR-6: Monolithic Page Component

**Decision:** (Implicit) The main UI is a single ~800-line client component.

**Rationale:** Rapid prototyping — fastest way to get a working UI.

**Trade-offs:**
- (-) Hard to maintain and test
- (-) Large client bundle
- (-) No code splitting

**Status:** Technical debt. Scheduled for decomposition (Task #6).

---

## Open Questions

1. **Worker hosting for production** — Where should the scanner run in production? Options: Vercel Pro (longer timeout), Railway, Fly.io, self-hosted VPS, Supabase Edge Functions.

2. **Multi-product support** — Should each user be able to configure multiple products with different keyword sets? Affects DB schema.

3. **Reddit OAuth** — When to integrate? Needed for direct posting and higher rate limits. Adds complexity (token refresh, app review).

4. **Notification strategy** — Email vs webhook vs in-app? Which provider? Resend, SendGrid, or Supabase built-in?

5. **Billing model** — Per-scan, per-response, or subscription tiers? Affects architecture (usage tracking, quotas).

6. **Supabase Realtime** — Should we replace polling with Realtime subscriptions for scan status? Would improve UX but adds complexity.
