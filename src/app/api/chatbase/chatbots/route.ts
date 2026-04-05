import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient, listChatbots } from '@/lib/chatbase/db';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const chatbots = await listChatbots(user.id);
    return NextResponse.json(chatbots);
  } catch (error) {
    console.error('[chatbots] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, system_prompt, welcome_message, primary_color, fallback_message } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_chatbots')
      .insert({
        user_id: user.id,
        name: name.trim(),
        system_prompt: system_prompt ?? null,
        welcome_message: welcome_message ?? null,
        primary_color: primary_color ?? null,
        fallback_message: fallback_message ?? null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[chatbots] POST insert error:', error);
      return NextResponse.json({ error: 'Failed to create chatbot' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[chatbots] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
