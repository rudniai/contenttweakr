import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const hours = body.hours || 24;

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

    // Fire-and-forget: call the execute route on Vercel
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    fetch(`${baseUrl}/api/reddit/scan/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        scan_request_id: data.id,
        user_id: user.id,
        hours,
      }),
    }).catch(err => {
      console.error('Error triggering scan execution:', err);
    });

    return NextResponse.json({ id: data.id, status: 'pending' });
  } catch (error) {
    console.error('Scan trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
