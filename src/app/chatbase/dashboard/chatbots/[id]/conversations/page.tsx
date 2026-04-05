import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getChatbot, getServiceClient, type Conversation } from '@/lib/chatbase/db';

type Props = { params: Promise<{ id: string }> };

export default async function ConversationsPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const chatbot = await getChatbot(id, user.id);
  if (!chatbot) notFound();

  const db = getServiceClient();
  const { data: conversations } = await db
    .from('cb_conversations')
    .select('*')
    .eq('chatbot_id', id)
    .order('created_at', { ascending: false })
    .limit(100);

  const convList = (conversations ?? []) as Conversation[];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/chatbase/dashboard" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href={`/chatbase/dashboard/chatbots/${id}`}
          className="hover:text-indigo-600 transition-colors truncate max-w-xs"
        >
          {chatbot.name}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Conversations</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <span className="text-sm text-gray-400">{convList.length} total</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {convList.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10 text-gray-300 mx-auto mb-3"
            >
              <path
                fillRule="evenodd"
                d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-gray-400">No conversations yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Conversations will appear here once users start chatting.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {convList.map((conv, index) => (
              <li key={conv.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600 flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-700 truncate">
                    {conv.session_id}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(conv.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
