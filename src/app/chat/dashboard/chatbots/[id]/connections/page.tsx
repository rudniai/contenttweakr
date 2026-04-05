import { notFound, redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getChatbot } from '@/lib/chatbase/db';
import ConnectionsClient from './ConnectionsClient';

type Props = { params: Promise<{ id: string }> };

export default async function ConnectionsPage({ params }: Props) {
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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">MCP Connections</h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect Model Context Protocol servers to give this chatbot access to external tools.
        </p>
      </div>
      <ConnectionsClient chatbotId={id} initialServers={chatbot.mcp_servers ?? []} />
    </div>
  );
}
