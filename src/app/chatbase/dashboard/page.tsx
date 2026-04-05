import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { listChatbots, type Chatbot } from '@/lib/chatbase/db';

export default async function ChatbaseDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // User is guaranteed by layout auth check, but keep for type safety
  if (!user) return null;

  let chatbots: Chatbot[] = [];
  try {
    chatbots = await listChatbots(user.id);
  } catch (err) {
    console.error('[chatbase/dashboard] listChatbots error:', err);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Chatbots</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and deploy your AI chatbots
          </p>
        </div>
        <Link
          href="/chatbase/dashboard/chatbots/new"
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
            href="/chatbase/dashboard/chatbots/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Chatbot
          </Link>
        </div>
      )}

      {/* Chatbot cards */}
      {chatbots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.map((bot) => (
            <Link
              key={bot.id}
              href={`/chatbase/dashboard/chatbots/${bot.id}`}
              className="group block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: bot.primary_color ?? '#6366f1' }}
                >
                  {bot.name.charAt(0).toUpperCase()}
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-gray-900 truncate">
                {bot.name}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Created{' '}
                {new Date(bot.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <div className="mt-3 flex gap-3">
                <Link
                  href={`/chatbase/dashboard/chatbots/${bot.id}/documents`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Documents
                </Link>
                <Link
                  href={`/chatbase/dashboard/chatbots/${bot.id}/conversations`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Conversations
                </Link>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
