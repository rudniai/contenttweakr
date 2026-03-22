import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exec } from 'child_process';

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

    // Spawn worker process immediately (fire and forget)
    const workerPath = `${process.env.HOME}/.openclaw/workspace/scripts/reddit-scan-worker.mjs`;
    exec(`node "${workerPath}"`, (err, stdout, stderr) => {
      if (err) {
        console.error('Worker process error:', err);
      }
      if (stdout) console.log('Worker stdout:', stdout);
      if (stderr) console.error('Worker stderr:', stderr);
    });

    return NextResponse.json({ id: data.id, status: 'pending' });
  } catch (error) {
    console.error('Scan trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
