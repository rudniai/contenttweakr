# Deployment Guide

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Framework preset: **Next.js** (auto-detected)
5. Click "Deploy"

### 2. Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

#### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for cron jobs) | `eyJhbGci...` |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | `sk-ant-...` |

#### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_MODEL` | Claude model to use | `claude-sonnet-4-5-20250514` |
| `CRON_SECRET` | Secret to authenticate cron requests | *(required for scheduled scans)* |
| `RESEND_API_KEY` | Resend API key for email notifications | *(notifications disabled if not set)* |
| `RESEND_FROM_EMAIL` | Sender email address | `ContentTweakr <notifications@contenttweakr.com>` |

### 3. Database Setup

Ensure your Supabase project has all migrations applied:

```bash
# Apply in order via Supabase SQL Editor or CLI
supabase/migrations/001_opportunities.sql
supabase/migrations/002_opportunities_and_responses.sql
supabase/migrations/003_scan_requests.sql
supabase/migrations/004_add_hidden_column.sql
```

### 4. Cron Jobs

The project includes a `vercel.json` that configures automatic scanning:

```json
{
  "crons": [
    {
      "path": "/api/cron/scan",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs every 6 hours. The cron endpoint requires `CRON_SECRET` to be set.

> **Note:** Vercel Cron is available on Pro and Enterprise plans. On the Hobby plan, cron jobs run once per day.

### 5. Deploy

Push to `main` to trigger auto-deployment:

```bash
git push origin main
```

---

## Post-Deployment Verification

### Quick Smoke Test

1. **App loads**: Visit your Vercel URL — you should see the login page
2. **Auth works**: Log in with your Supabase credentials
3. **Dashboard loads**: Navigate to `/dashboard` — no errors in the console
4. **Settings page**: Go to `/dashboard/settings` — verify settings load/save
5. **Scan works**: Trigger a manual scan from Reddit Finder
6. **API health**: Check `/api/settings` returns a response (not a 500)

### Cron Verification

1. Go to **Vercel Dashboard → your project → Cron Jobs**
2. Verify the `/api/cron/scan` job is listed
3. Wait for the next scheduled run or trigger manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/scan
   ```
4. Check scan history in the dashboard for a new completed scan

### Email Notification Verification

1. Ensure `RESEND_API_KEY` is set in Vercel env vars
2. Go to Settings → enable email notifications
3. Click "Send Test Email"
4. Verify email arrives in your inbox

---

## Troubleshooting

### Build Fails
- Run `npm run build` locally to reproduce
- Check that all env vars are set (build requires `NEXT_PUBLIC_*` vars)

### Scans Not Running
- Verify `CRON_SECRET` matches between env vars and cron request
- Check Vercel function logs for errors
- On Hobby plan, cron only runs once/day

### Emails Not Sending
- Verify `RESEND_API_KEY` is valid
- Check that your sending domain is verified in Resend dashboard
- Check Vercel function logs for Resend errors

### Auth Issues
- Verify Supabase URL and anon key are correct
- Ensure the user exists in Supabase Auth
- Check that Supabase project is not paused (free tier pauses after inactivity)
