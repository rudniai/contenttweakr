import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get scan request
    const { data: scanRequest, error } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !scanRequest) {
      return NextResponse.json({ error: 'Scan request not found' }, { status: 404 });
    }

    const response: Record<string, unknown> = {
      id: scanRequest.id,
      status: scanRequest.status,
      hours: scanRequest.hours,
      result_count: scanRequest.result_count,
      error: scanRequest.error,
      created_at: scanRequest.created_at,
      completed_at: scanRequest.completed_at,
    };

    // If completed, also return the opportunities
    if (scanRequest.status === 'completed') {
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(50);

      response.opportunities = opportunities || [];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Scan status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
