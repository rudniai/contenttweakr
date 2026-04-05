import Link from 'next/link';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { listChatbots, getServiceClient, type Chatbot } from '@/lib/chatbase/db';
import ChatbotList from './ChatbotList';

export default async function ChatbaseDashboardPage() {
  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error('[chatbase/dashboard] auth.getUser error:', err);
  }

  if (!user) return null;

  let chatbots: Chatbot[] = [];
  try {
    chatbots = await listChatbots(user.id);
  } catch (err) {
    console.error('[chatbase/dashboard] listChatbots error:', err);
  }

  // Analytics
  const chatbotIds = chatbots.map((c) => c.id);
  let analytics = {
    totalConversations: 0,
    totalMessages: 0,
    messagesToday: 0,
    messagesThisWeek: 0,
    escalationRate: 0,
    topQuestions: [] as { question: string; count: number }[],
  };

  if (chatbotIds.length > 0) {
    try {
      const db = getServiceClient();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get all conversation IDs for this user
      const { data: convRows, count: convCount } = await db
        .from('cb_conversations')
        .select('id', { count: 'exact' })
        .in('chatbot_id', chatbotIds);

      analytics.totalConversations = convCount ?? 0;
      const convIds = (convRows ?? []).map((c: { id: string }) => c.id);

      if (convIds.length > 0) {
        const [turnsResult, todayResult, weekResult] = await Promise.allSettled([
          db.from('cb_conversation_turns').select('escalated').in('conversation_id', convIds),
          db.from('cb_conversation_turns')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .gte('created_at', todayStart),
          db.from('cb_conversation_turns')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .gte('created_at', weekStart),
        ]);

        if (turnsResult.status === 'fulfilled' && turnsResult.value.data) {
          const turns = turnsResult.value.data as { escalated: boolean }[];
          analytics.totalMessages = turns.length;
          const escalated = turns.filter((t) => t.escalated).length;
          analytics.escalationRate = turns.length > 0 ? Math.round((escalated / turns.length) * 100) : 0;
        }
        if (todayResult.status === 'fulfilled') {
          analytics.messagesToday = todayResult.value.count ?? 0;
        }
        if (weekResult.status === 'fulfilled') {
          analytics.messagesThisWeek = weekResult.value.count ?? 0;
        }
      }
    } catch (err) {
      console.error('[chatbase/dashboard] analytics error:', err);
    }
  }

  const metrics = [
    { label: 'Total Conversations', value: analytics.totalConversations.toLocaleString() },
    { label: 'Total Messages', value: analytics.totalMessages.toLocaleString() },
    { label: 'Messages Today', value: analytics.messagesToday.toLocaleString() },
    { label: 'Messages This Week', value: analytics.messagesThisWeek.toLocaleString() },
    { label: 'Escalation Rate', value: `${analytics.escalationRate}%` },
    { label: 'Active Chatbots', value: chatbots.length.toLocaleString() },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your AI chatbots
          </p>
        </div>
        <Link
          href="/chat/dashboard/chatbots/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New Chatbot
        </Link>
      </div>

      {/* Analytics metrics */}
      {chatbots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{m.label}</p>
              <p className="text-2xl font-bold text-gray-900">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {chatbots.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-12 h-12 text-gray-300"
            >
              <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
              <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            No chatbots yet
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Create your first chatbot to get started.
          </p>
          <Link
            href="/chat/dashboard/chatbots/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Chatbot
          </Link>
        </div>
      )}

      {/* Chatbots section */}
      {chatbots.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Chatbots</h2>
          </div>
          <ChatbotList chatbots={chatbots} />
        </>
      )}
    </div>
  );
}
