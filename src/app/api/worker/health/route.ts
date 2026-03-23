import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('worker_state')
      .select('last_heartbeat, status, current_scan_id, metadata, updated_at')
      .eq('id', 'singleton')
      .single();

    if (error || !data) {
      return NextResponse.json({
        healthy: false,
        status: 'unknown',
        message: 'Worker state not found',
      });
    }

    const lastHeartbeat = data.last_heartbeat ? new Date(data.last_heartbeat) : null;
    const now = new Date();
    const staleSecs = lastHeartbeat ? (now.getTime() - lastHeartbeat.getTime()) / 1000 : Infinity;

    const healthy = staleSecs < 300; // 5 minutes
    const alert = staleSecs > 300;

    return NextResponse.json({
      healthy,
      alert,
      status: data.status,
      lastHeartbeat: data.last_heartbeat,
      staleSecs: Math.round(staleSecs),
      currentScanId: data.current_scan_id,
      metadata: data.metadata,
    });
  } catch (error) {
    console.error('[worker/health] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
