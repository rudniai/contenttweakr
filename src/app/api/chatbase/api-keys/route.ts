import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/chatbase/db';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_api_keys')
      .select('id, prefix, created_at, revoked_at')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[api-keys] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[api-keys] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Generate new API key
    const key = 'cb_live_' + crypto.randomUUID().replace(/-/g, '');
    const prefix = key.slice(0, 12);
    const keyHash = createHash('sha256').update(key).digest('hex');

    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_api_keys')
      .insert({
        user_id: user.id,
        prefix,
        key_hash: keyHash,
      })
      .select('id, prefix, created_at')
      .single();

    if (error) {
      console.error('[api-keys] POST insert error:', error);
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }

    // Return the full key ONCE — it will never be shown again
    return NextResponse.json({ ...data, key }, { status: 201 });
  } catch (error) {
    console.error('[api-keys] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
