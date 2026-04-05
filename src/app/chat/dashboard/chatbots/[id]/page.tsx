import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getChatbot } from '@/lib/chatbase/db';
import ChatbotEditor from './ChatbotEditor';

type Props = { params: Promise<{ id: string }> };

export default async function ChatbotPage({ params }: Props) {
  const { id } = await params;

  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth error — treat as unauthenticated
  }

  if (!user) redirect('/chat/login');

  let chatbot;
  try {
    chatbot = await getChatbot(id, user.id);
  } catch (err) {
    console.error('[chatbase/chatbot] getChatbot error:', err);
    chatbot = null;
  }
  if (!chatbot) notFound();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/chat/dashboard" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate max-w-xs">{chatbot.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{chatbot.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">ID: {chatbot.id}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/chat/dashboard/chatbots/${chatbot.id}/documents`}
            className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Documents
          </Link>
          <Link
            href={`/chat/dashboard/chatbots/${chatbot.id}/conversations`}
            className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Conversations
          </Link>
        </div>
      </div>

      <ChatbotEditor chatbot={chatbot} />
    </div>
  );
}
