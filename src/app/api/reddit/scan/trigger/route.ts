import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanTriggerSchema } from '@/lib/validations/scan';
import { applyRateLimit, RATE_LIMITS } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimited = applyRateLimit(user.id, 'scan-trigger', RATE_LIMITS.scanTrigger);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = scanTriggerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { hours } = parsed.data;

    // Create scan request in DB
    const { data, error } = await supabase
      .from('scan_requests')
      .insert({
        user_id: user.id,
        hours,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating scan request:', error);
      return NextResponse.json({ error: 'Failed to create scan request' }, { status: 500 });
    }

    // Local worker will pick up pending scan_requests and execute them
    return NextResponse.json({ id: data.id, status: 'pending' });
  } catch (error) {
    console.error('Scan trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
