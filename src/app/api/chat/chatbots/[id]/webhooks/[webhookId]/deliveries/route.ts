import { NextRequest, NextResponse } from 'next/server';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getServiceClient } from '@/lib/chatbase/db';

type Params = { params: Promise<{ id: string; webhookId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = createChatbaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, webhookId } = await params;

    const db = getServiceClient();

    // Verify webhook ownership
    const { data: webhook, error: fetchError } = await db
      .from('cb_webhooks')
      .select('id')
      .eq('id', webhookId)
      .eq('chatbot_id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const { data, error } = await db
      .from('cb_webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[deliveries] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[deliveries] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
