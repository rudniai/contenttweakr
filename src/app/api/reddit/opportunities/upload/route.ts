import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    // Authenticate with service role key - only the local scanner uses this
    const authHeader = request.headers.get('authorization');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return NextResponse.json({ error: 'Unauthorized - service role key required' }, { status: 401 });
    }

    // Create a service role client that bypasses RLS
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

    const body = await request.json();
    const { scan_request_id, user_id, opportunities } = body;

    if (!scan_request_id || !user_id || !Array.isArray(opportunities)) {
      return NextResponse.json(
        { error: 'Missing required fields: scan_request_id, user_id, opportunities[]' },
        { status: 400 }
      );
    }

    // Upsert opportunities
    if (opportunities.length > 0) {
      const rows = opportunities.map((opp: {
        subreddit: string;
        title: string;
        url: string;
        context?: string;
        confidence: number;
        upvotes: number;
        comments: number;
        date?: string;
      }) => ({
        user_id,
        subreddit: opp.subreddit,
        title: opp.title,
        url: opp.url,
        context: opp.context || '',
        confidence: opp.confidence,
        upvotes: opp.upvotes,
        comments: opp.comments,
        scanned_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from('opportunities')
        .upsert(rows, { onConflict: 'user_id,url' });

      if (upsertError) {
        console.error('Error upserting opportunities:', upsertError);
        return NextResponse.json({ error: 'Failed to save opportunities' }, { status: 500 });
      }
    }

    // Update scan request status
    const { error: updateError } = await supabase
      .from('scan_requests')
      .update({
        status: 'completed',
        result_count: opportunities.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan_request_id);

    if (updateError) {
      console.error('Error updating scan request:', updateError);
      return NextResponse.json({ error: 'Failed to update scan request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: opportunities.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
