import { NextRequest, NextResponse } from 'next/server';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getServiceClient, getChatbot } from '@/lib/chatbase/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = createChatbaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const chatbot = await getChatbot(id, user.id);
    if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_webhooks')
      .select('*')
      .eq('chatbot_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[webhooks] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[webhooks] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = createChatbaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const chatbot = await getChatbot(id, user.id);
    if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const { url, events, secret } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_webhooks')
      .insert({
        chatbot_id: id,
        user_id: user.id,
        url,
        secret: secret ?? null,
        events: events ?? ['new_message', 'new_conversation', 'escalation'],
      })
      .select('*')
      .single();

    if (error) {
      console.error('[webhooks] POST error:', error);
      return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[webhooks] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
