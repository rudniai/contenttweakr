import { NextRequest, NextResponse } from 'next/server';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getServiceClient, listChatbots, getUserPlanLimits } from '@/lib/chatbase/db';

export async function GET() {
  try {
    const supabase = createChatbaseServerClient();
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
    const supabase = createChatbaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, system_prompt, welcome_message, primary_color, fallback_message } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Enforce chatbot limit based on user's plan
    const plan = await getUserPlanLimits(user.id);
    if (plan?.chatbot_limit != null) {
      const existing = await listChatbots(user.id);
      if (existing.length >= plan.chatbot_limit) {
        return NextResponse.json(
          {
            error: `Your ${plan.name} plan allows ${plan.chatbot_limit} chatbot${plan.chatbot_limit === 1 ? '' : 's'}. Upgrade to create more.`,
            code: 'chatbot_limit_exceeded',
          },
          { status: 403 }
        );
      }
    }

    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_chatbots')
      .insert({
        user_id: user.id,
        name: name.trim(),
        system_prompt: system_prompt ?? '',
        welcome_message: welcome_message ?? 'Hi! How can I help?',
        primary_color: primary_color ?? '#6366f1',
        fallback_message: fallback_message ?? '',
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
