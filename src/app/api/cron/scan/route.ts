import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type ScanFrequency = 'disabled' | 'daily' | 'twice_daily' | 'every_6h';

const FREQUENCY_HOURS: Record<Exclude<ScanFrequency, 'disabled'>, number> = {
  daily: 24,
  twice_daily: 12,
  every_6h: 6,
};

export async function POST(request: NextRequest) {
  // Verify cron secret (Vercel sends this header for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  try {
    // Get all users with scheduled scanning enabled
    const { data: users, error: usersError } = await supabase
      .from('user_settings')
      .select('user_id, scan_frequency')
      .neq('scan_frequency', 'disabled')
      .not('scan_frequency', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users with scheduled scanning', triggered: 0 });
    }

    // Filter users whose scan frequency matches this cron interval (every 6h)
    // daily = scan once per day (only at 00:00 UTC)
    // twice_daily = scan every 12h (at 00:00 and 12:00 UTC)
    // every_6h = scan every 6h (at 00:00, 06:00, 12:00, 18:00 UTC)
    const currentHour = new Date().getUTCHours();
    const eligibleUsers = users.filter((u) => {
      const freq = u.scan_frequency as ScanFrequency;
      if (freq === 'every_6h') return true; // runs every 6h, always eligible
      if (freq === 'twice_daily') return currentHour % 12 === 0;
      if (freq === 'daily') return currentHour === 0;
      return false;
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No users due for scan this cycle', triggered: 0 });
    }

    // Create scan requests for eligible users
    const scanRequests = eligibleUsers.map((u) => ({
      user_id: u.user_id,
      hours: FREQUENCY_HOURS[u.scan_frequency as Exclude<ScanFrequency, 'disabled'>] ?? 24,
      status: 'pending' as const,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('scan_requests')
      .insert(scanRequests)
      .select('id, user_id');

    if (insertError) {
      console.error('Error creating scan requests:', insertError);
      return NextResponse.json({ error: 'Failed to create scan requests' }, { status: 500 });
    }

    console.log(`Cron: triggered ${inserted?.length ?? 0} scans for eligible users`);

    return NextResponse.json({
      message: 'Scans triggered',
      triggered: inserted?.length ?? 0,
      users: inserted?.map((r) => r.user_id) ?? [],
    });
  } catch (error) {
    console.error('Cron scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
