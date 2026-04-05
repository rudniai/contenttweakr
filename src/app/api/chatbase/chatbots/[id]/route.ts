import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient, getChatbot } from '@/lib/chatbase/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const chatbot = await getChatbot(id, user.id);
    if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error('[chatbots/[id]] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const chatbot = await getChatbot(id, user.id);
    if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const allowedFields = ['name', 'system_prompt', 'welcome_message', 'primary_color', 'fallback_message'] as const;
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_chatbots')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('[chatbots/[id]] PATCH error:', error);
      return NextResponse.json({ error: 'Failed to update chatbot' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[chatbots/[id]] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const chatbot = await getChatbot(id, user.id);
    if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();
    const { error } = await db
      .from('cb_chatbots')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[chatbots/[id]] DELETE error:', error);
      return NextResponse.json({ error: 'Failed to delete chatbot' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[chatbots/[id]] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
