import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: scans, error } = await supabase
      .from('scan_requests')
      .select('id, status, hours, result_count, error, created_at, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading scan history:', error);
      return NextResponse.json({ error: 'Failed to load scan history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, scans: scans || [] });
  } catch (error) {
    console.error('Scan history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
