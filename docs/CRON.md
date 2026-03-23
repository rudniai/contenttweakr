# Scheduled Scanning (Cron)

## How It Works

Scheduled scanning uses Vercel Cron Jobs to automatically trigger Reddit scans for users who have enabled it.

### Architecture

1. **Vercel Cron** calls `POST /api/cron/scan` every 6 hours (at 00:00, 06:00, 12:00, 18:00 UTC)
2. The cron endpoint checks which users have scheduled scanning enabled and filters by their chosen frequency:
   - `every_6h` — scanned every 6 hours (every cron run)
   - `twice_daily` — scanned every 12 hours (at 00:00 and 12:00 UTC)
   - `daily` — scanned once per day (at 00:00 UTC)
3. For eligible users, it creates `scan_requests` rows with status `pending`
4. The local scanner worker picks up pending requests and executes them (same as manual scans)

### User Settings

Users control their scan frequency from the Settings page. The `scan_frequency` column in `user_settings` stores their preference. Default is `disabled`.

## Configuration

### CRON_SECRET

The cron endpoint is protected by a `CRON_SECRET` environment variable. Vercel automatically sends this as a Bearer token in the `Authorization` header for cron jobs.

1. Generate a secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add it to your Vercel project:
   ```bash
   vercel env add CRON_SECRET
   ```

3. For local development, add to `.env.local`:
   ```
   CRON_SECRET=your-secret-here
   ```

### Vercel Cron Configuration

The cron schedule is defined in `vercel.json`:

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

## Testing Locally

You can test the cron endpoint locally by calling it with curl:

```bash
curl -X POST http://localhost:3000/api/cron/scan \
  -H "Authorization: Bearer $CRON_SECRET"
```

This will create scan requests for any users with scheduled scanning enabled. Make sure the local scanner worker is running (`npm run scan`) to process them.

## Database Migration

Run migration `009_add_scan_frequency.sql` to add the `scan_frequency` column:

```sql
ALTER TABLE user_settings
ADD COLUMN scan_frequency TEXT DEFAULT 'disabled'
CHECK (scan_frequency IN ('disabled', 'daily', 'twice_daily', 'every_6h'));
```
