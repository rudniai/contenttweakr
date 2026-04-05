import { notFound, redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getChatbot } from '@/lib/chatbase/db';
import ChatbotTabNav from './ChatbotTabNav';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ChatbotLayout({ children, params }: Props) {
  const { id } = await params;

  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // ignore
  }

  if (!user) redirect('/chat/login');

  let chatbot;
  try {
    chatbot = await getChatbot(id, user.id);
  } catch {
    chatbot = null;
  }
  if (!chatbot) notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{chatbot.name}</h1>
        <p className="text-xs text-gray-400 mt-0.5">ID: {chatbot.id}</p>
      </div>

      {/* Tabs */}
      <ChatbotTabNav chatbotId={id} />

      {/* Page content */}
      <div className="mt-6">{children}</div>
    </div>
  );
}
