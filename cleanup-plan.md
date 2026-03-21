# ContentTweakr → Reddit Intel Cleanup Plan

## Files to DELETE (old content repurposing app):
- src/app/api/repurpose/route.ts
- src/app/auth/signup/page.tsx (no signup allowed)
- src/app/auth/login/page.tsx (replaced by new homepage)
- Old dashboard/page.tsx content

## Files to KEEP/UPDATE:
- src/app/page.tsx → Replace with Opus login design
- src/app/dashboard/reddit-finder/page.tsx → Keep (main feature)
- src/app/api/reddit/opportunities/route.ts → Keep
- src/app/api/reddit/generate-response/route.ts → Add (from Opus)
- src/lib/* → Keep (Supabase client)
- src/components/ui/* → Keep

## Database Schema Changes:
- Remove usage_tracking table (not needed)
- Keep auth.users (Supabase)

## Branding Updates:
- App name: "Reddit Intel"
- Meta tags: Reddit Marketing Intelligence
- Favicon: Blue "R" logo

## Dashboard Simplification:
- Remove content repurposing UI entirely
- Make reddit-finder the default/only dashboard page
- Simplify layout, remove unnecessary nav items
