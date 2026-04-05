import { NextRequest, NextResponse } from 'next/server';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getServiceClient } from '@/lib/chatbase/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // ignore
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();

  // Verify the conversation belongs to one of this user's chatbots
  const { data: conv } = await db
    .from('cb_conversations')
    .select('id, chatbot_id')
    .eq('id', conversationId)
    .single();

  if (!conv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: chatbot } = await db
    .from('cb_chatbots')
    .select('id')
    .eq('id', conv.chatbot_id)
    .eq('user_id', user.id)
    .single();

  if (!chatbot) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: turns } = await db
    .from('cb_conversation_turns')
    .select('user_message, assistant_message, escalated, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return NextResponse.json({ turns: turns ?? [] });
}
