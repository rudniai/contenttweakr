import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { listChatbots, getServiceClient, type Conversation, type ConversationTurn } from '@/lib/chatbase/db';
import ConversationsClient from './ConversationsClient';

export default async function GlobalConversationsPage() {
  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth error — treat as unauthenticated
  }

  if (!user) redirect('/chat/login');

  const chatbots = await listChatbots(user.id);
  const chatbotIds = chatbots.map((c) => c.id);

  const db = getServiceClient();

  let conversations: (Conversation & { chatbot_name: string; message_count: number; escalated: boolean })[] = [];

  if (chatbotIds.length > 0) {
    const { data: convs } = await db
      .from('cb_conversations')
      .select('*')
      .in('chatbot_id', chatbotIds)
      .order('updated_at', { ascending: false })
      .limit(500);

    const convList = (convs ?? []) as Conversation[];

    if (convList.length > 0) {
      const convIds = convList.map((c) => c.id);
      const { data: turns } = await db
        .from('cb_conversation_turns')
        .select('conversation_id, escalated')
        .in('conversation_id', convIds);

      const turnsByConv = new Map<string, { count: number; escalated: boolean }>();
      for (const t of turns ?? []) {
        const existing = turnsByConv.get(t.conversation_id) ?? { count: 0, escalated: false };
        turnsByConv.set(t.conversation_id, {
          count: existing.count + 1,
          escalated: existing.escalated || t.escalated,
        });
      }

      const chatbotMap = new Map(chatbots.map((c) => [c.id, c.name]));

      conversations = convList.map((conv) => ({
        ...conv,
        chatbot_name: chatbotMap.get(conv.chatbot_id) ?? 'Unknown',
        message_count: turnsByConv.get(conv.id)?.count ?? 0,
        escalated: turnsByConv.get(conv.id)?.escalated ?? false,
      }));
    }
  }

  return <ConversationsClient conversations={conversations} chatbots={chatbots} />;
}
