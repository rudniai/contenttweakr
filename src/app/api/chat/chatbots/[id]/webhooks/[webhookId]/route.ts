import { NextRequest, NextResponse } from 'next/server';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getServiceClient } from '@/lib/chatbase/db';

type Params = { params: Promise<{ id: string; webhookId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const supabase = createChatbaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, webhookId } = await params;

    const db = getServiceClient();

    const { data: existing, error: fetchError } = await db
      .from('cb_webhooks')
      .select('id')
      .eq('id', webhookId)
      .eq('chatbot_id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const { error } = await db
      .from('cb_webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[webhooks/[webhookId]] DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[webhooks/[webhookId]] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = createChatbaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, webhookId } = await params;
    const body = await request.json();

    const db = getServiceClient();

    const { data: existing, error: fetchError } = await db
      .from('cb_webhooks')
      .select('id')
      .eq('id', webhookId)
      .eq('chatbot_id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.enabled === 'boolean') updates.enabled = body.enabled;
    if (body.url) updates.url = body.url;
    if (Array.isArray(body.events)) updates.events = body.events;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from('cb_webhooks')
      .update(updates)
      .eq('id', webhookId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('[webhooks/[webhookId]] PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[webhooks/[webhookId]] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
